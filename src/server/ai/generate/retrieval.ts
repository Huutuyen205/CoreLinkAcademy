// Truy xuất đoạn tài liệu liên quan để đưa vào lời nhắc (DECISION-D37): chỉ vài đoạn ngắn thay vì cả tệp → ít token đầu vào.
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { documentVisibilityWhere } from "@/server/documents/access";
import { searchChunks } from "@/server/documents/chunks";
import type { SessionContext } from "./context";

export type Excerpt = { title: string; text: string };

export const MAX_EXCERPTS = 4;
export const MAX_EXCERPT_CHARS = 700;
const CANDIDATE_DOCS = 120;

/** Từ khóa tìm: chủ đề giáo viên nhập + mục lộ trình của buổi (+ nội dung đã học nếu có). */
export function retrievalQuery(ctx: SessionContext, topic: string): string {
  const s = ctx.syllabusItem;
  return [topic, s?.title, s?.detail, s?.knowledge, s?.objectives, ctx.lessonContent?.slice(0, 300)].filter(Boolean).join(" ");
}

/**
 * Đoạn liên quan trong các tài liệu giáo viên được xem VÀ thuộc phạm vi buổi: gắn với buổi, chia sẻ cho lớp,
 * hoặc giáo trình chuẩn đúng môn. Quyền xem lấy từ `documentVisibilityWhere` như mọi nơi khác.
 */
export async function findExcerpts(actor: Actor, ctx: SessionContext, topic: string): Promise<Excerpt[]> {
  const docs = await db.document.findMany({
    where: {
      AND: [
        documentVisibilityWhere(actor),
        { isActive: true },
        { OR: [{ sessionId: ctx.sessionId }, { shares: { some: { classId: ctx.classId } } }, { kind: "CURRICULUM", OR: [{ subjectId: null }, { subjectId: ctx.subjectId }] }] },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: CANDIDATE_DOCS,
    select: { id: true, title: true },
  });
  if (docs.length === 0) return [];
  const titles = new Map(docs.map((d) => [d.id, d.title]));
  const hits = await searchChunks([...titles.keys()], retrievalQuery(ctx, topic), MAX_EXCERPTS);
  return hits.map((h) => ({ title: titles.get(h.documentId) ?? "Tài liệu", text: h.text.length > MAX_EXCERPT_CHARS ? `${h.text.slice(0, MAX_EXCERPT_CHARS - 1).trimEnd()}…` : h.text }));
}
