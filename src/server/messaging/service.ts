// Trao đổi – tương tác (Admin §12B, Giáo viên §10B, Phụ huynh §7B — FR-050, DECISION-D30).
// Nhóm lớp: thành viên suy ra từ lớp (không thêm/bớt tay). Nhắn 1-1 theo `directMessageRequirement` (rules.ts).
// Tin nhắn có thể kèm ảnh/tệp (lưu như mọi tệp khác — DECISION-D24); người nhận được thông báo đẩy.
import type { Prisma, Role } from "@prisma/client";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { fileMeta, storeFiles, type PreparedFile } from "@/server/files/storage";
import { classAudienceIds } from "@/server/notifications/service";
import { queuePush } from "@/server/push/service";
import { canDirectMessageClassmate, directMessageRequirement } from "./rules";

const LEARNING = ["ACTIVE", "PAUSED"] as const;
export const MESSAGE_MAX = 2000;
export const MESSAGE_PAGE = 100;

type Person = { id: string; role: Role };

/** Lớp mà một người thuộc nhóm trao đổi: GV phụ trách/dạy thay, HS đang học, PH của HS đang học. Quản lý: mọi lớp. */
function classMembershipWhere(person: Person): Prisma.ClassWhereInput {
  if (isManager(person)) return {};
  if (person.role === "TEACHER") return { OR: [{ teacherId: person.id }, { sessions: { some: { teacherId: person.id } } }] };
  if (person.role === "STUDENT") return { enrollments: { some: { studentId: person.id, status: { in: [...LEARNING] } } } };
  return { enrollments: { some: { status: { in: [...LEARNING] }, student: { parentLinks: { some: { parentId: person.id } } } } } };
}

async function canAccessClass(actor: Actor, classId: string): Promise<boolean> {
  return Boolean(await db.class.findFirst({ where: { id: classId, ...classMembershipWhere(actor) }, select: { id: true } }));
}

/** Quy tắc nhắn 1-1 (docs/03, DECISION-D30): trung tâm ↔ mọi người; HS ↔ PH chỉ khi là PH của em; còn lại phải cùng lớp. */
export async function canDirectMessage(actor: Person, target: Person): Promise<boolean> {
  const need = directMessageRequirement(actor, target);
  if (need === "never") return false;
  if (need === "always") return true;
  if (need === "guardian") {
    const [parentId, studentId] = actor.role === "PARENT" ? [actor.id, target.id] : [target.id, actor.id];
    return Boolean(await db.guardianship.findUnique({ where: { parentId_studentId: { parentId, studentId } }, select: { parentId: true } }));
  }
  return Boolean(await db.class.findFirst({ where: { AND: [classMembershipWhere(actor), classMembershipWhere(target)] }, select: { id: true } }));
}

/** Danh bạ được nhắn 1-1 (ô "Tin nhắn mới"): trung tâm + những người cùng lớp theo quy tắc trên. */
export async function listContacts(actor: Actor) {
  const select = { id: true, fullName: true, role: true, avatarFileId: true } as const;
  const active = { status: "ACTIVE" as const, id: { not: actor.id } };
  const order = [{ role: "asc" as const }, { fullName: "asc" as const }];
  if (isManager(actor)) return db.user.findMany({ where: active, orderBy: order, take: 1000, select });

  const myClasses = classMembershipWhere(actor);
  const sameClass: Prisma.UserWhereInput[] = [
    { role: "TEACHER", OR: [{ teachingClasses: { some: myClasses } }, { teachingSessions: { some: { class: myClasses } } }] },
    // HS không nhắn riêng phụ huynh nhà khác và ngược lại.
    actor.role === "PARENT"
      ? { role: "STUDENT", parentLinks: { some: { parentId: actor.id } } }
      : { role: "STUDENT", enrollments: { some: { status: { in: [...LEARNING] }, class: myClasses } } },
    actor.role === "STUDENT"
      ? { role: "PARENT", childLinks: { some: { studentId: actor.id } } }
      : { role: "PARENT", childLinks: { some: { student: { enrollments: { some: { status: { in: [...LEARNING] }, class: myClasses } } } } } },
  ];
  return db.user.findMany({ where: { ...active, OR: [{ role: { in: ["ADMIN", "STAFF"] } }, ...sameClass] }, orderBy: order, take: 500, select });
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
      members: { select: { userId: true, user: { select: { id: true, fullName: true, role: true, avatarFileId: true } } } },
    },
  });
  if (!c) throw new ForbiddenError();
  if (c.kind === "DIRECT" && !c.members.some((m) => m.userId === actor.id)) throw new ForbiddenError();
  if (c.kind === "CLASS" && !(await canAccessClass(actor, c.classId!))) throw new ForbiddenError();
  return c;
}

/** Tệp đính kèm tin nhắn: chỉ người xem được cuộc trò chuyện chứa tin đó. */
export async function canReadMessage(actor: Actor, messageId: string): Promise<boolean> {
  const m = await db.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
  if (!m) return false;
  try {
    await accessibleConversation(actor, m.conversationId);
    return true;
  } catch (error) {
    if (error instanceof ForbiddenError) return false;
    throw error;
  }
}

/** Thành viên nhóm lớp (GV phụ trách + dạy thay, HS đang học, PH của các em) kèm quyền nhắn riêng của người xem. */
async function classMembers(actor: Actor, classId: string) {
  const klass = await db.class.findUniqueOrThrow({
    where: { id: classId },
    select: {
      teacher: { select: { id: true, fullName: true, role: true, avatarFileId: true, status: true } },
      sessions: { distinct: ["teacherId"], select: { teacher: { select: { id: true, fullName: true, role: true, avatarFileId: true, status: true } } } },
      enrollments: {
        where: { status: { in: [...LEARNING] } },
        orderBy: { student: { fullName: "asc" } },
        select: {
          student: {
            select: {
              id: true,
              fullName: true,
              role: true,
              avatarFileId: true,
              status: true,
              parentLinks: { select: { parent: { select: { id: true, fullName: true, role: true, avatarFileId: true, status: true } } } },
            },
          },
        },
      },
    },
  });
  const myChildren = new Set(actor.role === "PARENT" ? klass.enrollments.filter((e) => e.student.parentLinks.some((l) => l.parent.id === actor.id)).map((e) => e.student.id) : []);
  const myParents = new Set(actor.role === "STUDENT" ? (klass.enrollments.find((e) => e.student.id === actor.id)?.student.parentLinks.map((l) => l.parent.id) ?? []) : []);
  const seen = new Set<string>();
  const out: { id: string; fullName: string; role: Role; avatarFileId: string | null; note: string | null; canDirect: boolean }[] = [];
  const add = (u: { id: string; fullName: string; role: Role; avatarFileId: string | null; status: string }, note: string | null) => {
    if (seen.has(u.id) || u.status !== "ACTIVE") return;
    seen.add(u.id);
    const guardianPair = myChildren.has(u.id) || myParents.has(u.id);
    out.push({ id: u.id, fullName: u.fullName, role: u.role, avatarFileId: u.avatarFileId, note, canDirect: canDirectMessageClassmate(actor, u, guardianPair) });
  };
  add(klass.teacher, "Giáo viên phụ trách");
  for (const s of klass.sessions) add(s.teacher, "Giáo viên dạy thay");
  for (const e of klass.enrollments) add(e.student, null);
  for (const e of klass.enrollments) for (const l of e.student.parentLinks) add(l.parent, `PH của ${e.student.fullName}`);
  return out;
}

export async function getConversation(actor: Actor, conversationId: string) {
  const c = await accessibleConversation(actor, conversationId);
  const [messages, members] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: MESSAGE_PAGE,
      select: {
        id: true,
        body: true,
        createdAt: true,
        sender: { select: { id: true, fullName: true, role: true, avatarFileId: true } },
        files: { select: fileMeta, orderBy: { createdAt: "asc" } },
      },
    }),
    c.kind === "CLASS" ? classMembers(actor, c.classId!) : Promise.resolve(null),
    // Đánh dấu đã đọc (CLASS: tạo dòng thành viên khi mở lần đầu).
    db.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: actor.id } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId: actor.id, lastReadAt: new Date() },
    }),
  ]);
  const other = c.kind === "DIRECT" ? c.members.find((m) => m.userId !== actor.id)?.user : null;
  return {
    id: c.id,
    kind: c.kind,
    title: c.kind === "CLASS" ? `Nhóm lớp ${c.class!.code}` : (other?.fullName ?? "Trò chuyện"),
    subtitle: c.kind === "CLASS" ? c.class!.course.title : null,
    other: other ?? null,
    members,
    messages: messages.reverse(),
  };
}

const MAX_MESSAGE_FILES = 5;

/** Gửi tin: chữ và/hoặc ảnh/tệp (tối đa 5 tệp, 4 MB mỗi lần). Người nhận có thông báo đẩy. */
export async function sendMessage(actor: Actor, conversationId: string, body: string, files: PreparedFile[] = []): Promise<void> {
  if (!body && files.length === 0) throw new DomainError("EMPTY", "Nhập tin nhắn hoặc chọn ảnh/tệp.", { body: "Nhập tin nhắn." });
  if (files.length > MAX_MESSAGE_FILES) throw new DomainError("TOO_MANY_FILES", `Mỗi tin nhắn tối đa ${MAX_MESSAGE_FILES} tệp.`);
  const c = await accessibleConversation(actor, conversationId);
  let recipients: string[];
  if (c.kind === "DIRECT") {
    const other = c.members.find((m) => m.userId !== actor.id)?.user;
    // Quan hệ có thể đã đổi (vd. con nghỉ học) → kiểm tra lại quy tắc liên hệ khi gửi.
    if (!other || !(await canDirectMessage(actor, other))) throw new DomainError("NOT_ALLOWED", "Bạn không còn nhắn tin được với người này.");
    recipients = [other.id];
  } else {
    recipients = await classAudienceIds(db, c.classId!);
  }
  const now = new Date();
  await db.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { conversationId, senderId: actor.id, body }, select: { id: true } });
    await storeFiles(tx, files, { messageId: m.id }, actor.id);
    await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } });
    await tx.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: actor.id } },
      update: { lastReadAt: now },
      create: { conversationId, userId: actor.id, lastReadAt: now },
    });
  });
  const preview = body || (files.every((f) => f.mimeType.startsWith("image/")) ? `[${files.length} ảnh]` : `[Tệp] ${files.map((f) => f.fileName).join(", ")}`);
  queuePush(
    recipients.filter((id) => id !== actor.id),
    { title: c.kind === "CLASS" ? `Nhóm lớp ${c.class!.code} · ${actor.fullName}` : actor.fullName, body: preview, url: `/tin-nhan/${conversationId}`, tag: `msg-${conversationId}` },
  );
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
export async function listConversations(actor: Actor) {
  const classWhere: Prisma.ClassWhereInput = { ...classMembershipWhere(actor), status: { in: ["OPEN", "IN_PROGRESS"] } };
  const [classes, conversations] = await Promise.all([
    isManager(actor) ? Promise.resolve([]) : db.class.findMany({ where: classWhere, orderBy: { code: "asc" }, select: { id: true, code: true, course: { select: { title: true } } } }),
    db.conversation.findMany({
      where: { OR: [{ kind: "DIRECT", members: { some: { userId: actor.id } } }, { kind: "CLASS", class: classMembershipWhere(actor), ...(isManager(actor) ? { messages: { some: {} } } : {}) }] },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        kind: true,
        lastMessageAt: true,
        class: { select: { id: true, code: true, course: { select: { title: true } } } },
        members: { select: { userId: true, user: { select: { fullName: true, role: true, avatarFileId: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderId: true, sender: { select: { fullName: true } }, _count: { select: { files: true } } },
        },
      },
    }),
  ]);
  const unreadBy = await unreadCounts(actor.id, conversations.map((c) => c.id));
  const withUnread = conversations.map((c) => {
    const other = c.members.find((m) => m.userId !== actor.id)?.user;
    const last = c.messages[0];
    return {
      id: c.id,
      kind: c.kind,
      classId: c.class?.id ?? null,
      title: c.kind === "CLASS" ? `Nhóm lớp ${c.class!.code}` : (other?.fullName ?? "Trò chuyện"),
      subtitle: c.class?.course.title ?? null,
      otherRole: other?.role ?? null,
      avatarFileId: other?.avatarFileId ?? null,
      last: last
        ? { body: last.body || (last._count.files > 0 ? `[${last._count.files} tệp/ảnh]` : ""), createdAt: last.createdAt, mine: last.senderId === actor.id, senderName: last.sender.fullName }
        : null,
      unread: unreadBy.get(c.id) ?? 0,
    };
  });
  // Lớp chưa có nhóm (chưa ai nhắn) vẫn hiện để mở nhóm.
  const opened = new Set(withUnread.map((c) => c.classId).filter(Boolean));
  const unopened = classes.filter((k) => !opened.has(k.id)).map((k) => ({ classId: k.id, title: `Nhóm lớp ${k.code}`, subtitle: k.course.title }));
  return { conversations: withUnread, unopenedClasses: unopened };
}
