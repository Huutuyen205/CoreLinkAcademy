// Hồ sơ giáo viên / học sinh / phụ huynh cho quản lý (Admin §2, §3, §4 — FR-036).
import type { MemberStatus, Prisma, Role, UserStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCan, can } from "@/server/auth/policy";
import { assertCanViewStudent, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { isUniqueViolation } from "@/server/users/credentials";

export const PEOPLE_PAGE_SIZE = 25;

function textSearch(q: string | undefined): Prisma.UserWhereInput {
  const query = q?.trim();
  if (!query) return {};
  return {
    OR: [
      { fullName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query.replace(/^0/, "") } },
      { studentCode: { contains: query, mode: "insensitive" } },
    ],
  };
}

/* ───────────── Giáo viên ───────────── */

export async function listTeachers(actor: Actor, filter: { q?: string; status?: MemberStatus; page: number }) {
  assertCan(actor, "staff.view");
  const where: Prisma.UserWhereInput = { role: "TEACHER", ...(filter.status ? { memberStatus: filter.status } : {}), ...textSearch(filter.q) };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (filter.page - 1) * PEOPLE_PAGE_SIZE,
      take: PEOPLE_PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        memberStatus: true,
        expertise: true,
        _count: { select: { teachingClasses: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } } } },
      },
    }),
  ]);
  return { total, rows };
}

export async function getTeacherProfile(actor: Actor, teacherId: string) {
  assertCan(actor, "staff.view");
  const t = await db.user.findFirst({
    where: { id: teacherId, role: "TEACHER" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      memberStatus: true,
      expertise: true,
      address: true,
      dateOfBirth: true,
      profileNote: true,
      createdAt: true,
      teachingClasses: {
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
        select: {
          id: true,
          code: true,
          status: true,
          startDate: true,
          weekdays: true,
          startTime: true,
          endTime: true,
          course: { select: { title: true } },
          _count: { select: { enrollments: { where: { status: { in: ["ACTIVE", "PAUSED"] } } } } },
        },
      },
    },
  });
  if (!t) throw new ForbiddenError();
  return t;
}

/* ───────────── Học sinh ───────────── */

/** Hồ sơ học sinh: quản lý xem đầy đủ; giáo viên xem học sinh lớp mình (Giáo viên §1 "Xem hồ sơ học sinh"). */
export async function getStudentProfile(actor: Actor, studentId: string) {
  if (!isManager(actor) && actor.role !== "TEACHER") throw new ForbiddenError();
  await assertCanViewStudent(actor, studentId);
  const s = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      memberStatus: true,
      studentCode: true,
      gradeLevel: true,
      dateOfBirth: true,
      address: true,
      profileNote: true,
      createdAt: true,
      parentLinks: { select: { relation: true, parent: { select: { id: true, fullName: true, phone: true, email: true } } } },
      enrollments: {
        where: actor.role === "TEACHER" ? { class: { teacherId: actor.id } } : {},
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          updatedAt: true,
          class: { select: { id: true, code: true, status: true, course: { select: { title: true } }, teacher: { select: { fullName: true } } } },
        },
      },
    },
  });
  if (!s) throw new ForbiddenError();
  return s;
}

/* ───────────── Phụ huynh ───────────── */

export async function listParentsPage(actor: Actor, filter: { q?: string; status?: UserStatus; noChild?: boolean; page: number }) {
  assertCan(actor, "guardian.manage");
  const where: Prisma.UserWhereInput = {
    role: "PARENT",
    ...textSearch(filter.q),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.noChild ? { childLinks: { none: {} } } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (filter.page - 1) * PEOPLE_PAGE_SIZE,
      take: PEOPLE_PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        childLinks: { select: { student: { select: { id: true, fullName: true, studentCode: true } } } },
      },
    }),
  ]);
  return { total, rows };
}

export async function getParentProfile(actor: Actor, parentId: string) {
  assertCan(actor, "guardian.manage");
  const p = await db.user.findFirst({
    where: { id: parentId, role: "PARENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      address: true,
      profileNote: true,
      createdAt: true,
      childLinks: {
        select: {
          relation: true,
          student: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              gradeLevel: true,
              enrollments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, select: { class: { select: { code: true } } } },
            },
          },
        },
      },
    },
  });
  if (!p) throw new ForbiddenError();
  return p;
}

/** Học sinh chưa liên kết với phụ huynh này (cho ô chọn "Liên kết thêm con"). */
export async function linkableStudents(actor: Actor, parentId: string) {
  assertCan(actor, "guardian.manage");
  return db.user.findMany({
    where: { role: "STUDENT", status: "ACTIVE", parentLinks: { none: { parentId } } },
    orderBy: { fullName: "asc" },
    take: 500,
    select: { id: true, fullName: true, studentCode: true },
  });
}

/* ───────────── Cập nhật hồ sơ ───────────── */

export type ProfileInput = {
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  memberStatus: MemberStatus;
  profileNote: string | null;
  expertise: string | null;
  gradeLevel: number | null;
};

/** Ai sửa hồ sơ ai: Admin sửa mọi vai trò; Staff sửa hồ sơ học sinh/phụ huynh (ASSUMPTION-A04). */
export function canEditProfile(actorRole: Role, targetRole: Role): boolean {
  if (can(actorRole, "user.manage")) return true;
  return can(actorRole, "guardian.manage") && (targetRole === "STUDENT" || targetRole === "PARENT");
}

export async function updateProfile(actor: Actor, userId: string, input: ProfileInput): Promise<Role> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, memberStatus: true } });
  if (!user || !canEditProfile(actor.role, user.role)) throw new ForbiddenError();
  if (!input.email && !input.phone && user.role !== "STUDENT") {
    throw new DomainError("NO_LOGIN", "Cần email hoặc số điện thoại để đăng nhập.", { email: "Nhập email hoặc số điện thoại." });
  }
  if (user.role === "STUDENT" && (input.gradeLevel === null || input.gradeLevel < 0 || input.gradeLevel > 12)) {
    throw new DomainError("INVALID", "Chọn khối lớp.", { gradeLevel: "Chọn khối lớp." });
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth,
          address: input.address,
          memberStatus: input.memberStatus,
          profileNote: input.profileNote,
          expertise: user.role === "TEACHER" ? input.expertise : null,
          ...(user.role === "STUDENT" ? { gradeLevel: input.gradeLevel } : {}),
        },
      });
      if (input.memberStatus !== user.memberStatus) {
        await writeAudit({ actorId: actor.id, action: "user.member_status", entity: "User", entityId: userId, detail: { from: user.memberStatus, to: input.memberStatus } }, tx);
      }
    });
  } catch (error) {
    if (isUniqueViolation(error, "email")) throw new DomainError("DUPLICATE_EMAIL", "Email đã được dùng.", { email: "Email đã được dùng." });
    if (isUniqueViolation(error, "phone")) throw new DomainError("DUPLICATE_PHONE", "Số điện thoại đã được dùng.", { phone: "Số điện thoại đã được dùng." });
    throw error;
  }
  return user.role;
}
