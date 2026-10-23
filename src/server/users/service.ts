// Người dùng và liên kết phụ huynh–học sinh (UC-012, FR-013, FR-014).
import type { Prisma, Role, UserStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { hashPassword } from "@/server/auth/password";
import { assertCan, canChangeRoleOrStatus, canCreateUserWithRole } from "@/server/auth/policy";
import { revokeUserSessions, type Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { generateTempPassword, isUniqueViolation, nextStudentCode, withStudentCodeRetry } from "./credentials";
import type { ImportRow } from "./import";
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

/**
 * API-008: khóa/mở khóa; Admin không tự khóa (T-10). Khóa → thu hồi phiên ngay.
 * DECISION-D31: dây chuyền MỘT cấp giữa học sinh và phụ huynh đã liên kết, cả hai chiều —
 * khóa/mở học sinh thì khóa/mở luôn phụ huynh của em; khóa/mở phụ huynh thì khóa/mở luôn các con.
 * Trả số tài khoản liên kết đã đổi theo.
 */
export async function setUserStatus(actor: Actor, userId: string, status: UserStatus): Promise<{ linked: number }> {
  assertCan(actor, "user.manage");
  if (!canChangeRoleOrStatus(actor, userId)) throw new DomainError("CANNOT_MODIFY_SELF", "Bạn không thể tự khóa tài khoản của chính mình.");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, childLinks: { select: { studentId: true } }, parentLinks: { select: { parentId: true } } },
  });
  if (!user) throw new ForbiddenError();
  const linkedIds = user.role === "STUDENT" ? user.parentLinks.map((l) => l.parentId) : user.role === "PARENT" ? user.childLinks.map((l) => l.studentId) : [];
  const targets = [userId, ...linkedIds].filter((id) => id !== actor.id);
  const changed = await db.$transaction(async (tx) => {
    const rows = await tx.user.findMany({ where: { id: { in: targets }, status: { not: status } }, select: { id: true, status: true } });
    if (rows.length === 0) return [];
    await tx.user.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { status, ...(status === "ACTIVE" ? { failedLoginCount: 0, lockedUntil: null } : {}) } });
    for (const r of rows) {
      await writeAudit(
        { actorId: actor.id, action: status === "DISABLED" ? "user.disable" : "user.enable", entity: "User", entityId: r.id, detail: { from: r.status, to: status, ...(r.id !== userId ? { linkedTo: userId } : {}) } },
        tx,
      );
    }
    return rows.map((r) => r.id);
  });
  if (status === "DISABLED") await Promise.all(changed.map((id) => revokeUserSessions(id)));
  return { linked: changed.filter((id) => id !== userId).length };
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
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q.replace(/^0/, "") } }, { studentCode: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      skip: (filter.page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, studentCode: true, lockedUntil: true, mustChangePassword: true },
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
/** Lọc thêm: trạng thái tài khoản; `noParent` = chưa liên kết phụ huynh; `noClass` = chưa học lớp nào. */
export type LearnerFilter = { status?: UserStatus; noParent?: boolean; noClass?: boolean };

export async function listLearners(actor: Actor, q: string | undefined, page: number, filter: LearnerFilter = {}) {
  assertCan(actor, "guardian.manage");
  const query = q?.trim();
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.noParent ? { parentLinks: { none: {} } } : {}),
    ...(filter.noClass ? { enrollments: { none: { status: { in: ["ACTIVE", "PAUSED"] } } } } : {}),
    ...(query ? { OR: [{ fullName: { contains: query, mode: "insensitive" as const } }, { studentCode: { contains: query, mode: "insensitive" as const } }] } : {}),
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
    await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${studentId} FOR UPDATE`;
    const existing = await tx.guardianship.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
    if (existing) throw new DomainError("ALREADY_LINKED", "Phụ huynh này đã được liên kết.");
    const count = await tx.guardianship.count({ where: { studentId } });
    if (!canAddGuardian(count)) throw new DomainError("MAX_GUARDIANS", `Mỗi học sinh có tối đa ${MAX_GUARDIANS} phụ huynh.`);
    await tx.guardianship.create({ data: { parentId, studentId } });
    // Liên kết quyết định ai xem được dữ liệu của trẻ → ghi audit (FR-035).
    await writeAudit({ actorId: actor.id, action: "guardian.link", entity: "User", entityId: studentId, detail: { parentId } }, tx);
  });
}

export async function unlinkGuardian(actor: Actor, parentId: string, studentId: string): Promise<void> {
  assertCan(actor, "guardian.manage");
  await db.$transaction(async (tx) => {
    const { count } = await tx.guardianship.deleteMany({ where: { parentId, studentId } });
    if (count > 0) await writeAudit({ actorId: actor.id, action: "guardian.unlink", entity: "User", entityId: studentId, detail: { parentId } }, tx);
  });
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

/**
 * Admin §2: nhập danh sách học sinh. Tất cả hoặc không: một dòng trùng email/SĐT với tài khoản đã có → không tạo dòng nào.
 * Mật khẩu tạm từng em trả về một lần (giống tạo tài khoản đơn lẻ).
 */
export async function importStudents(actor: Actor, rows: ImportRow[]): Promise<{ fullName: string; studentCode: string; login: string; password: string }[]> {
  if (!canCreateUserWithRole(actor.role, "STUDENT")) throw new ForbiddenError();
  const phones = rows.map((r) => r.phone).filter((p): p is string => Boolean(p));
  const emails = rows.map((r) => r.email).filter((e): e is string => Boolean(e));
  const taken = await db.user.findMany({ where: { OR: [{ phone: { in: phones } }, { email: { in: emails } }] }, select: { phone: true, email: true } });
  if (taken.length > 0) {
    const details = rows
      .filter((r) => taken.some((t) => (r.phone && t.phone === r.phone) || (r.email && t.email === r.email)))
      .map((r) => `Dòng ${r.line}: ${r.fullName} — email/SĐT đã có tài khoản.`);
    throw new DomainError("DUPLICATE", "Một số dòng trùng email/SĐT với tài khoản đã có. Chưa nhập dòng nào.", undefined, details);
  }
  const prepared = await Promise.all(
    rows.map(async (r) => {
      const password = generateTempPassword();
      return { ...r, password, hash: await hashPassword(password) };
    }),
  );
  return withStudentCodeRetry(() =>
    db.$transaction(
      async (tx) => {
        const out: { fullName: string; studentCode: string; login: string; password: string }[] = [];
        const ids: string[] = [];
        for (const r of prepared) {
          const studentCode = await nextStudentCode(tx);
          const u = await tx.user.create({
            data: { fullName: r.fullName, gradeLevel: r.gradeLevel, phone: r.phone, email: r.email, role: "STUDENT", studentCode, passwordHash: r.hash, mustChangePassword: true },
            select: { id: true },
          });
          ids.push(u.id);
          out.push({ fullName: r.fullName, studentCode, login: r.email ?? r.phone ?? "— (chưa có email/SĐT)", password: r.password });
        }
        await writeAudit({ actorId: actor.id, action: "user.import", entity: "User", entityId: ids[0]!, detail: { count: ids.length, userIds: ids } }, tx);
        return out;
      },
      { timeout: 60_000 },
    ),
  );
}
