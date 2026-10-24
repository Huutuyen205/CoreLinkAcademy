// Đơn xin nghỉ của phụ huynh (Phụ huynh §2 — FR-044). Người duyệt: GV của lớp/buổi hoặc Admin (DECISION-D25).
import type { Prisma, RequestStatus } from "@prisma/client";
import { isManager, linkedStudentIds } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { notifyUsers } from "@/server/notifications/service";
import { formatDateTime } from "@/lib/time";

const LEARNING = ["ACTIVE", "PAUSED"] as const;

/** Phụ huynh gửi đơn cho một buổi của con: buổi chưa bắt đầu, chưa hủy; không trùng đơn đang chờ/đã duyệt. */
export async function createLeaveRequest(actor: Actor, input: { studentId: string; sessionId: string; reason: string }): Promise<void> {
  if (actor.role !== "PARENT" || !(await linkedStudentIds(actor.id)).includes(input.studentId)) throw new ForbiddenError();
  const session = await db.classSession.findUnique({
    where: { id: input.sessionId },
    select: {
      status: true,
      startsAt: true,
      teacherId: true,
      class: { select: { code: true, teacherId: true, enrollments: { where: { studentId: input.studentId, status: { in: [...LEARNING] } }, select: { id: true } } } },
    },
  });
  if (!session || session.class.enrollments.length === 0) throw new ForbiddenError();
  if (session.status !== "SCHEDULED") throw new DomainError("NOT_SCHEDULED", "Buổi học đã diễn ra hoặc đã hủy.");
  if (session.startsAt <= new Date()) throw new DomainError("STARTED", "Buổi học đã bắt đầu. Vui lòng liên hệ giáo viên trực tiếp.");
  const existing = await db.leaveRequest.findFirst({
    where: { sessionId: input.sessionId, studentId: input.studentId, status: { in: ["PENDING", "APPROVED"] } },
    select: { status: true },
  });
  if (existing) throw new DomainError("DUPLICATE", existing.status === "APPROVED" ? "Đơn nghỉ buổi này đã được duyệt." : "Đã có đơn đang chờ duyệt cho buổi này.");
  const student = await db.user.findUniqueOrThrow({ where: { id: input.studentId }, select: { fullName: true } });
  await db.$transaction(async (tx) => {
    await tx.leaveRequest.create({ data: { ...input, requestedById: actor.id } });
    await notifyUsers(tx, [session.teacherId, session.class.teacherId], {
      kind: "leave_request",
      title: `Đơn xin nghỉ: ${student.fullName}`,
      body: `Lớp ${session.class.code}, buổi ${formatDateTime(session.startsAt)}. Lý do: ${input.reason}`,
      link: "/giao-vien/don",
    });
  });
}

export async function cancelLeaveRequest(actor: Actor, requestId: string): Promise<void> {
  if (actor.role !== "PARENT") throw new ForbiddenError();
  const r = await db.leaveRequest.findUnique({ where: { id: requestId }, select: { studentId: true } });
  if (!r || !(await linkedStudentIds(actor.id)).includes(r.studentId)) throw new ForbiddenError();
  const { count } = await db.leaveRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: "CANCELLED" } });
  if (count === 0) throw new DomainError("NOT_PENDING", "Chỉ rút được đơn đang chờ duyệt.");
}

/** Điều kiện xem/duyệt đơn: quản lý → tất cả; GV → buổi mình dạy hoặc lớp mình phụ trách. */
function handlerScope(actor: Actor): Prisma.LeaveRequestWhereInput {
  if (isManager(actor)) return {};
  if (actor.role === "TEACHER") return { session: { OR: [{ teacherId: actor.id }, { class: { teacherId: actor.id } }] } };
  throw new ForbiddenError();
}

/**
 * Duyệt / từ chối. Duyệt → ghi điểm danh "Có phép" cho buổi đó (ghi chú kèm lý do), trong cùng transaction.
 * Chỉ đơn đang chờ; hai người duyệt cùng lúc → người sau nhận thông báo đã xử lý.
 */
export async function handleLeaveRequest(actor: Actor, requestId: string, approve: boolean, note: string | null): Promise<void> {
  const r = await db.leaveRequest.findFirst({
    where: { id: requestId, ...handlerScope(actor) },
    select: { status: true, reason: true, sessionId: true, studentId: true, requestedById: true, session: { select: { startsAt: true, status: true, class: { select: { code: true } } } } },
  });
  if (!r) throw new ForbiddenError();
  if (r.status !== "PENDING") throw new DomainError("NOT_PENDING", "Đơn đã được xử lý.");
  if (approve && r.session.status === "CANCELLED") throw new DomainError("CANCELLED", "Buổi học đã hủy, không cần duyệt nghỉ.");
  await db.$transaction(async (tx) => {
    const { count } = await tx.leaveRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: { status: approve ? "APPROVED" : "REJECTED", handledById: actor.id, handledAt: new Date(), responseNote: note },
    });
    if (count === 0) throw new DomainError("NOT_PENDING", "Đơn đã được xử lý.");
    if (approve) {
      const attendanceNote = `Nghỉ có phép (đơn PH): ${r.reason}`.slice(0, 255);
      await tx.attendance.upsert({
        where: { sessionId_studentId: { sessionId: r.sessionId, studentId: r.studentId } },
        update: { status: "EXCUSED", note: attendanceNote, markedById: actor.id, markedAt: new Date() },
        create: { sessionId: r.sessionId, studentId: r.studentId, status: "EXCUSED", note: attendanceNote, markedById: actor.id },
      });
    }
    await notifyUsers(tx, [r.requestedById], {
      kind: "leave_result",
      title: approve ? "Đơn xin nghỉ đã được duyệt" : "Đơn xin nghỉ bị từ chối",
      body: `Lớp ${r.session.class.code}, buổi ${formatDateTime(r.session.startsAt)}.${note ? ` Phản hồi: ${note}` : ""}`,
      link: "/phu-huynh/don-nghi",
    });
  });
}

const leaveSelect = {
  id: true,
  reason: true,
  status: true,
  responseNote: true,
  createdAt: true,
  handledAt: true,
  handledBy: { select: { fullName: true } },
  requestedBy: { select: { fullName: true } },
  student: { select: { id: true, fullName: true, studentCode: true } },
  session: { select: { id: true, startsAt: true, endsAt: true, class: { select: { id: true, code: true } } } },
} as const;

export async function listLeaveRequestsForParent(actor: Actor) {
  if (actor.role !== "PARENT") throw new ForbiddenError();
  const ids = await linkedStudentIds(actor.id);
  return db.leaveRequest.findMany({ where: { studentId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 100, select: leaveSelect });
}

export async function listLeaveRequestsForHandler(actor: Actor, status?: RequestStatus) {
  return db.leaveRequest.findMany({
    where: { ...handlerScope(actor), ...(status ? { status } : {}) },
    orderBy: [{ status: "asc" }, { session: { startsAt: "asc" } }],
    take: 200,
    select: leaveSelect,
  });
}

export async function countPendingLeaveRequests(actor: Actor): Promise<number> {
  return db.leaveRequest.count({ where: { ...handlerScope(actor), status: "PENDING" } });
}

/** PH §2: buổi sắp tới (30 ngày) của các con để chọn khi gửi đơn ngay ở trang Đơn xin nghỉ. Bỏ buổi đã có đơn chờ/đã duyệt. */
export async function upcomingLeaveTargets(actor: Actor) {
  if (actor.role !== "PARENT") throw new ForbiddenError();
  const ids = await linkedStudentIds(actor.id);
  if (ids.length === 0) return [];
  const now = new Date();
  const until = new Date(now.getTime() + 30 * 86_400_000);
  const students = await db.user.findMany({
    where: { id: { in: ids } },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      enrollments: {
        where: { status: { in: [...LEARNING] } },
        select: {
          class: {
            select: {
              code: true,
              sessions: {
                where: { status: "SCHEDULED", startsAt: { gt: now, lt: until } },
                orderBy: { startsAt: "asc" },
                select: { id: true, startsAt: true, leaveRequests: { where: { status: { in: ["PENDING", "APPROVED"] } }, select: { studentId: true } } },
              },
            },
          },
        },
      },
    },
  });
  return students.flatMap((st) =>
    st.enrollments
      .flatMap((e) => e.class.sessions.filter((s) => !s.leaveRequests.some((l) => l.studentId === st.id)).map((s) => ({ studentId: st.id, studentName: st.fullName, sessionId: s.id, startsAt: s.startsAt, classCode: e.class.code })))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
  );
}
