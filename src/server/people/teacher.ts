// Giáo viên tự quản lý (checklist v4, DECISION-D33 — các mục "giả định" của GV):
// - Đăng ký lịch rảnh (GV §2): khung giờ theo thứ trong tuần; quản trị viên xem khi xếp lớp / dạy thay.
// - Hồ sơ giới thiệu (GV §11A): GV soạn bản nháp → gửi duyệt → quản lý duyệt thì thành bản công khai (hiện cho HS/PH của lớp).
// Kèm: đổi nhanh trạng thái hoạt động của hồ sơ (Admin §3 "Cập nhật trạng thái hoạt động của giáo viên").
import type { MemberStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCan } from "@/server/auth/policy";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { notifyUsers } from "@/server/notifications/service";
import { canEditProfile } from "./service";

/* ───────────── Trạng thái hồ sơ (nút nhanh) ───────────── */

export async function setMemberStatus(actor: Actor, userId: string, status: MemberStatus): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, memberStatus: true } });
  if (!user || !canEditProfile(actor.role, user.role)) throw new ForbiddenError();
  if (user.memberStatus === status) return user.role;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { memberStatus: status } });
    await writeAudit({ actorId: actor.id, action: "user.member_status", entity: "User", entityId: userId, detail: { from: user.memberStatus, to: status } }, tx);
  });
  return user.role;
}

/* ───────────── Lịch rảnh ───────────── */

export type AvailabilityInput = { weekday: number; startTime: string; endTime: string; note: string | null };

export async function listAvailability(actor: Actor, teacherId: string) {
  if (!(actor.role === "TEACHER" && actor.id === teacherId) && !isManager(actor)) throw new ForbiddenError();
  return db.teacherAvailability.findMany({ where: { teacherId }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { id: true, weekday: true, startTime: true, endTime: true, note: true } });
}

export async function addAvailability(actor: Actor, input: AvailabilityInput): Promise<void> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  if (input.endTime <= input.startTime) throw new DomainError("INVALID", "Giờ kết thúc phải sau giờ bắt đầu.", { endTime: "Phải sau giờ bắt đầu." });
  const overlap = await db.teacherAvailability.findFirst({
    where: { teacherId: actor.id, weekday: input.weekday, startTime: { lt: input.endTime }, endTime: { gt: input.startTime } },
    select: { id: true },
  });
  if (overlap) throw new DomainError("OVERLAP", "Khung giờ này trùng với khung đã đăng ký.", { startTime: "Trùng khung đã có." });
  if ((await db.teacherAvailability.count({ where: { teacherId: actor.id } })) >= 40) throw new DomainError("TOO_MANY", "Tối đa 40 khung giờ.");
  await db.teacherAvailability.create({ data: { ...input, teacherId: actor.id } });
}

export async function removeAvailability(actor: Actor, slotId: string): Promise<void> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const { count } = await db.teacherAvailability.deleteMany({ where: { id: slotId, teacherId: actor.id } });
  if (count === 0) throw new ForbiddenError();
}

/* ───────────── Hồ sơ giới thiệu ───────────── */

export async function getMyIntro(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  return db.user.findUniqueOrThrow({ where: { id: actor.id }, select: { introDraft: true, introPublished: true, introStatus: true, introNote: true } });
}

/** GV lưu bản nháp; `submit` = gửi duyệt luôn. Bản công khai giữ nguyên tới khi được duyệt. */
export async function saveMyIntro(actor: Actor, text: string, submit: boolean): Promise<void> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  if (submit && text.trim().length < 20) throw new DomainError("TOO_SHORT", "Viết ít nhất 20 ký tự trước khi gửi duyệt.", { introDraft: "Ít nhất 20 ký tự." });
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: actor.id }, data: { introDraft: text || null, ...(submit ? { introStatus: "PENDING", introNote: null } : {}) } });
    if (submit) {
      const managers = await tx.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
      await notifyUsers(tx, managers.map((m) => m.id), {
        kind: "review",
        title: `Hồ sơ giới thiệu chờ duyệt: ${actor.fullName}`,
        body: "Giáo viên vừa gửi hồ sơ giới thiệu để duyệt.",
        link: `/quan-ly/giao-vien/${actor.id}#gioi-thieu`,
      });
    }
  });
}

/** Quản lý duyệt / từ chối hồ sơ giới thiệu đang chờ. Duyệt → bản nháp thành bản công khai. */
export async function reviewIntro(actor: Actor, teacherId: string, approve: boolean, note: string | null): Promise<void> {
  assertCan(actor, "staff.view");
  const t = await db.user.findFirst({ where: { id: teacherId, role: "TEACHER" }, select: { introDraft: true, introStatus: true } });
  if (!t) throw new ForbiddenError();
  if (t.introStatus !== "PENDING") throw new DomainError("NOT_PENDING", "Hồ sơ không ở trạng thái chờ duyệt.");
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacherId },
      data: approve ? { introStatus: "APPROVED", introPublished: t.introDraft, introNote: note } : { introStatus: "REJECTED", introNote: note },
    });
    await writeAudit({ actorId: actor.id, action: approve ? "intro.approve" : "intro.reject", entity: "User", entityId: teacherId, detail: { note } }, tx);
    await notifyUsers(tx, [teacherId], {
      kind: "review",
      title: approve ? "Hồ sơ giới thiệu đã được duyệt" : "Hồ sơ giới thiệu bị từ chối",
      body: note ? `Ghi chú: ${note}` : approve ? "Hồ sơ đã hiển thị cho học sinh và phụ huynh lớp bạn dạy." : "Sửa lại và gửi duyệt lần nữa.",
      link: "/giao-vien/ho-so",
    });
  });
}
