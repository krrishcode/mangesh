import { and, eq } from "drizzle-orm";
import type { db } from "../db";
import { adminRecordArchives, auditLogs } from "../db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Call while holding the customer's row lock so new work and admin archiving
// cannot leave an active customer hidden in the operational list.
export async function restoreCustomerForActivity(tx: Tx, userId: number) {
  const key = and(
    eq(adminRecordArchives.entityType, "customers"),
    eq(adminRecordArchives.entityId, userId),
  );
  const [archived] = await tx
    .select()
    .from(adminRecordArchives)
    .where(key)
    .limit(1);
  if (!archived) return;
  await tx.delete(adminRecordArchives).where(key);
  await tx
    .insert(auditLogs)
    .values({
      actorId: userId,
      action: "customer.activity_restore",
      entityType: "customers",
      entityId: userId,
      details: JSON.stringify({
        reason: "Customer returned with a new order or appointment.",
      }),
    });
}
