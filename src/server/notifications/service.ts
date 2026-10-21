// Thông báo (FR-048): thông báo soạn tay (Announcement) + sự kiện hệ thống, cùng ghi vào hộp thư `notifications` của từng người.
import type { AnnouncementAudience, Prisma, Role } from "@prisma/client";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db, type Tx } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";

export type NotificationInput = { kind: string; title: string; body: string; link?: string | null };

/** Ghi một thông báo cho nhiều người (bỏ trùng). Gọi trong transaction của nghiệp vụ để thông báo và thay đổi cùng thành công. */
export async function notifyUsers(tx: Tx, userIds: Iterable<string>, input: NotificationInput & { announcementId?: string }): Promise<number> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return 0;
  await tx.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      kind: input.kind,
      title: input.title.slice(0, 200),
      body: input.body,
      link: input.link ?? null,
      announcementId: input.announcementId ?? null,
    })),
  });
  return ids.length;
}

/** Thành viên của một lớp: giáo viên chính, học sinh đang học/bảo lưu, phụ huynh của các em. */
export async function classAudienceIds(
  tx: Tx,
  classId: string,
  include: { teacher?: boolean; students?: boolean; parents?: boolean } = { teacher: true, students: true, parents: true },
): Promise<string[]> {
  const klass = await tx.class.findUnique({
    where: { id: classId },
    select: {
      teacherId: true,
      enrollments: {
        where: { status: { in: ["ACTIVE", "PAUSED"] }, student: { status: "ACTIVE" } },
        select: { studentId: true, student: { select: { parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
      },
    },
  });
  if (!klass) return [];
  const ids: string[] = [];
  if (include.teacher) ids.push(klass.teacherId);
  for (const e of klass.enrollments) {
    if (include.students) ids.push(e.studentId);
    if (include.parents) ids.push(...e.student.parentLinks.map((l) => l.parentId));
  }
  return [...new Set(ids)];
}

const AUDIENCE_ROLES: Partial<Record<AnnouncementAudience, Role[]>> = {
  STAFF: ["ADMIN", "STAFF"],
  TEACHERS: ["TEACHER"],
  STUDENTS: ["STUDENT"],
  PARENTS: ["PARENT"],
};

/** Ai được gửi tới đối tượng nào: quản lý gửi mọi đối tượng; giáo viên chỉ gửi cho lớp mình dạy. */
export function canAnnounce(role: Role, audience: AnnouncementAudience): boolean {
  if (role === "ADMIN" || role === "STAFF") return true;
  return role === "TEACHER" && audience === "CLASS";
}

export type AnnouncementInput = { audience: AnnouncementAudience; classId: string | null; title: string; body: string };

/** Admin: "Gửi thông báo đến GV, HS, PH hoặc lớp" · GV: "Tạo thông báo cho lớp" (FR-048). */
export async function createAnnouncement(actor: Actor, input: AnnouncementInput): Promise<{ id: string; recipientCount: number }> {
  if (!canAnnounce(actor.role, input.audience)) throw new ForbiddenError();
  if (input.audience === "CLASS") {
    if (!input.classId) throw new DomainError("CLASS_REQUIRED", "Chọn lớp nhận thông báo.", { classId: "Chọn lớp." });
    const klass = await db.class.findUnique({ where: { id: input.classId }, select: { teacherId: true } });
    if (!klass) throw new DomainError("CLASS_REQUIRED", "Lớp không tồn tại.", { classId: "Chọn lớp." });
    if (actor.role === "TEACHER" && klass.teacherId !== actor.id) throw new ForbiddenError();
  }
  return db.$transaction(async (tx) => {
    let recipients: string[];
    if (input.audience === "CLASS") {
      recipients = await classAudienceIds(tx, input.classId!);
    } else {
      const roles = AUDIENCE_ROLES[input.audience];
      const users = await tx.user.findMany({ where: { status: "ACTIVE", ...(roles ? { role: { in: roles } } : {}) }, select: { id: true } });
      recipients = users.map((u) => u.id);
    }
    recipients = recipients.filter((id) => id !== actor.id);
    if (recipients.length === 0) throw new DomainError("NO_RECIPIENTS", "Không có người nhận phù hợp với đối tượng đã chọn.");
    const a = await tx.announcement.create({
      data: {
        authorId: actor.id,
        audience: input.audience,
        classId: input.audience === "CLASS" ? input.classId : null,
        title: input.title,
        body: input.body,
        recipientCount: recipients.length,
      },
      select: { id: true },
    });
    await notifyUsers(tx, recipients, { kind: "announcement", title: input.title, body: input.body, link: "/thong-bao", announcementId: a.id });
    return { id: a.id, recipientCount: recipients.length };
  });
}

/** Thông báo đã gửi: quản lý xem tất cả, giáo viên xem của mình; kèm số người đã đọc (trạng thái gửi). */
export async function listSentAnnouncements(actor: Actor) {
  if (!isManager(actor) && actor.role !== "TEACHER") throw new ForbiddenError();
  const rows = await db.announcement.findMany({
    where: isManager(actor) ? {} : { authorId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      recipientCount: true,
      createdAt: true,
      author: { select: { fullName: true } },
      class: { select: { code: true } },
      _count: { select: { notifications: { where: { readAt: { not: null } } } } },
    },
  });
  return rows.map(({ _count, ...r }) => ({ ...r, readCount: _count.notifications }));
}

export const NOTIFICATION_PAGE_SIZE = 20;

export async function listMyNotifications(actor: Actor, page: number, onlyUnread = false) {
  const where: Prisma.NotificationWhereInput = { userId: actor.id, ...(onlyUnread ? { readAt: null } : {}) };
  const [total, unread, rows] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: { userId: actor.id, readAt: null } }),
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * NOTIFICATION_PAGE_SIZE,
      take: NOTIFICATION_PAGE_SIZE,
      select: { id: true, kind: true, title: true, body: true, link: true, readAt: true, createdAt: true, announcement: { select: { author: { select: { fullName: true } } } } },
    }),
  ]);
  return { total, unread, rows };
}

export async function unreadNotificationCount(actorId: string): Promise<number> {
  return db.notification.count({ where: { userId: actorId, readAt: null } });
}

export async function markNotificationRead(actor: Actor, id: string): Promise<string | null> {
  const n = await db.notification.findFirst({ where: { id, userId: actor.id }, select: { link: true, readAt: true } });
  if (!n) throw new ForbiddenError();
  if (!n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  return n.link;
}

export async function markAllNotificationsRead(actor: Actor): Promise<void> {
  await db.notification.updateMany({ where: { userId: actor.id, readAt: null }, data: { readAt: new Date() } });
}
