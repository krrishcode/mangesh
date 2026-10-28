# Transactional email setup — 28 October 2026

## Enabled scope

The application sends login/signup OTPs and password-reset links immediately through Hostinger. Account-created, order-placed and appointment booked/rescheduled/cancelled notifications use a persistent PostgreSQL outbox. There are no logistics, shipping, delivery, payment-receipt or marketing email triggers.

Sender: **Mangesh Mahadev <notifications@mangeshmahadev.com>**. Reply-To and customer-care inbox: **support@mangeshmahadev.com**. New-order and appointment notifications also create a separate internal copy for the support inbox. The support mailbox password is not used or stored by the application.

Hostinger's [official configuration](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/) specifies `smtp.hostinger.com`, port 465 with SSL. The configured transport validates certificates and requires TLS. Credentials are in the ignored local environment and the protected VPS worker environment, not source control.

## Implementation

- `src/server/lib/mail.ts`: shared SMTP delivery, Reply-To, HTML and plain-text OTP/reset messages.
- `src/server/lib/email-templates.ts`: welcome, order and appointment templates with escaped customer content and India-time appointment formatting.
- `src/server/db/sql/20261028_email_notifications.sql`: reviewed additive schema and triggers, applied to `mangesh` on the VPS. The outbox captures successful commits from customer and admin writes. Deferred order triggers read complete guest contact, checkout and item snapshots. Installation does not backfill existing customers or orders.
- `src/server/lib/email-queue.ts`: atomic claims using PostgreSQL `SKIP LOCKED`, retry backoff, five-attempt limit, ten-minute stale-lease recovery and deterministic SMTP Message-IDs. Normal repeated events are deduplicated. SMTP delivery is at-least-once: a process crash after provider acceptance but before recording success can still cause a repeat message.
- `src/components/SupportEmailLink.tsx` and `src/lib/contact.ts`: customer-care links share the support address and use the public store-contact setting where available. Footer, product enquiries, guest orders, order confirmation, legal pages, careers and account contact are updated.

OTP values and reset tokens are not persisted in the outbox. Existing OTP expiry, browser binding, resend limits and single-use checks remain in force. The development OTP bypass is disabled in the configured local environment.

## Worker

The VPS runs a dedicated **`mangesh-email-worker`** container, built from the worker bundle and a minimal Node runtime. It polls the public outbox every 15 seconds, sends batches of three and restarts automatically (`unless-stopped`). It exposes no public ports. Its environment file is `/data/mangesh-email-worker/.env`, restricted to the server administrator.

```bash
npm run mail:build
python scripts/deploy-email-worker.py
```

The deployment helper prompts for SSH credentials and transfers the SMTP/database environment over SSH. It validates ownership of an existing worker container and gracefully stops it before replacement. The bundle and secrets are excluded from the Docker build context as appropriate. Application frontend deployment is separate; these changes do not publish the website.

For a worker outside this VPS deployment, build first and use `npm run mail:worker` from the project root. The worker requires a configured database, SMTP and a correct email origin. In production set `APP_ORIGIN` and/or `EMAIL_APP_ORIGIN` to the site's real HTTPS origin. The deployed VPS worker uses `https://mangeshmahadev.com`; local development retains `http://localhost:3000` for local reset links.

For diagnosis, inspect `docker logs mangesh-email-worker` and the outbox's `status`, `attempts`, `next_attempt_at` and `last_error` fields. Provider response bodies and credentials are not logged. Terminally failed rows remain available for operator review. Retry only selected reviewed rows by resetting their status/attempts; do not resend previously completed messages in bulk. Retention cleanup for delivered outbox records should follow the store's data-retention policy.

The imported database's broader Drizzle baseline remains guarded; this email schema was applied with the explicit additive SQL script, not an unreviewed schema push.

## Verification

- SMTP TLS/authentication succeeded.
- A controlled setup email arrived in the support inbox; From and Reply-To were verified through read-only IMAP access.
- A real login/signup OTP arrived in the notifications inbox and matched the database challenge hash with development bypass off. The generated test challenge was removed without creating an account.
- Queue tests use the isolated `mangesh_qa` schema and an injected sender, so synthetic customer/staff messages are not sent. They cover transactional rollback, member/guest order snapshots, appointment transitions, deduplication, concurrent workers, SMTP failure/retry, retry exhaustion and stale leases.
- Worker health inspection confirmed public-schema database access, successful SMTP verification, zero restarts and no queue errors.
- Public DNS has Hostinger MX records, an SPF record, a DMARC record and all three Hostinger DKIM selector CNAMEs. This confirms record presence; inbox placement at every external mail provider is not guaranteed.
- Final checks passed: 265 unit/regression tests, 26 customer checks, 7 admin/OTP checks, 9 outbox integration checks, TypeScript and the production build.

Evidence is saved under ignored `artifacts/email-setup/`. `npx tsx scripts/verify-smtp.ts` sends one explicit setup message to the support inbox; other automated email tests use synthetic senders.
