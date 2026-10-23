// Vận hành lớp và lịch theo yêu cầu Admin §2, §6, §7, §8 (FR-037, FR-038): sửa lớp, dạy thay, học bù, chuyển lớp, lịch tổng.
import type { ClassStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCan } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { isUniqueViolation } from "@/server/users/credentials";
import { formatDateTime } from "@/lib/time";
import { enrollInTx } from "./enrollment";
import { SEAT_STATUSES } from "./rules";
import { notifySchedule, ScheduleConflictError, scheduleConflicts, seatCount } from "./service";

const CLOSED_CLASS: ClassStatus[] = ["COMPLETED", "CANCELLED"];

export type ClassUpdateInput = { code: string; teacherId: string; roomId: string | null; capacity: number };

/**
 * Sửa lớp: mã, sĩ số, giáo viên phụ trách, phòng. Đổi GV/phòng áp dụng cho các buổi CHƯA diễn ra
 * (buổi đang có GV dạy thay giữ nguyên người dạy thay); kiểm tra trùng lịch với lớp khác trước khi lưu.
 */
export async function updateClass(actor: Actor, classId: string, input: ClassUpdateInput): Promise<void> {
  assertCan(actor, "class.manage");
  const now = new Date();
  try {
    await db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "classes" WHERE "id" = ${classId} FOR UPDATE`;
      if (locked.length === 0) throw new ForbiddenError();
      const klass = await tx.class.findUniqueOrThrow({
        where: { id: classId },
        select: { code: true, status: true, teacherId: true, roomId: true, capacity: true, ...seatCount },
      });
      if (CLOSED_CLASS.includes(klass.status)) throw new DomainError("CLASS_CLOSED", "Lớp đã kết thúc hoặc đã hủy, không sửa được.");
      const [teacher, room] = await Promise.all([
        tx.user.findFirst({ where: { id: input.teacherId, role: "TEACHER", status: "ACTIVE" }, select: { id: true, fullName: true } }),
        input.roomId ? tx.room.findUnique({ where: { id: input.roomId }, select: { id: true, capacity: true, isActive: true, name: true } }) : null,
      ]);
      if (!teacher) throw new DomainError("INVALID", "Giáo viên không hợp lệ.", { teacherId: "Chọn giáo viên đang hoạt động." });
      if (input.roomId && (!room || (!room.isActive && room.id !== klass.roomId))) {
        throw new DomainError("INVALID", "Phòng không hợp lệ.", { roomId: "Chọn phòng đang hoạt động." });
      }
      if (input.capacity < klass._count.enrollments) {
        throw new DomainError("CAPACITY_BELOW_SEATS", "Sĩ số nhỏ hơn số học sinh hiện có.", { capacity: `Lớp đang có ${klass._count.enrollments} học sinh.` });
      }
      if (room && input.capacity > room.capacity) {
        throw new DomainError("CAPACITY_OVER_ROOM", "Sĩ số vượt sức chứa phòng.", { capacity: `Phòng chỉ chứa ${room.capacity} học sinh.` });
      }

      const teacherChanged = input.teacherId !== klass.teacherId;
      const roomChanged = input.roomId !== klass.roomId;
      if (teacherChanged || roomChanged) {
        const future = await tx.classSession.findMany({
          where: { classId, status: "SCHEDULED", startsAt: { gt: now } },
          select: { id: true, startsAt: true, endsAt: true, teacherId: true, roomId: true },
        });
        const teacherMoves = teacherChanged ? future.filter((s) => s.teacherId === klass.teacherId) : [];
        const roomMoves = roomChanged ? future.filter((s) => s.roomId === klass.roomId) : [];
        const conflicts = [
          ...(teacherMoves.length ? await scheduleConflicts(tx, teacherMoves, { teacherId: input.teacherId, roomId: null }, { classId }) : []),
          ...(roomMoves.length && input.roomId ? await scheduleConflicts(tx, roomMoves, { teacherId: null, roomId: input.roomId }, { classId }) : []),
        ];
        if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
        if (teacherMoves.length) await tx.classSession.updateMany({ where: { id: { in: teacherMoves.map((s) => s.id) } }, data: { teacherId: input.teacherId } });
        if (roomMoves.length) await tx.classSession.updateMany({ where: { id: { in: roomMoves.map((s) => s.id) } }, data: { roomId: input.roomId } });
      }
      await tx.class.update({ where: { id: classId }, data: { code: input.code, teacherId: input.teacherId, roomId: input.roomId, capacity: input.capacity } });
      await writeAudit(
        {
          actorId: actor.id,
          action: "class.update",
          entity: "Class",
          entityId: classId,
          detail: { before: { code: klass.code, teacherId: klass.teacherId, roomId: klass.roomId, capacity: klass.capacity }, after: input },
        },
        tx,
      );
      if (teacherChanged || roomChanged) {
        const parts = [teacherChanged ? `giáo viên phụ trách: ${teacher.fullName}` : null, roomChanged ? `phòng: ${room?.name ?? "chưa xếp"}` : null].filter(Boolean);
        await notifySchedule(tx, classId, "Thay đổi lớp học", `Từ các buổi sắp tới, ${parts.join(", ")}.`, teacherChanged ? [klass.teacherId] : []);
      }
    });
  } catch (error) {
    if (isUniqueViolation(error, "code")) throw new DomainError("DUPLICATE_CODE", "Mã lớp đã tồn tại.", { code: "Mã lớp đã tồn tại." });
    throw error;
  }
}

/** Admin §7: phân công giáo viên cho một buổi (dạy thay). Chỉ buổi chưa diễn ra; chặn trùng lịch GV. */
export async function assignSessionTeacher(actor: Actor, sessionId: string, teacherId: string, note: string | null): Promise<string> {
  assertCan(actor, "class.manage");
  return db.$transaction(async (tx) => {
    const s = await tx.classSession.findUnique({ where: { id: sessionId }, select: { classId: true, status: true, startsAt: true, endsAt: true, teacherId: true } });
    if (!s) throw new ForbiddenError();
    if (s.status !== "SCHEDULED" || s.startsAt <= new Date()) throw new DomainError("INVALID_TRANSITION", "Chỉ phân công được buổi chưa diễn ra.");
    if (s.teacherId === teacherId) return s.classId;
    const teacher = await tx.user.findFirst({ where: { id: teacherId, role: "TEACHER", status: "ACTIVE" }, select: { fullName: true } });
    if (!teacher) throw new DomainError("INVALID", "Giáo viên không hợp lệ.", { teacherId: "Chọn giáo viên." });
    const conflicts = await scheduleConflicts(tx, [s], { teacherId, roomId: null }, { sessionId });
    if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
    await tx.classSession.update({ where: { id: sessionId }, data: { teacherId, ...(note ? { note } : {}) } });
    await writeAudit({ actorId: actor.id, action: "session.assign_teacher", entity: "ClassSession", entityId: sessionId, detail: { from: s.teacherId, to: teacherId, note } }, tx);
    await notifySchedule(tx, s.classId, "Đổi giáo viên buổi học", `Buổi ${formatDateTime(s.startsAt)} do ${teacher.fullName} dạy.${note ? ` Ghi chú: ${note}` : ""}`, [teacherId, s.teacherId]);
    return s.classId;
  });
}

/** Admin §7 "Thiết lập thời gian và phòng học" cho một buổi: đổi phòng (chặn phòng ngừng dùng / trùng lịch phòng). */
export async function setSessionRoom(actor: Actor, sessionId: string, roomId: string | null): Promise<string> {
  assertCan(actor, "class.manage");
  return db.$transaction(async (tx) => {
    const s = await tx.classSession.findUnique({ where: { id: sessionId }, select: { classId: true, status: true, startsAt: true, endsAt: true, roomId: true } });
    if (!s) throw new ForbiddenError();
    if (s.status !== "SCHEDULED" || s.startsAt <= new Date()) throw new DomainError("INVALID_TRANSITION", "Chỉ đổi phòng được cho buổi chưa diễn ra.");
    if (s.roomId === roomId) return s.classId;
    const room = roomId ? await tx.room.findFirst({ where: { id: roomId, isActive: true }, select: { name: true } }) : null;
    if (roomId && !room) throw new DomainError("INVALID", "Phòng không hợp lệ hoặc đang tạm ngừng.", { roomId: "Chọn phòng khác." });
    if (roomId) {
      const conflicts = await scheduleConflicts(tx, [s], { teacherId: null, roomId }, { sessionId });
      if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
    }
    await tx.classSession.update({ where: { id: sessionId }, data: { roomId } });
    await writeAudit({ actorId: actor.id, action: "session.room", entity: "ClassSession", entityId: sessionId, detail: { from: s.roomId, to: roomId } }, tx);
    await notifySchedule(tx, s.classId, "Đổi phòng học", `Buổi ${formatDateTime(s.startsAt)} học tại ${room?.name ?? "phòng sẽ báo sau"}.`);
    return s.classId;
  });
}

export type MakeupInput = { startsAt: Date; endsAt: Date; teacherId: string | null; roomId: string | null; note: string | null };

/** Admin §7: xếp buổi học bù (thêm buổi vào cuối lớp). Chặn trùng lịch GV/phòng, ghi audit, thông báo lớp. */
export async function addMakeupSession(actor: Actor, classId: string, input: MakeupInput): Promise<void> {
  assertCan(actor, "class.manage");
  if (input.startsAt <= new Date()) throw new DomainError("IN_PAST", "Buổi học bù phải ở tương lai.", { date: "Chọn ngày trong tương lai." });
  await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "classes" WHERE "id" = ${classId} FOR UPDATE`;
    if (locked.length === 0) throw new ForbiddenError();
    const klass = await tx.class.findUniqueOrThrow({ where: { id: classId }, select: { status: true, teacherId: true, roomId: true } });
    if (CLOSED_CLASS.includes(klass.status)) throw new DomainError("CLASS_CLOSED", "Lớp đã kết thúc hoặc đã hủy.");
    const teacherId = input.teacherId ?? klass.teacherId;
    const roomId = input.roomId ?? klass.roomId;
    if (input.teacherId && !(await tx.user.findFirst({ where: { id: teacherId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }))) {
      throw new DomainError("INVALID", "Giáo viên không hợp lệ.", { teacherId: "Chọn giáo viên." });
    }
    if (input.roomId && !(await tx.room.findFirst({ where: { id: input.roomId, isActive: true }, select: { id: true } }))) {
      throw new DomainError("INVALID", "Phòng không hợp lệ.", { roomId: "Chọn phòng đang hoạt động." });
    }
    const conflicts = await scheduleConflicts(tx, [input], { teacherId, roomId });
    if (conflicts.length > 0) throw new ScheduleConflictError(conflicts);
    const last = await tx.classSession.aggregate({ where: { classId }, _max: { index: true } });
    const created = await tx.classSession.create({
      data: { classId, index: (last._max.index ?? 0) + 1, startsAt: input.startsAt, endsAt: input.endsAt, teacherId, roomId, isMakeup: true, note: input.note },
      select: { id: true },
    });
    await writeAudit(
      { actorId: actor.id, action: "session.makeup", entity: "ClassSession", entityId: created.id, detail: { classId, startsAt: input.startsAt.toISOString(), note: input.note } },
      tx,
    );
    await notifySchedule(tx, classId, "Lịch học bù", `Buổi học bù lúc ${formatDateTime(input.startsAt)}.${input.note ? ` ${input.note}` : ""}`, [teacherId]);
  });
}

/** Admin §2: chuyển học sinh sang lớp khác — ghi danh cũ DROPPED, ghi danh mới qua đủ kiểm tra FR-019, trong một transaction. */
export async function transferStudent(actor: Actor, enrollmentId: string, toClassId: string): Promise<{ studentId: string }> {
  assertCan(actor, "enrollment.manage");
  return db.$transaction(async (tx) => {
    const e = await tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { classId: true, studentId: true, status: true, class: { select: { code: true } } } });
    if (!e) throw new ForbiddenError();
    if (e.classId === toClassId) throw new DomainError("SAME_CLASS", "Hãy chọn lớp khác lớp hiện tại.", { toClassId: "Chọn lớp khác." });
    if (!SEAT_STATUSES.includes(e.status)) throw new DomainError("INVALID_TRANSITION", "Chỉ chuyển được học sinh đang học hoặc bảo lưu.");
    const { count } = await tx.enrollment.updateMany({ where: { id: enrollmentId, status: e.status }, data: { status: "DROPPED" } });
    if (count === 0) throw new DomainError("STALE", "Ghi danh vừa được cập nhật. Vui lòng tải lại trang.");
    await enrollInTx(tx, toClassId, e.studentId);
    const target = await tx.class.findUniqueOrThrow({ where: { id: toClassId }, select: { code: true } });
    await writeAudit({ actorId: actor.id, action: "enrollment.transfer", entity: "User", entityId: e.studentId, detail: { from: e.class.code, to: target.code } }, tx);
    return { studentId: e.studentId };
  });
}

/** Lịch tổng cho quản lý (Admin §7, §8): lọc theo giáo viên, phòng, lớp. */
export async function listSessionsForManager(actor: Actor, from: Date, to: Date, filter: { teacherId?: string; roomId?: string; classId?: string }) {
  assertCan(actor, "class.manage");
  return db.classSession.findMany({
    where: {
      startsAt: { gte: from, lt: to },
      ...(filter.teacherId ? { teacherId: filter.teacherId } : {}),
      ...(filter.roomId ? { roomId: filter.roomId } : {}),
      ...(filter.classId ? { classId: filter.classId } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      cancelReason: true,
      isMakeup: true,
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
      class: { select: { id: true, code: true, course: { select: { title: true } } } },
    },
  });
}

/** Lựa chọn cho form lọc lịch / phân công. */
export async function scheduleFilterOptions(actor: Actor) {
  assertCan(actor, "class.manage");
  const [teachers, rooms, classes] = await Promise.all([
    db.user.findMany({ where: { role: "TEACHER", status: "ACTIVE" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    db.room.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
    db.class.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { code: "asc" }, select: { id: true, code: true } }),
  ]);
  return { teachers, rooms, classes };
}
