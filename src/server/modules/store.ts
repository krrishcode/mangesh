import { inArray } from 'drizzle-orm';
import { db } from '../db';
import { adminSettings } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { SUPPORT_EMAIL } from '../../lib/contact';

export async function storeContact(c: ApiContext) {
  const rows = await db.select().from(adminSettings).where(inArray(adminSettings.settingKey, ['support_email', 'support_phone']));
  const settings = Object.fromEntries(rows.map(row => [row.settingKey, row.value]));
  return json(c, { success: true, data: {
    email: settings.support_email || process.env.SUPPORT_EMAIL || SUPPORT_EMAIL,
    phone: settings.support_phone ?? process.env.SUPPORT_PHONE ?? '',
  } });
}
