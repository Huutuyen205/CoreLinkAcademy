// Tài khoản cá nhân (PH §8, GV §11B "Xem/Cập nhật thông tin cá nhân" — FR-051).
import { writeAudit } from "@/server/audit/log";
import { verifyPassword } from "@/server/auth/password";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { isUniqueViolation } from "@/server/users/credentials";

export async function getMyAccount(actor: Actor) {
  return db.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      studentCode: true,
      gradeLevel: true,
      expertise: true,
      dateOfBirth: true,
      createdAt: true,
      childLinks: { select: { student: { select: { fullName: true, studentCode: true } } } },
      parentLinks: { select: { parent: { select: { fullName: true, phone: true } } } },
    },
  });
}

export type ContactInput = { email: string | null; phone: string | null; address: string | null; currentPassword: string };

/**
 * Tự cập nhật liên hệ. Email/SĐT là định danh đăng nhập → đổi phải nhập mật khẩu hiện tại và ghi audit.
 * Họ tên, vai trò, mã HS do trung tâm quản lý (không tự sửa).
 */
export async function updateMyContact(actor: Actor, input: ContactInput): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: actor.id }, select: { email: true, phone: true, passwordHash: true, role: true } });
  const loginChanged = input.email !== user.email || input.phone !== user.phone;
  if (!input.email && !input.phone && user.role !== "STUDENT") {
    throw new DomainError("NO_LOGIN", "Cần giữ email hoặc số điện thoại để đăng nhập.", { email: "Nhập email hoặc số điện thoại." });
  }
  if (loginChanged && !(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new DomainError("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng.", { currentPassword: "Mật khẩu không đúng." });
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: actor.id }, data: { email: input.email, phone: input.phone, address: input.address } });
      if (loginChanged) {
        await writeAudit({ actorId: actor.id, action: "user.contact_change", entity: "User", entityId: actor.id, detail: { emailChanged: input.email !== user.email, phoneChanged: input.phone !== user.phone } }, tx);
      }
    });
  } catch (error) {
    if (isUniqueViolation(error, "email")) throw new DomainError("DUPLICATE_EMAIL", "Email đã được dùng.", { email: "Email đã được dùng." });
    if (isUniqueViolation(error, "phone")) throw new DomainError("DUPLICATE_PHONE", "Số điện thoại đã được dùng.", { phone: "Số điện thoại đã được dùng." });
    throw error;
  }
}
