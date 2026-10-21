// Đào tạo: lớp, buổi, ghi danh, lịch tuần (FR-017..FR-022).
import type { ClassStatus, EnrollmentStatus, Prisma } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCan } from "@/server/auth/policy";
import { cached, CACHE_TAGS } from "@/server/cache";
import { assertCanViewClass, isManager, linkedStudentIds } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db, type Tx } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { isUniqueViolation } from "@/server/users/credentials";
import { findConflicts, generateSessions, spanOf, type Interval } from "@/lib/schedule";
import { formatDateTime } from "@/lib/time";
import { enrollInTx } from "./enrollment";
import { canChangeClass, canChangeEnrollment, SEAT_STATUSES } from "./rules";

export type ClassInput = {
  courseId: string;
  code: string;
  teacherId: string;
  roomId: string | null;
  startDate: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  totalSessions: number;
  capacity: number;
};

export type ConflictItem = { kind: "teacher" | "room"; classCode: string; startsAt: Date; endsAt: Date };

/** Buổi đã có (không hủy) của GV/phòng chồng với các khoảng mới. */
async function scheduleConflicts(
  tx: Tx,
  candidates: Interval[],
  who: { teacherId: string; roomId: string | null },
  excludeSessionId?: string,
): Promise<ConflictItem[]> {
  const span = spanOf(candidates);
  if (!span) return [];
  const existing = await tx.classSession.findMany({
    where: {
      status: { not: "CANCELLED" },
      startsAt: { lt: span.endsAt },
      endsAt: { gt: span.startsAt },
      OR: [{ teacherId: who.teacherId }, ...(who.roomId ? [{ roomId: who.roomId }] : [])],
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    select: { id: true, startsAt: true, endsAt: true, status: true, teacherId: true, roomId: true, class: { select: { code: true } } },
  });
  const out: ConflictItem[] = [];
  const seen = new Set<string>();
  for (const { existing: e } of findConflicts(candidates, existing)) {
    const kinds: ("teacher" | "room")[] = [];
    if (e.teacherId === who.teacherId) kinds.push("teacher");
    if (who.roomId && e.roomId === who.roomId) kinds.push("room");
    for (const kind of kinds) {
      const key = `${kind}:${e.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind, classCode: e.class.code, startsAt: e.startsAt, endsAt: e.endsAt });
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export class ScheduleConflictError extends DomainError {
  constructor(readonly conflicts: ConflictItem[]) {
    super(
      "SCHEDULE_CONFLICT",
      `Trùng lịch ${conflicts.length} buổi. Vui lòng đổi giờ, giáo viên hoặc phòng.`,
      undefined,
      conflicts.slice(0, 30).map(describeConflict),
    );
  }
}

function describeConflict(c: ConflictItem): string {
  return `${c.kind === "teacher" ? "Giáo viên" : "Phòng"} đã có lớp ${c.classCode} lúc ${formatDateTime(c.startsAt)}`;
}

/** API-011 — FR-017, FR-018: sinh buổi, chặn trùng GV/phòng, lưu lớp + buổi trong một transaction. */
export async function createClass(actor: Actor, input: ClassInput): Promise<string> {
  assertCan(actor, "class.manage");
  const [course, teacher, room] = await Promise.all([
    db.course.findUnique({ where: { id: input.courseId }, select: { id: true } }),
    db.user.findFirst({ where: { id: input.teacherId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    input.roomId ? db.room.findUnique({ where: { id: input.roomId }, select: { id: true, capacity: true } }) : null,
  ]);
  if (!course) throw new DomainError("INVALID", "Khóa học không hợp lệ.", { courseId: "Chọn khóa học." });
  if (!teacher) throw new DomainError("INVALID", "Giáo viên không hợp lệ.", { teacherId: "Chọn giáo viên." });
  if (input.roomId && !room) throw new DomainError("INVALID", "Phòng không hợp lệ.", { roomId: "Chọn phòng." });
  if (room && input.capacity > room.capacity) {
    throw new DomainError("CAPACITY_OVER_ROOM", "Sĩ số vượt sức chứa phòng.", { capacity: `Phòng chỉ chứa ${room.capacity} học sinh.` });
  }

  const sessions = generateSessions({
    startDate: input.startDate,
    weekdays: input.weekdays,
    startTime: input.startTime,
    endTime: input.endTime,
    total: input.totalSessions,
  });

  try {
    return await db.$transaction(async (tx) => {
      const conflicts = await scheduleConflicts(tx, sessions, input);
      if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
      const klass = await tx.class.create({
        data: {
          courseId: input.courseId,
          code: input.code,
          teacherId: input.teacherId,
          roomId: input.roomId,
          startDate: new Date(`${input.startDate}T00:00:00.000Z`),
          weekdays: input.weekdays.join(","),
          startTime: input.startTime,
          endTime: input.endTime,
          totalSessions: input.totalSessions,
          capacity: input.capacity,
        },
      });
      await tx.classSession.createMany({
        data: sessions.map((s) => ({ ...s, classId: klass.id, teacherId: input.teacherId, roomId: input.roomId })),
      });
      return klass.id;
    });
  } catch (error) {
    if (isUniqueViolation(error, "code")) throw new DomainError("DUPLICATE_CODE", "Mã lớp đã tồn tại.", { code: "Mã lớp đã tồn tại." });
    throw error;
  }
}

/** API-012. Hoàn thành: ghi danh ACTIVE → COMPLETED. Hủy: các buổi chưa diễn ra → CANCELLED. */
export async function setClassStatus(actor: Actor, classId: string, to: ClassStatus): Promise<void> {
  assertCan(actor, "class.manage");
  await db.$transaction(async (tx) => {
    const klass = await tx.class.findUnique({ where: { id: classId }, select: { status: true } });
    if (!klass) throw new ForbiddenError();
    if (!canChangeClass(klass.status, to)) throw new DomainError("INVALID_TRANSITION", "Không thể chuyển lớp sang trạng thái này.");
    await tx.class.update({ where: { id: classId }, data: { status: to } });
    if (to === "COMPLETED") {
      await tx.enrollment.updateMany({ where: { classId, status: "ACTIVE" }, data: { status: "COMPLETED" } });
    }
    if (to === "CANCELLED") {
      await tx.classSession.updateMany({
        where: { classId, status: "SCHEDULED", startsAt: { gt: new Date() } },
        data: { status: "CANCELLED", cancelReason: "Lớp bị hủy" },
      });
    }
  });
}

/** Xóa lớp chỉ khi chưa có ghi danh (docs/10 §3). */
export async function deleteClass(actor: Actor, classId: string): Promise<void> {
  assertCan(actor, "class.manage");
  await db.$transaction(async (tx) => {
    // Khóa dòng lớp như enrollInTx: tránh trường hợp vừa kiểm tra "0 ghi danh" thì Staff khác ghi danh,
    // rồi lệnh xóa cascade mất luôn ghi danh mới.
    const locked = await tx.$queryRaw<{ id: string; code: string }[]>`SELECT "id", "code" FROM "classes" WHERE "id" = ${classId} FOR UPDATE`;
    if (locked.length === 0) throw new ForbiddenError();
    const enrollments = await tx.enrollment.count({ where: { classId } });
    if (enrollments > 0) throw new DomainError("HAS_ENROLLMENTS", "Lớp đã có ghi danh, chỉ có thể hủy lớp.");
    await tx.class.delete({ where: { id: classId } });
    await writeAudit({ actorId: actor.id, action: "class.delete", entity: "Class", entityId: classId, detail: { code: locked[0]!.code } }, tx);
  });
}

/** API-013 — FR-019. */
export async function enrollStudent(actor: Actor, classId: string, studentId: string): Promise<void> {
  assertCan(actor, "enrollment.manage");
  const student = await db.user.findFirst({ where: { id: studentId, role: "STUDENT" }, select: { id: true } });
  if (!student) throw new DomainError("INVALID", "Học sinh không hợp lệ.", { studentId: "Chọn học sinh." });
  await db.$transaction((tx) => enrollInTx(tx, classId, studentId));
}

/** API-013 — FR-020. */
export async function setEnrollmentStatus(actor: Actor, enrollmentId: string, to: EnrollmentStatus): Promise<string> {
  assertCan(actor, "enrollment.manage");
  const e = await db.enrollment.findUnique({ where: { id: enrollmentId }, select: { status: true, classId: true } });
  if (!e) throw new ForbiddenError();
  if (!canChangeEnrollment(e.status, to)) throw new DomainError("INVALID_TRANSITION", "Không thể chuyển ghi danh sang trạng thái này.");
  const { count } = await db.enrollment.updateMany({ where: { id: enrollmentId, status: e.status }, data: { status: to } });
  if (count === 0) throw new DomainError("STALE", "Ghi danh vừa được cập nhật. Vui lòng tải lại trang.");
  return e.classId;
}

/** API-014 — FR-021. */
export async function cancelSession(actor: Actor, sessionId: string, reason: string): Promise<string> {
  assertCan(actor, "class.manage");
  return db.$transaction(async (tx) => {
    const s = await tx.classSession.findUnique({ where: { id: sessionId }, select: { status: true, classId: true, startsAt: true } });
    if (!s) throw new ForbiddenError();
    // updateMany theo trạng thái: buổi vừa được điểm danh/hủy bởi người khác thì không ghi đè.
    const { count } = await tx.classSession.updateMany({ where: { id: sessionId, status: "SCHEDULED" }, data: { status: "CANCELLED", cancelReason: reason } });
    if (count === 0) throw new DomainError("INVALID_TRANSITION", "Chỉ hủy được buổi chưa diễn ra.");
    // FR-021, FR-035 (GAP-09): hủy buổi cũng được truy vết như dời buổi.
    await writeAudit({ actorId: actor.id, action: "session.cancel", entity: "ClassSession", entityId: sessionId, detail: { startsAt: s.startsAt.toISOString(), reason } }, tx);
    return s.classId;
  });
}

/** API-014 — FR-021: dời buổi cũng kiểm tra trùng lịch GV/phòng. */
export async function rescheduleSession(actor: Actor, sessionId: string, startsAt: Date, endsAt: Date, reason: string): Promise<string> {
  assertCan(actor, "class.manage");
  return db.$transaction(async (tx) => {
    const s = await tx.classSession.findUnique({
      where: { id: sessionId },
      select: { status: true, classId: true, teacherId: true, roomId: true, startsAt: true },
    });
    if (!s) throw new ForbiddenError();
    if (s.status !== "SCHEDULED") throw new DomainError("INVALID_TRANSITION", "Chỉ dời được buổi chưa diễn ra.");
    const conflicts = await scheduleConflicts(tx, [{ startsAt, endsAt }], s, sessionId);
    if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
    await tx.classSession.update({ where: { id: sessionId }, data: { startsAt, endsAt } });
    await writeAudit(
      { actorId: actor.id, action: "session.reschedule", entity: "ClassSession", entityId: sessionId, detail: { from: s.startsAt.toISOString(), to: startsAt.toISOString(), reason } },
      tx,
    );
    return s.classId;
  });
}

const seatCount = { _count: { select: { enrollments: { where: { status: { in: SEAT_STATUSES } } } } } } as const;

/** Danh sách lớp theo phạm vi: quản lý → tất cả; GV → lớp mình dạy. */
export async function listClasses(actor: Actor, filter: { status?: ClassStatus } = {}) {
  let where: Prisma.ClassWhereInput = filter.status ? { status: filter.status } : {};
  if (actor.role === "TEACHER") where = { ...where, teacherId: actor.id };
  else if (!isManager(actor)) throw new ForbiddenError();
  return db.class.findMany({
    where,
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    select: {
      id: true,
      code: true,
      status: true,
      startDate: true,
      weekdays: true,
      startTime: true,
      endTime: true,
      capacity: true,
      totalSessions: true,
      course: { select: { title: true } },
      teacher: { select: { fullName: true } },
      room: { select: { name: true } },
      ...seatCount,
    },
  });
}

export const CLASS_PAGE_SIZE = 50;

/** Danh sách lớp cho quản lý, có phân trang (lớp tích lũy qua các khóa). Cùng thứ tự và trường với listClasses. */
export async function listClassesPage(actor: Actor, filter: { status?: ClassStatus; page: number }) {
  assertCan(actor, "class.manage");
  const where: Prisma.ClassWhereInput = filter.status ? { status: filter.status } : {};
  const [total, rows] = await Promise.all([
    db.class.count({ where }),
    db.class.findMany({
      where,
      orderBy: [{ status: "asc" }, { startDate: "desc" }, { id: "asc" }],
      skip: (filter.page - 1) * CLASS_PAGE_SIZE,
      take: CLASS_PAGE_SIZE,
      select: {
        id: true,
        code: true,
        status: true,
        startDate: true,
        weekdays: true,
        startTime: true,
        endTime: true,
        capacity: true,
        totalSessions: true,
        course: { select: { title: true } },
        teacher: { select: { fullName: true } },
        room: { select: { name: true } },
        ...seatCount,
      },
    }),
  ]);
  return { total, rows };
}

export async function listEnrollableClasses(actor: Actor) {
  assertCan(actor, "enrollment.manage");
  const classes = await db.class.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: { code: "asc" },
    select: { id: true, code: true, capacity: true, course: { select: { title: true } }, ...seatCount },
  });
  return classes.filter((c) => c._count.enrollments < c.capacity);
}

/** Chi tiết lớp cho Staff/Admin. */
export async function getClassForManager(actor: Actor, classId: string) {
  assertCan(actor, "class.manage");
  const klass = await db.class.findUnique({
    where: { id: classId },
    include: {
      course: { select: { title: true, slug: true } },
      teacher: { select: { id: true, fullName: true } },
      room: { select: { name: true } },
      sessions: { orderBy: { index: "asc" }, include: { teacher: { select: { fullName: true } }, room: { select: { name: true } }, _count: { select: { attendances: true } } } },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        include: { student: { select: { id: true, fullName: true, studentCode: true, gradeLevel: true } } },
      },
    },
  });
  if (!klass) throw new ForbiddenError();
  return klass;
}

export async function classFormOptions(actor: Actor) {
  assertCan(actor, "class.manage");
  const [courses, teachers, rooms] = await Promise.all([
    db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, totalSessions: true } }),
    db.user.findMany({ where: { role: "TEACHER", status: "ACTIVE" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    db.room.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true } }),
  ]);
  return { courses, teachers, rooms };
}

/** Học sinh có thể ghi danh vào lớp (chưa có ghi danh còn hiệu lực), lọc theo tên/mã. */
export async function listStudentsForEnrollment(actor: Actor, classId: string, q?: string) {
  assertCan(actor, "enrollment.manage");
  const query = q?.trim();
  return db.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      enrollments: { none: { classId, status: { not: "DROPPED" } } },
      ...(query ? { OR: [{ fullName: { contains: query, mode: "insensitive" as const } }, { studentCode: { contains: query, mode: "insensitive" as const } }] } : {}),
    },
    orderBy: { fullName: "asc" },
    take: 100,
    select: { id: true, fullName: true, studentCode: true, gradeLevel: true },
  });
}

/** FR-022: buổi học trong khoảng thời gian theo phạm vi của actor. `studentId` dùng cho phụ huynh/quản lý. */
export async function listSessionsInRange(actor: Actor, from: Date, to: Date, studentId?: string) {
  const base: Prisma.ClassSessionWhereInput = { startsAt: { gte: from, lt: to } };
  let where: Prisma.ClassSessionWhereInput;
  if (actor.role === "TEACHER") {
    where = { ...base, OR: [{ teacherId: actor.id }, { class: { teacherId: actor.id } }] };
  } else if (actor.role === "STUDENT") {
    where = { ...base, class: { enrollments: { some: { studentId: actor.id, status: { in: ["ACTIVE", "PAUSED"] } } } } };
  } else if (actor.role === "PARENT") {
    if (!studentId || !(await linkedStudentIds(actor.id)).includes(studentId)) throw new ForbiddenError();
    where = { ...base, class: { enrollments: { some: { studentId, status: { in: ["ACTIVE", "PAUSED"] } } } } };
  } else {
    where = studentId ? { ...base, class: { enrollments: { some: { studentId } } } } : base;
  }
  return db.classSession.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      cancelReason: true,
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
      class: { select: { id: true, code: true, course: { select: { title: true } } } },
    },
  });
}

/** Số lớp đang tuyển/đang học trong MỘT query groupBy (trước: 2 query). */
export async function classCountsQuery(): Promise<{ open: number; running: number }> {
  const groups = await db.class.groupBy({ by: ["status"], where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, _count: { _all: true } });
  const of = (status: ClassStatus) => groups.find((g) => g.status === status)?._count._all ?? 0;
  return { open: of("OPEN"), running: of("IN_PROGRESS") };
}

const cachedClassCounts = cached(classCountsQuery, "dashboard:class-counts", { tags: [CACHE_TAGS.dashboard], revalidate: 300 });

export async function classCounts(actor: Actor) {
  assertCan(actor, "class.manage");
  return cachedClassCounts();
}

/** Chi tiết lớp cho giáo viên (lớp mình dạy hoặc có buổi dạy thay) — TC-035. */
export async function getClassForTeacher(actor: Actor, classId: string) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  await assertCanViewClass(actor, classId);
  const klass = await db.class.findUniqueOrThrow({
    where: { id: classId },
    include: {
      course: { select: { title: true } },
      room: { select: { name: true } },
      teacher: { select: { id: true, fullName: true } },
      sessions: { orderBy: { index: "asc" }, select: { id: true, index: true, startsAt: true, endsAt: true, status: true, teacherId: true, _count: { select: { attendances: true } } } },
      enrollments: {
        where: { status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } },
        orderBy: { student: { fullName: "asc" } },
        select: { status: true, student: { select: { id: true, fullName: true, studentCode: true } } },
      },
    },
  });
  return { ...klass, isOwner: klass.teacherId === actor.id };
}
