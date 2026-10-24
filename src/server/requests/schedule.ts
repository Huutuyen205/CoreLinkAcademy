// Đề xuất đổi lịch của giáo viên (Giáo viên §2, Admin §7 "Xử lý đề xuất đổi lịch" — FR-043).
import type { RequestStatus, ScheduleRequestType } from "@prisma/client";
import { assignSessionTeacher } from "@/server/academic/operations";
import { cancelSession, rescheduleSession } from "@/server/academic/service";
import { assertCan } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { notifyUsers } from "@/server/notifications/service";
import { formatDateTime } from "@/lib/time";

export type ScheduleRequestInput = {
  sessionId: string;
  type: ScheduleRequestType;
  proposedStartsAt: Date | null;
  proposedEndsAt: Date | null;
  reason: string;
};

function checkProposal(input: Pick<ScheduleRequestInput, "type" | "proposedStartsAt" | "proposedEndsAt">, now: Date) {
  if (input.type !== "RESCHEDULE") return;
  if (!input.proposedStartsAt || !input.proposedEndsAt) throw new DomainError("PROPOSAL_REQUIRED", "Nhập thời gian đề xuất.", { date: "Chọn ngày giờ mới." });
  if (input.proposedStartsAt <= now) throw new DomainError("IN_PAST", "Thời gian đề xuất phải ở tương lai.", { date: "Chọn thời điểm trong tương lai." });
  if (input.proposedEndsAt <= input.proposedStartsAt) throw new DomainError("INVALID", "Giờ kết thúc phải sau giờ bắt đầu.", { endTime: "Giờ kết thúc phải sau giờ bắt đầu." });
}

/** GV tạo đề xuất cho buổi mình dạy, chưa diễn ra; mỗi buổi chỉ một đề xuất đang chờ. */
export async function createScheduleRequest(actor: Actor, input: ScheduleRequestInput): Promise<void> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const now = new Date();
  const s = await db.classSession.findUnique({ where: { id: input.sessionId }, select: { teacherId: true, status: true, startsAt: true, class: { select: { code: true } } } });
  if (!s || s.teacherId !== actor.id) throw new ForbiddenError();
  if (s.status !== "SCHEDULED" || s.startsAt <= now) throw new DomainError("NOT_SCHEDULED", "Chỉ đề xuất cho buổi chưa diễn ra.");
  checkProposal(input, now);
  const pending = await db.scheduleRequest.findFirst({ where: { sessionId: input.sessionId, teacherId: actor.id, status: "PENDING" }, select: { id: true } });
  if (pending) throw new DomainError("DUPLICATE", "Buổi này đã có đề xuất đang chờ duyệt. Hãy sửa đề xuất đó.");
  const managers = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await db.$transaction(async (tx) => {
    await tx.scheduleRequest.create({ data: { ...input, teacherId: actor.id } });
    await notifyUsers(tx, managers.map((m) => m.id), {
      kind: "schedule_request",
      title: `Đề xuất đổi lịch — lớp ${s.class.code}`,
      body: `${actor.fullName}: ${input.type === "LEAVE" ? "xin nghỉ" : "đề xuất dời"} buổi ${formatDateTime(s.startsAt)}. Lý do: ${input.reason}`,
      link: "/quan-ly/de-xuat",
    });
  });
}

async function ownPending(actor: Actor, requestId: string) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const r = await db.scheduleRequest.findUnique({ where: { id: requestId }, select: { teacherId: true, status: true } });
  if (!r || r.teacherId !== actor.id) throw new ForbiddenError();
  if (r.status !== "PENDING") throw new DomainError("NOT_PENDING", "Chỉ sửa/rút được đề xuất đang chờ duyệt.");
}

export async function updateScheduleRequest(actor: Actor, requestId: string, input: Omit<ScheduleRequestInput, "sessionId">): Promise<void> {
  await ownPending(actor, requestId);
  checkProposal(input, new Date());
  const { count } = await db.scheduleRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: input });
  if (count === 0) throw new DomainError("NOT_PENDING", "Đề xuất vừa được xử lý.");
}

export async function cancelScheduleRequest(actor: Actor, requestId: string): Promise<void> {
  await ownPending(actor, requestId);
  const { count } = await db.scheduleRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: "CANCELLED" } });
  if (count === 0) throw new DomainError("NOT_PENDING", "Đề xuất vừa được xử lý.");
}

const requestSelect = {
  id: true,
  type: true,
  status: true,
  reason: true,
  responseNote: true,
  proposedStartsAt: true,
  proposedEndsAt: true,
  createdAt: true,
  handledAt: true,
  teacher: { select: { id: true, fullName: true } },
  handledBy: { select: { fullName: true } },
  session: { select: { id: true, index: true, startsAt: true, endsAt: true, status: true, class: { select: { id: true, code: true } } } },
} as const;

export async function listMyScheduleRequests(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  return db.scheduleRequest.findMany({ where: { teacherId: actor.id }, orderBy: { createdAt: "desc" }, take: 100, select: requestSelect });
}

export async function listScheduleRequests(actor: Actor, status?: RequestStatus) {
  assertCan(actor, "request.handle");
  return db.scheduleRequest.findMany({ where: status ? { status } : {}, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, select: requestSelect });
}

export async function countPendingScheduleRequests(actor: Actor): Promise<number> {
  assertCan(actor, "request.handle");
  return db.scheduleRequest.count({ where: { status: "PENDING" } });
}

export type ScheduleDecision = { approve: boolean; note: string | null; substituteTeacherId: string | null };

/**
 * Quản trị viên xử lý đề xuất:
 * - Dời buổi: áp thời gian đề xuất (kiểm tra trùng lịch GV/phòng như FR-021).
 * - Xin nghỉ: có GV dạy thay → phân công; không → hủy buổi (lớp được thông báo, xếp học bù sau).
 * Thay đổi lịch chạy trước; lỗi trùng lịch → đề xuất vẫn chờ để quản trị viên chọn cách khác.
 */
export async function handleScheduleRequest(actor: Actor, requestId: string, decision: ScheduleDecision): Promise<void> {
  assertCan(actor, "request.handle");
  const r = await db.scheduleRequest.findUnique({ where: { id: requestId }, select: { ...requestSelect, sessionId: true } });
  if (!r) throw new ForbiddenError();
  if (r.status !== "PENDING") throw new DomainError("NOT_PENDING", "Đề xuất đã được xử lý.");
  if (decision.approve) {
    if (r.type === "RESCHEDULE") {
      await rescheduleSession(actor, r.sessionId, r.proposedStartsAt!, r.proposedEndsAt!, `Đề xuất của GV: ${r.reason}`.slice(0, 255));
    } else if (decision.substituteTeacherId) {
      if (decision.substituteTeacherId === r.teacher.id) throw new DomainError("SAME_TEACHER", "Chọn giáo viên khác người xin nghỉ.", { substituteTeacherId: "Chọn giáo viên khác." });
      await assignSessionTeacher(actor, r.sessionId, decision.substituteTeacherId, `Dạy thay ${r.teacher.fullName}`);
    } else {
      await cancelSession(actor, r.sessionId, `Giáo viên nghỉ: ${r.reason}`.slice(0, 255));
    }
  }
  await db.$transaction(async (tx) => {
    const { count } = await tx.scheduleRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: { status: decision.approve ? "APPROVED" : "REJECTED", handledById: actor.id, handledAt: new Date(), responseNote: decision.note },
    });
    if (count === 0) throw new DomainError("NOT_PENDING", "Đề xuất đã được xử lý.");
    await notifyUsers(tx, [r.teacher.id], {
      kind: "request_result",
      title: decision.approve ? "Đề xuất đổi lịch đã được duyệt" : "Đề xuất đổi lịch bị từ chối",
      body: `Lớp ${r.session.class.code}, buổi ${formatDateTime(r.session.startsAt)}.${decision.note ? ` Phản hồi: ${decision.note}` : ""}`,
      link: "/giao-vien/don?tab=cua-toi",
    });
  });
}

/** Buổi GV đang dạy trong 60 ngày tới (để chọn khi tạo đề xuất). */
export async function listMyUpcomingSessions(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const now = new Date();
  return db.classSession.findMany({
    where: { teacherId: actor.id, status: "SCHEDULED", startsAt: { gt: now, lt: new Date(now.getTime() + 60 * 86_400_000) } },
    orderBy: { startsAt: "asc" },
    take: 150,
    select: { id: true, index: true, startsAt: true, endsAt: true, class: { select: { id: true, code: true } } },
  });
}
