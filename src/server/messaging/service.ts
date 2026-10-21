// Trao đổi – tương tác (Admin §12B, Giáo viên §10B, Phụ huynh §7B — FR-050).
// Nhóm lớp: thành viên suy ra từ lớp (không thêm/bớt tay). Nhắn 1-1 theo quy tắc liên hệ `canDirectMessage`.
import type { Prisma, Role } from "@prisma/client";
import { isManager, linkedStudentIds } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";

const LEARNING = ["ACTIVE", "PAUSED"] as const;
export const MESSAGE_MAX = 2000;

/** Lớp mà actor thuộc nhóm trao đổi: GV phụ trách/dạy thay, HS đang học, PH của HS đang học. Quản lý: mọi lớp. */
function classMembershipWhere(actor: Actor): Prisma.ClassWhereInput {
  if (isManager(actor)) return {};
  if (actor.role === "TEACHER") return { OR: [{ teacherId: actor.id }, { sessions: { some: { teacherId: actor.id } } }] };
  if (actor.role === "STUDENT") return { enrollments: { some: { studentId: actor.id, status: { in: [...LEARNING] } } } };
  return { enrollments: { some: { status: { in: [...LEARNING] }, student: { parentLinks: { some: { parentId: actor.id } } } } } };
}

async function canAccessClass(actor: Actor, classId: string): Promise<boolean> {
  return Boolean(await db.class.findFirst({ where: { id: classId, ...classMembershipWhere(actor) }, select: { id: true } }));
}

/**
 * Quy tắc nhắn 1-1 (docs/03): quản lý ↔ GV/PH/quản lý; GV ↔ PH có con học lớp GV dạy; PH ↔ GV của con.
 * GV ↔ HS: "Giả định – cần xác nhận" (Giáo viên.md, BR34) → chưa mở. HS chỉ trao đổi trong nhóm lớp.
 */
export async function canDirectMessage(actor: Actor, target: { id: string; role: Role }): Promise<boolean> {
  if (actor.id === target.id) return false;
  const targetManager = target.role === "ADMIN" || target.role === "STAFF";
  if (isManager(actor)) return target.role !== "STUDENT";
  if (actor.role === "TEACHER") {
    if (targetManager) return true;
    if (target.role !== "PARENT") return false;
    return Boolean(
      await db.guardianship.findFirst({
        where: { parentId: target.id, student: { enrollments: { some: { status: { in: [...LEARNING] }, class: { teacherId: actor.id } } } } },
        select: { parentId: true },
      }),
    );
  }
  if (actor.role === "PARENT") {
    if (targetManager) return true;
    if (target.role !== "TEACHER") return false;
    const childIds = await linkedStudentIds(actor.id);
    return Boolean(await db.enrollment.findFirst({ where: { studentId: { in: childIds }, status: { in: [...LEARNING] }, class: { teacherId: target.id } }, select: { id: true } }));
  }
  return false;
}

/** Danh bạ được nhắn 1-1 (cho ô "Tin nhắn mới"). */
export async function listContacts(actor: Actor) {
  const select = { id: true, fullName: true, role: true } as const;
  const active = { status: "ACTIVE" as const, id: { not: actor.id } };
  if (isManager(actor)) {
    return db.user.findMany({ where: { ...active, role: { in: ["ADMIN", "STAFF", "TEACHER", "PARENT"] } }, orderBy: [{ role: "asc" }, { fullName: "asc" }], take: 500, select });
  }
  if (actor.role === "TEACHER") {
    return db.user.findMany({
      where: {
        ...active,
        OR: [
          { role: { in: ["ADMIN", "STAFF"] } },
          { role: "PARENT", childLinks: { some: { student: { enrollments: { some: { status: { in: [...LEARNING] }, class: { teacherId: actor.id } } } } } } },
        ],
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      take: 500,
      select,
    });
  }
  if (actor.role === "PARENT") {
    const childIds = await linkedStudentIds(actor.id);
    return db.user.findMany({
      where: {
        ...active,
        OR: [{ role: { in: ["ADMIN", "STAFF"] } }, { role: "TEACHER", teachingClasses: { some: { enrollments: { some: { studentId: { in: childIds }, status: { in: [...LEARNING] } } } } } }],
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      take: 200,
      select,
    });
  }
  return [];
}

function directKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

/** Mở (hoặc tạo) cuộc trò chuyện 1-1. */
export async function startDirectConversation(actor: Actor, targetId: string): Promise<string> {
  const target = await db.user.findFirst({ where: { id: targetId, status: "ACTIVE" }, select: { id: true, role: true } });
  if (!target || !(await canDirectMessage(actor, target))) throw new ForbiddenError();
  const key = directKey(actor.id, target.id);
  const existing = await db.conversation.findUnique({ where: { directKey: key }, select: { id: true } });
  if (existing) return existing.id;
  try {
    const c = await db.conversation.create({
      data: { kind: "DIRECT", directKey: key, members: { create: [{ userId: actor.id }, { userId: target.id }] } },
      select: { id: true },
    });
    return c.id;
  } catch {
    // Hai người mở cùng lúc → bản ghi do người kia tạo.
    return (await db.conversation.findUniqueOrThrow({ where: { directKey: key }, select: { id: true } })).id;
  }
}

/** Nhóm trao đổi của lớp (tạo khi mở lần đầu). */
export async function openClassConversation(actor: Actor, classId: string): Promise<string> {
  if (!(await canAccessClass(actor, classId))) throw new ForbiddenError();
  const c = await db.conversation.upsert({ where: { classId }, update: {}, create: { kind: "CLASS", classId }, select: { id: true } });
  return c.id;
}

async function accessibleConversation(actor: Actor, conversationId: string) {
  const c = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      kind: true,
      classId: true,
      class: { select: { code: true, course: { select: { title: true } } } },
      members: { select: { userId: true, user: { select: { id: true, fullName: true, role: true } } } },
    },
  });
  if (!c) throw new ForbiddenError();
  if (c.kind === "DIRECT" && !c.members.some((m) => m.userId === actor.id)) throw new ForbiddenError();
  if (c.kind === "CLASS" && !(await canAccessClass(actor, c.classId!))) throw new ForbiddenError();
  return c;
}

export async function getConversation(actor: Actor, conversationId: string) {
  const c = await accessibleConversation(actor, conversationId);
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, body: true, createdAt: true, sender: { select: { id: true, fullName: true, role: true } } },
  });
  // Đánh dấu đã đọc (CLASS: tạo dòng thành viên khi mở lần đầu).
  await db.conversationMember.upsert({
    where: { conversationId_userId: { conversationId, userId: actor.id } },
    update: { lastReadAt: new Date() },
    create: { conversationId, userId: actor.id, lastReadAt: new Date() },
  });
  const other = c.kind === "DIRECT" ? c.members.find((m) => m.userId !== actor.id)?.user : null;
  return {
    id: c.id,
    kind: c.kind,
    title: c.kind === "CLASS" ? `Nhóm lớp ${c.class!.code}` : (other?.fullName ?? "Trò chuyện"),
    subtitle: c.kind === "CLASS" ? c.class!.course.title : null,
    otherRole: other?.role ?? null,
    messages: messages.reverse(),
  };
}

export async function sendMessage(actor: Actor, conversationId: string, body: string): Promise<void> {
  const c = await accessibleConversation(actor, conversationId);
  if (c.kind === "DIRECT") {
    const other = c.members.find((m) => m.userId !== actor.id)?.user;
    // Quan hệ có thể đã đổi (vd. con nghỉ học) → kiểm tra lại quy tắc liên hệ khi gửi.
    if (!other || !(await canDirectMessage(actor, other))) throw new DomainError("NOT_ALLOWED", "Bạn không còn nhắn tin được với người này.");
  }
  const now = new Date();
  await db.$transaction([
    db.message.create({ data: { conversationId, senderId: actor.id, body } }),
    db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } }),
    db.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: actor.id } },
      update: { lastReadAt: now },
      create: { conversationId, userId: actor.id, lastReadAt: now },
    }),
  ]);
}

/** Số tin chưa đọc theo cuộc trò chuyện, một câu SQL cho cả danh sách. */
async function unreadCounts(userId: string, conversationIds: string[]): Promise<Map<string, number>> {
  if (conversationIds.length === 0) return new Map();
  const rows = await db.$queryRaw<{ conversationId: string; n: number }[]>`
    SELECT m."conversationId", count(*)::int AS n
    FROM "messages" m
    LEFT JOIN "conversation_members" cm ON cm."conversationId" = m."conversationId" AND cm."userId" = ${userId}
    WHERE m."conversationId" = ANY(${conversationIds}) AND m."senderId" <> ${userId}
      AND (cm."lastReadAt" IS NULL OR m."createdAt" > cm."lastReadAt")
    GROUP BY m."conversationId"`;
  return new Map(rows.map((r) => [r.conversationId, r.n]));
}

/** Danh sách cuộc trò chuyện: 1-1 của mình + nhóm lớp mình thuộc (quản lý: nhóm lớp đã có tin nhắn). Kèm số tin chưa đọc. */
export async function listConversations(actor: Actor, q?: string) {
  const query = q?.trim();
  const classWhere: Prisma.ClassWhereInput = { ...classMembershipWhere(actor), status: { in: ["OPEN", "IN_PROGRESS"] } };
  const [classes, conversations] = await Promise.all([
    isManager(actor) ? Promise.resolve([]) : db.class.findMany({ where: classWhere, orderBy: { code: "asc" }, select: { id: true, code: true, course: { select: { title: true } } } }),
    db.conversation.findMany({
      where: {
        OR: [{ kind: "DIRECT", members: { some: { userId: actor.id } } }, { kind: "CLASS", class: classMembershipWhere(actor), ...(isManager(actor) ? { messages: { some: {} } } : {}) }],
        ...(query
          ? {
              AND: [
                {
                  OR: [
                    { messages: { some: { body: { contains: query, mode: "insensitive" } } } },
                    { class: { code: { contains: query, mode: "insensitive" } } },
                    { members: { some: { userId: { not: actor.id }, user: { fullName: { contains: query, mode: "insensitive" } } } } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        kind: true,
        lastMessageAt: true,
        class: { select: { id: true, code: true, course: { select: { title: true } } } },
        members: { select: { userId: true, lastReadAt: true, user: { select: { fullName: true, role: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true, sender: { select: { fullName: true } } } },
      },
    }),
  ]);
  const unreadBy = await unreadCounts(actor.id, conversations.map((c) => c.id));
  const withUnread = conversations.map((c) => {
    const other = c.members.find((m) => m.userId !== actor.id)?.user;
    return {
      id: c.id,
      kind: c.kind,
      classId: c.class?.id ?? null,
      title: c.kind === "CLASS" ? `Nhóm lớp ${c.class!.code}` : (other?.fullName ?? "Trò chuyện"),
      otherRole: other?.role ?? null,
      last: c.messages[0] ?? null,
      unread: unreadBy.get(c.id) ?? 0,
    };
  });
  // Lớp chưa có nhóm (chưa ai nhắn) vẫn hiện để mở nhóm.
  const opened = new Set(withUnread.map((c) => c.classId).filter(Boolean));
  const unopened = query ? [] : classes.filter((k) => !opened.has(k.id)).map((k) => ({ classId: k.id, title: `Nhóm lớp ${k.code}`, subtitle: k.course.title }));
  return { conversations: withUnread, unopenedClasses: unopened };
}
