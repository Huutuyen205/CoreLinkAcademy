// Giáo trình, tài liệu học tập, giáo án (Admin §9–§10, Giáo viên §3–§5, HS/PH xem — FR-042).
import type { DocumentKind, Prisma } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { can } from "@/server/auth/policy";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { fileMeta, storeFiles, type PreparedFile } from "@/server/files/storage";
import { classAudienceIds, notifyUsers } from "@/server/notifications/service";
import { canManageDocument, documentVisibilityWhere } from "./access";

export type DocumentInput = {
  kind: DocumentKind;
  title: string;
  description: string | null;
  url: string | null;
  subjectId: string | null;
  levelId: string | null;
  sessionId: string | null;
  visibleToStudents: boolean;
  visibleToParents: boolean;
};

/** Ai tạo loại nào: giáo trình → quản lý; tài liệu → quản lý + GV; giáo án → GV (quản lý chỉ xem). */
export function canCreateKind(role: Actor["role"], kind: DocumentKind): boolean {
  if (kind === "CURRICULUM") return can(role, "document.manage");
  if (kind === "MATERIAL") return can(role, "document.manage") || role === "TEACHER";
  return role === "TEACHER";
}

const listSelect = {
  id: true,
  kind: true,
  title: true,
  description: true,
  url: true,
  isActive: true,
  visibleToStudents: true,
  visibleToParents: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  owner: { select: { fullName: true } },
  subject: { select: { id: true, name: true } },
  level: { select: { id: true, name: true } },
  session: { select: { id: true, index: true, startsAt: true, class: { select: { code: true } } } },
  files: { select: fileMeta, orderBy: { createdAt: "asc" as const } },
  shares: { select: { class: { select: { id: true, code: true } } } },
} as const;

export type DocumentFilter = { kind?: DocumentKind; q?: string; subjectId?: string; levelId?: string; classId?: string; includeInactive?: boolean };

export async function listDocuments(actor: Actor, filter: DocumentFilter = {}) {
  const q = filter.q?.trim();
  const where: Prisma.DocumentWhereInput = {
    AND: [
      documentVisibilityWhere(actor),
      filter.kind ? { kind: filter.kind } : {},
      filter.subjectId ? { subjectId: filter.subjectId } : {},
      filter.levelId ? { levelId: filter.levelId } : {},
      filter.classId ? { shares: { some: { classId: filter.classId } } } : {},
      q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {},
      filter.includeInactive && isManager(actor) ? {} : { isActive: true },
    ],
  };
  return db.document.findMany({ where, orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }], take: 200, select: listSelect });
}

export async function getDocument(actor: Actor, documentId: string) {
  const doc = await db.document.findFirst({ where: { id: documentId, ...documentVisibilityWhere(actor) }, select: listSelect });
  if (!doc) throw new ForbiddenError();
  return { ...doc, canManage: canManageDocument(actor, doc) };
}

async function manageable(actor: Actor, documentId: string) {
  const doc = await db.document.findUnique({ where: { id: documentId }, select: { id: true, ownerId: true, kind: true, title: true, _count: { select: { shares: true, files: true } } } });
  if (!doc || !canManageDocument(actor, doc)) throw new ForbiddenError();
  return doc;
}

async function checkSessionScope(actor: Actor, sessionId: string | null) {
  if (!sessionId) return;
  const s = await db.classSession.findUnique({ where: { id: sessionId }, select: { teacherId: true, class: { select: { teacherId: true } } } });
  if (!s) throw new DomainError("INVALID", "Buổi học không hợp lệ.", { sessionId: "Chọn buổi học." });
  if (actor.role === "TEACHER" && s.teacherId !== actor.id && s.class.teacherId !== actor.id) throw new ForbiddenError();
}

/** Tạo tài liệu: cần tệp tải lên hoặc đường dẫn. `shareClassIds` chia sẻ luôn cho các lớp (theo quyền chia sẻ). */
export async function createDocument(actor: Actor, input: DocumentInput, files: PreparedFile[], shareClassIds: string[] = []): Promise<string> {
  if (!canCreateKind(actor.role, input.kind)) throw new ForbiddenError();
  if (files.length === 0 && !input.url) throw new DomainError("NO_CONTENT", "Hãy tải tệp tài liệu lên (hoặc dán liên kết ngoài nếu tệp quá lớn).", { files: "Chọn tệp tài liệu." });
  await checkSessionScope(actor, input.sessionId);
  if (input.kind === "LESSON_PLAN" && shareClassIds.length > 0) throw new DomainError("NOT_SHAREABLE", "Giáo án không chia sẻ cho học sinh.");
  const classIds = await shareableClassIds(actor, shareClassIds);
  const data = input.kind === "LESSON_PLAN" ? { ...input, visibleToStudents: false, visibleToParents: false } : input;
  const id = await db.$transaction(async (tx) => {
    const doc = await tx.document.create({ data: { ...data, ownerId: actor.id }, select: { id: true } });
    await storeFiles(tx, files, { documentId: doc.id }, actor.id);
    if (classIds.length) await tx.documentShare.createMany({ data: classIds.map((classId) => ({ documentId: doc.id, classId, sharedById: actor.id })), skipDuplicates: true });
    await notifyShared(tx, classIds, input.title, data.visibleToStudents, data.visibleToParents);
    return doc.id;
  });
  return id;
}

export async function updateDocument(actor: Actor, documentId: string, input: Omit<DocumentInput, "kind">): Promise<void> {
  const doc = await manageable(actor, documentId);
  if (!input.url && doc._count.files === 0) throw new DomainError("NO_CONTENT", "Tài liệu chưa có tệp — hãy giữ liên kết ngoài hoặc tải tệp lên trước.", { url: "Tài liệu chưa có tệp nên cần liên kết." });
  await checkSessionScope(actor, input.sessionId);
  const data = doc.kind === "LESSON_PLAN" ? { ...input, visibleToStudents: false, visibleToParents: false } : input;
  await db.document.update({ where: { id: documentId }, data });
}

/** Ngừng sử dụng / dùng lại: ẩn khỏi GV/HS/PH, giữ tệp và lịch sử. */
export async function setDocumentActive(actor: Actor, documentId: string, active: boolean): Promise<void> {
  await manageable(actor, documentId);
  await db.document.update({ where: { id: documentId }, data: { isActive: active } });
}

/** Xóa khi đáp ứng điều kiện nghiệp vụ: chưa chia sẻ cho lớp nào (hoặc đã gỡ hết). Giáo án gắn buổi đã diễn ra: không xóa. */
export async function deleteDocument(actor: Actor, documentId: string): Promise<DocumentKind> {
  const doc = await manageable(actor, documentId);
  if (doc._count.shares > 0) throw new DomainError("SHARED", "Tài liệu đang được chia sẻ cho lớp. Hãy gỡ chia sẻ (hoặc ngừng sử dụng) trước khi xóa.");
  if (doc.kind === "LESSON_PLAN") {
    const past = await db.document.findFirst({ where: { id: documentId, session: { startsAt: { lte: new Date() } } }, select: { id: true } });
    if (past) throw new DomainError("USED", "Giáo án gắn với buổi học đã diễn ra nên không xóa được.");
  }
  await db.$transaction(async (tx) => {
    await tx.document.delete({ where: { id: documentId } });
    await writeAudit({ actorId: actor.id, action: "document.delete", entity: "Document", entityId: documentId, detail: { title: doc.title, kind: doc.kind } }, tx);
  });
  return doc.kind;
}

export async function addDocumentFiles(actor: Actor, documentId: string, files: PreparedFile[]): Promise<void> {
  const doc = await manageable(actor, documentId);
  if (files.length === 0) throw new DomainError("NO_FILE", "Chọn tệp.", { files: "Chọn tệp." });
  if (doc._count.files + files.length > 10) throw new DomainError("TOO_MANY_FILES", "Mỗi tài liệu tối đa 10 tệp.");
  await db.$transaction((tx) => storeFiles(tx, files, { documentId }, actor.id));
}

export async function deleteDocumentFile(actor: Actor, documentId: string, fileId: string): Promise<void> {
  await manageable(actor, documentId);
  const { count } = await db.storedFile.deleteMany({ where: { id: fileId, documentId } });
  if (count === 0) throw new ForbiddenError();
}

/** Lớp actor được chia sẻ tới: quản lý → lớp chưa kết thúc; GV → lớp mình phụ trách chưa kết thúc. */
async function shareableClassIds(actor: Actor, classIds: string[]): Promise<string[]> {
  if (classIds.length === 0) return [];
  const rows = await db.class.findMany({
    where: { id: { in: classIds }, status: { in: ["OPEN", "IN_PROGRESS"] }, ...(isManager(actor) ? {} : { teacherId: actor.id }) },
    select: { id: true },
  });
  if (rows.length !== new Set(classIds).size) throw new ForbiddenError();
  return rows.map((r) => r.id);
}

async function notifyShared(tx: Prisma.TransactionClient, classIds: string[], title: string, students: boolean, parents: boolean) {
  for (const classId of classIds) {
    const ids = await classAudienceIds(tx, classId, { teacher: false, students, parents });
    await notifyUsers(tx, ids, { kind: "document", title: `Tài liệu mới: ${title}`, body: "Tài liệu vừa được chia sẻ cho lớp.", link: "/tai-lieu" });
  }
}

export async function shareDocument(actor: Actor, documentId: string, classId: string): Promise<void> {
  const doc = await db.document.findFirst({ where: { id: documentId, ...documentVisibilityWhere(actor) }, select: { id: true, kind: true, ownerId: true, title: true, visibleToStudents: true, visibleToParents: true, isActive: true } });
  if (!doc) throw new ForbiddenError();
  if (doc.kind === "LESSON_PLAN") throw new DomainError("NOT_SHAREABLE", "Giáo án không chia sẻ cho học sinh.");
  // Admin phân phối mọi tài liệu; GV chỉ chia sẻ tài liệu của mình.
  if (!isManager(actor) && doc.ownerId !== actor.id) throw new ForbiddenError();
  if (!doc.isActive) throw new DomainError("INACTIVE", "Tài liệu đang ngừng sử dụng.");
  const [id] = await shareableClassIds(actor, [classId]);
  await db.$transaction(async (tx) => {
    const created = await tx.documentShare.createMany({ data: [{ documentId, classId: id!, sharedById: actor.id }], skipDuplicates: true });
    if (created.count > 0) await notifyShared(tx, [id!], doc.title, doc.visibleToStudents, doc.visibleToParents);
  });
}

/** Gỡ chia sẻ: thu hồi quyền xem của lớp, tệp gốc giữ nguyên. */
export async function unshareDocument(actor: Actor, documentId: string, classId: string): Promise<void> {
  const share = await db.documentShare.findUnique({
    where: { documentId_classId: { documentId, classId } },
    select: { document: { select: { ownerId: true } }, class: { select: { teacherId: true } } },
  });
  if (!share) throw new ForbiddenError();
  if (!isManager(actor) && !(actor.role === "TEACHER" && share.document.ownerId === actor.id && share.class.teacherId === actor.id)) throw new ForbiddenError();
  await db.documentShare.delete({ where: { documentId_classId: { documentId, classId } } });
}

/** Lựa chọn cho form tài liệu. */
export async function documentFormOptions(actor: Actor) {
  const [subjects, levels, classes] = await Promise.all([
    db.subject.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.educationLevel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.class.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, ...(isManager(actor) ? {} : { teacherId: actor.id }) },
      orderBy: { code: "asc" },
      select: { id: true, code: true },
    }),
  ]);
  return { subjects, levels, classes };
}

/** Buổi dạy để gắn giáo án: buổi của GV trong 14 ngày qua và 45 ngày tới. */
export async function lessonPlanSessionOptions(actor: Actor) {
  if (actor.role !== "TEACHER") return [];
  const day = 86_400_000;
  return db.classSession.findMany({
    where: {
      OR: [{ teacherId: actor.id }, { class: { teacherId: actor.id } }],
      status: { not: "CANCELLED" },
      startsAt: { gte: new Date(Date.now() - 14 * day), lte: new Date(Date.now() + 45 * day) },
    },
    orderBy: { startsAt: "asc" },
    take: 200,
    select: { id: true, index: true, startsAt: true, class: { select: { code: true } } },
  });
}
