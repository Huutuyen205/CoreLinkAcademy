// FR-035: nhật ký audit chỉ thêm, không có hàm sửa/xóa.
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "@/server/db";

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  detail?: Prisma.InputJsonValue;
};

export async function writeAudit(entry: AuditEntry, tx: Tx = db): Promise<void> {
  await tx.auditLog.create({ data: entry });
}
