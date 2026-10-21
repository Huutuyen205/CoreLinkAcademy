// Người dùng và liên kết phụ huynh–học sinh (UC-012, FR-013, FR-014).
import type { Prisma, Role, UserStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { hashPassword } from "@/server/auth/password";
import { assertCan, canChangeRoleOrStatus, canCreateUserWithRole } from "@/server/auth/policy";
import { revokeUserSessions, type Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { generateTempPassword, isUniqueViolation, nextStudentCode, withStudentCodeRetry } from "./credentials";
import { canAddGuardian, MAX_GUARDIANS } from "./rules";

export type UserInput = { fullName: string; email: string | null; phone: string | null; role: Role; gradeLevel: number | null };

function uniqueError(error: unknown): never {
  if (isUniqueViolation(error, "email")) throw new DomainError("DUPLICATE_EMAIL", "Email đã được dùng.", { email: "Email đã được dùng." });
  if (isUniqueViolation(error, "phone")) throw new DomainError("DUPLICATE_PHONE", "Số điện thoại đã được dùng.", { phone: "Số điện thoại đã được dùng." });
  throw error;
}

/** API-008: tạo tài khoản với mật khẩu tạm (hiển thị một lần), bắt đổi ở lần đăng nhập đầu. */
export async function createUser(actor: Actor, input: UserInput): Promise<{ id: string; password: string; login: string; studentCode: string | null }> {
  if (!canCreateUserWithRole(actor.role, input.role)) throw new ForbiddenError();
  if (!input.email && !input.phone) {
    throw new DomainError("NO_LOGIN", "Cần email hoặc số điện thoại để đăng nhập.", { email: "Nhập email hoặc số điện thoại.", phone: "Nhập email hoặc số điện thoại." });
  }
  const password = generateTempPassword();
  const passwordHash = await hashPassword(password);
  try {
    const user = await withStudentCodeRetry(() =>
      db.$transaction(async (tx) => {
        const studentCode = input.role === "STUDENT" ? await nextStudentCode(tx) : null;
        return tx.user.create({
          data: {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            role: input.role,
            gradeLevel: input.role === "STUDENT" ? input.gradeLevel : null,
            studentCode,
            passwordHash,
            mustChangePassword: true,
          },
        });
      }),
    );
    await writeAudit({ actorId: actor.id, action: "user.create", entity: "User", entityId: user.id, detail: { role: user.role } });
    return { id: user.id, password, login: (input.email ?? input.phone)!, studentCode: user.studentCode };
  } catch (error) {
    uniqueError(error);
  }
}

/** API-008: sửa thông tin; đổi vai trò chỉ Admin, không tự đổi, ghi audit (FR-013). */
export async function updateUser(actor: Actor, userId: string, input: UserInput): Promise<void> {
  assertCan(actor, "user.manage");
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, studentCode: true } });
  if (!user) throw new ForbiddenError();
  if (!input.email && !input.phone) throw new DomainError("NO_LOGIN", "Cần email hoặc số điện thoại để đăng nhập.", { email: "Nhập email hoặc số điện thoại." });
  const roleChanged = input.role !== user.role;
  if (roleChanged && !canChangeRoleOrStatus(actor, userId)) {
    throw new DomainError("CANNOT_MODIFY_SELF", "Bạn không thể tự đổi vai trò của chính mình.", { role: "Không thể tự đổi vai trò." });
  }
  try {
    await withStudentCodeRetry(() =>
      db.$transaction(async (tx) => {
        const studentCode = input.role === "STUDENT" && !user.studentCode ? await nextStudentCode(tx) : undefined;
        await tx.user.update({
          where: { id: userId },
          data: { fullName: input.fullName, email: input.email, phone: input.phone, role: input.role, gradeLevel: input.role === "STUDENT" ? input.gradeLevel : null, ...(studentCode ? { studentCode } : {}) },
        });
        if (roleChanged) {
          await writeAudit({ actorId: actor.id, action: "user.role_change", entity: "User", entityId: userId, detail: { from: user.role, to: input.role } }, tx);
        }
      }),
    );
  } catch (error) {
    uniqueError(error);
  }
  if (roleChanged) await revokeUserSessions(userId);
}

/** API-008: khóa/mở khóa; Admin không tự khóa (T-10). Khóa → thu hồi phiên ngay. */
export async function setUserStatus(actor: Actor, userId: string, status: UserStatus): Promise<void> {
  assertCan(actor, "user.manage");
  if (!canChangeRoleOrStatus(actor, userId)) throw new DomainError("CANNOT_MODIFY_SELF", "Bạn không thể tự khóa tài khoản của chính mình.");
  const user = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw new ForbiddenError();
  if (user.status === status) return;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status, ...(status === "ACTIVE" ? { failedLoginCount: 0, lockedUntil: null } : {}) } });
    await writeAudit({ actorId: actor.id, action: status === "DISABLED" ? "user.disable" : "user.enable", entity: "User", entityId: userId, detail: { from: user.status, to: status } }, tx);
  });
  if (status === "DISABLED") await revokeUserSessions(userId);
}

/** API-008: đặt lại mật khẩu tạm. */
export async function resetPassword(actor: Actor, userId: string): Promise<{ password: string; login: string }> {
  assertCan(actor, "user.manage");
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } });
  if (!user) throw new ForbiddenError();
  const login = user.email ?? user.phone;
  if (!login) throw new DomainError("NO_LOGIN", "Tài khoản chưa có email/SĐT. Hãy bổ sung trước khi đặt lại mật khẩu.");
  const password = generateTempPassword();
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), mustChangePassword: true, failedLoginCount: 0, lockedUntil: null } });
  await revokeUserSessions(userId);
  await writeAudit({ actorId: actor.id, action: "user.reset_password", entity: "User", entityId: userId });
  return { password, login };
}

export type UserFilter = { role?: Role; status?: UserStatus; q?: string; page: number };
export const USER_PAGE_SIZE = 25;

export async function listUsers(actor: Actor, filter: UserFilter) {
  assertCan(actor, "user.manage");
  const q = filter.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }, { phone: { contains: q.replace(/^0/, "") } }, { studentCode: { contains: q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      skip: (filter.page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, studentCode: true, lockedUntil: true },
    }),
  ]);
  return { total, rows };
}

export async function getUser(actor: Actor, userId: string) {
  assertCan(actor, "user.manage");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      gradeLevel: true,
      studentCode: true,
      mustChangePassword: true,
      lockedUntil: true,
      createdAt: true,
      childLinks: { select: { student: { select: { id: true, fullName: true, studentCode: true } } } },
      parentLinks: { select: { parent: { select: { id: true, fullName: true, phone: true } } } },
    },
  });
  if (!user) throw new ForbiddenError();
  return user;
}

/** Trang Học viên cho Staff/Admin: học sinh kèm phụ huynh đã liên kết. */
export async function listLearners(actor: Actor, q: string | undefined, page: number) {
  assertCan(actor, "guardian.manage");
  const query = q?.trim();
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    ...(query ? { OR: [{ fullName: { contains: query } }, { studentCode: { contains: query } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        gradeLevel: true,
        status: true,
        email: true,
        phone: true,
        parentLinks: { select: { parent: { select: { id: true, fullName: true, phone: true } } } },
        enrollments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, select: { class: { select: { id: true, code: true } } } },
      },
    }),
  ]);
  return { total, rows };
}

export async function listParents(actor: Actor) {
  assertCan(actor, "guardian.manage");
  return db.user.findMany({ where: { role: "PARENT", status: "ACTIVE" }, orderBy: { fullName: "asc" }, take: 500, select: { id: true, fullName: true, phone: true } });
}

/** API-009 — FR-014. */
export async function linkGuardian(actor: Actor, parentId: string, studentId: string): Promise<void> {
  assertCan(actor, "guardian.manage");
  await db.$transaction(async (tx) => {
    const [parent, student] = await Promise.all([
      tx.user.findFirst({ where: { id: parentId, role: "PARENT" }, select: { id: true } }),
      tx.user.findFirst({ where: { id: studentId, role: "STUDENT" }, select: { id: true } }),
    ]);
    if (!parent) throw new DomainError("INVALID", "Phụ huynh không hợp lệ.", { parentId: "Chọn phụ huynh." });
    if (!student) throw new ForbiddenError();
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${studentId} FOR UPDATE`;
    const existing = await tx.guardianship.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
    if (existing) throw new DomainError("ALREADY_LINKED", "Phụ huynh này đã được liên kết.");
    const count = await tx.guardianship.count({ where: { studentId } });
    if (!canAddGuardian(count)) throw new DomainError("MAX_GUARDIANS", `Mỗi học sinh có tối đa ${MAX_GUARDIANS} phụ huynh.`);
    await tx.guardianship.create({ data: { parentId, studentId } });
  });
}

export async function unlinkGuardian(actor: Actor, parentId: string, studentId: string): Promise<void> {
  assertCan(actor, "guardian.manage");
  await db.guardianship.deleteMany({ where: { parentId, studentId } });
}

/** Con đã liên kết của phụ huynh đang đăng nhập. */
export async function listMyChildren(actor: Actor) {
  if (actor.role !== "PARENT") throw new ForbiddenError();
  const links = await db.guardianship.findMany({
    where: { parentId: actor.id, student: { status: "ACTIVE" } },
    orderBy: { student: { fullName: "asc" } },
    select: { student: { select: { id: true, fullName: true, gradeLevel: true, studentCode: true } } },
  });
  return links.map((l) => l.student);
}
