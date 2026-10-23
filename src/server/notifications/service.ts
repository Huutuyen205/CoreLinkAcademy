// Thông báo (FR-048): thông báo soạn tay (Announcement) + sự kiện hệ thống, cùng ghi vào hộp thư `notifications` của từng người.
import type { AnnouncementAudience, Prisma, Role } from "@prisma/client";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db, type Tx } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { queuePush } from "@/server/push/service";

export type NotificationInput = { kind: string; title: string; body: string; link?: string | null };

/**
 * Ghi một thông báo cho nhiều người (bỏ trùng). Gọi trong transaction của nghiệp vụ để thông báo và thay đổi cùng thành công.
 * Kèm thông báo đẩy tới thiết bị đã bật — gửi sau response, chỉ khi transaction đã commit.
 */
export async function notifyUsers(tx: Tx, userIds: Iterable<string>, input: NotificationInput & { announcementId?: string }): Promise<number> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return 0;
  const created = await tx.notification.createManyAndReturn({
    select: { id: true },
    data: ids.map((userId) => ({
      userId,
      kind: input.kind,
      title: input.title.slice(0, 200),
      body: input.body,
      link: input.link ?? null,
      announcementId: input.announcementId ?? null,
    })),
  });
  queuePush(ids, { title: input.title, body: input.body, url: input.link ?? "/thong-bao", tag: input.kind }, created.map((n) => n.id));
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

/** Người nhận chọn được khi gửi "từng người" (quản lý): mọi tài khoản đang hoạt động. */
export async function announcementPeople(actor: Actor) {
  if (!isManager(actor)) return [];
  return db.user.findMany({ where: { status: "ACTIVE", id: { not: actor.id } }, orderBy: [{ role: "asc" }, { fullName: "asc" }], take: 2000, select: { id: true, fullName: true, role: true, studentCode: true } });
}

export type AnnouncementInput = { audience: AnnouncementAudience; classId: string | null; title: string; body: string; userIds?: string[] };

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
    } else if (input.audience === "USERS") {
      const ids = [...new Set(input.userIds ?? [])].slice(0, 500);
      if (ids.length === 0) throw new DomainError("NO_RECIPIENTS", "Chọn ít nhất một người nhận.", { userIds: "Chọn người nhận." });
      recipients = (await tx.user.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, select: { id: true } })).map((u) => u.id);
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
    // link null → mở thông báo là tới trang chi tiết /thong-bao/[id].
    await notifyUsers(tx, recipients, { kind: "announcement", title: input.title, body: input.body, link: null, announcementId: a.id });
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

export async function listMyNotifications(actor: Actor, page: number, onlyUnread = false, kinds?: string[]) {
  const where: Prisma.NotificationWhereInput = { userId: actor.id, ...(onlyUnread ? { readAt: null } : {}), ...(kinds ? { kind: { in: kinds } } : {}) };
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

/** Chi tiết một thông báo của chính mình (GV §10A, HS/PH "Xem chi tiết thông báo"). Mở là đánh dấu đã đọc. */
export async function getMyNotification(actor: Actor, id: string) {
  const n = await db.notification.findFirst({
    where: { id, userId: actor.id },
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
      announcement: { select: { audience: true, author: { select: { fullName: true, role: true } }, class: { select: { code: true } } } },
    },
  });
  if (!n) throw new ForbiddenError();
  if (!n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  return n;
}

/**
 * Trạng thái gửi một thông báo (Admin §12A "Xem trạng thái gửi thông báo"): từng người nhận đã đọc chưa, lúc nào,
 * và có bật thông báo đẩy trên thiết bị nào không. Quản lý xem mọi thông báo; GV xem thông báo của mình.
 */
export async function getAnnouncementStatus(actor: Actor, announcementId: string) {
  const a = await db.announcement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      recipientCount: true,
      createdAt: true,
      authorId: true,
      author: { select: { fullName: true } },
      class: { select: { code: true } },
      notifications: {
        orderBy: [{ readAt: { sort: "desc", nulls: "last" } }, { user: { fullName: "asc" } }],
        select: { readAt: true, user: { select: { id: true, fullName: true, role: true, _count: { select: { pushSubscriptions: true } } } } },
      },
    },
  });
  if (!a || (!isManager(actor) && a.authorId !== actor.id)) throw new ForbiddenError();
  const rows = a.notifications.map((n) => ({ ...n.user, readAt: n.readAt, pushDevices: n.user._count.pushSubscriptions }));
  return { ...a, rows, readCount: rows.filter((r) => r.readAt).length, pushCount: rows.filter((r) => r.pushDevices > 0).length };
}

export async function markAllNotificationsRead(actor: Actor): Promise<void> {
  await db.notification.updateMany({ where: { userId: actor.id, readAt: null }, data: { readAt: new Date() } });
}
