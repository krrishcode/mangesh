import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { deliverEmail } from './mail';
import { notificationContent, type NotificationData, type NotificationKind, type EmailContent } from './email-templates';

type QueueRow = { id: string; kind: NotificationKind; recipient: string; payload: NotificationData; attempts: number };
type Sender = (to: string, content: EmailContent, messageId?: string) => Promise<void>;
const kinds = new Set<NotificationKind>(['welcome', 'order_placed', 'appointment_booked', 'appointment_rescheduled', 'appointment_cancelled']);

export async function processOutboxBatch(pool: Pick<Pool, 'query'>, send: Sender = deliverEmail, batchSize = 3) {
  const token = randomUUID();
  const limit = Math.max(1, Math.min(20, Math.floor(batchSize)));
  const claimed = await pool.query<QueueRow>(`
    WITH jobs AS (
      SELECT id FROM email_outbox
      WHERE attempts < 5 AND (
        (status IN ('pending','failed') AND next_attempt_at <= now()) OR
        (status = 'sending' AND locked_at < now() - interval '10 minutes')
      ) ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT $1
    )
    UPDATE email_outbox e SET status='sending', attempts=e.attempts+1, locked_at=now(), lock_token=$2
    FROM jobs WHERE e.id=jobs.id RETURNING e.id,e.kind,e.recipient,e.payload,e.attempts`, [limit, token]);
  const outcomes: Array<{ id: string; status: 'sent' | 'failed' }> = [];
  for (const row of claimed.rows) {
    try {
      if (!kinds.has(row.kind)) throw new Error('Unsupported notification');
      const content = notificationContent(row.kind, row.payload);
      await send(row.recipient, content, `<mm-${row.id}@mangeshmahadev.com>`);
      await pool.query("UPDATE email_outbox SET status='sent',sent_at=now(),locked_at=NULL,lock_token=NULL,last_error=NULL WHERE id=$1 AND lock_token=$2", [row.id, token]);
      outcomes.push({ id: row.id, status: 'sent' });
    } catch (reason) {
      const error = reason as { code?: string; responseCode?: number };
      // Persist only a bounded error classification, never provider responses or credentials.
      const code = /^[A-Z_0-9]{1,40}$/.test(error.code || '') ? error.code : 'DELIVERY_FAILED';
      const retrySeconds = Math.min(3600, 60 * 2 ** (row.attempts - 1));
      await pool.query("UPDATE email_outbox SET status='failed',locked_at=NULL,lock_token=NULL,last_error=$3,next_attempt_at=now()+($4 * interval '1 second') WHERE id=$1 AND lock_token=$2", [row.id, token, code, retrySeconds]);
      outcomes.push({ id: row.id, status: 'failed' });
    }
  }
  return outcomes;
}
