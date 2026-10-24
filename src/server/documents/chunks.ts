// Lập chỉ mục và tìm đoạn văn bản của tài liệu (DECISION-D37): tìm kiếm toàn văn Postgres (cấu hình 'simple' trên chữ không dấu).
// Chưa dùng vector: với vài nghìn đoạn, lọc theo phạm vi tài liệu + từ khóa đã đủ; thêm pgvector khi kết quả kém.
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { PreparedFile } from "@/server/files/storage";
import { buildTsQuery, chunkText, extractText, searchForm } from "./extract";

/**
 * Trích văn bản các tệp vừa tải lên và ghi thành đoạn. Không ném lỗi: tải tệp lên vẫn thành công
 * dù không trích được (bản scan, định dạng chưa hỗ trợ). Trả số đoạn đã ghi.
 */
export async function indexDocumentFiles(documentId: string, fileIds: string[], files: PreparedFile[]): Promise<number> {
  let total = 0;
  try {
    for (const [i, file] of files.entries()) {
      const fileId = fileIds[i];
      if (!fileId) continue;
      const chunks = chunkText(await extractText(file));
      if (chunks.length === 0) continue;
      await db.documentChunk.createMany({ data: chunks.map((text, position) => ({ documentId, fileId, position, text, search: searchForm(text) })) });
      total += chunks.length;
    }
    if (total > 0) await db.$executeRaw`UPDATE "document_chunks" SET "tsv" = to_tsvector('simple', "search") WHERE "documentId" = ${documentId} AND "tsv" IS NULL`;
  } catch (error) {
    console.error("[documents] lập chỉ mục thất bại:", error instanceof Error ? error.message : error);
  }
  return total;
}

export async function removeFileChunks(documentId: string, fileId: string): Promise<void> {
  await db.documentChunk.deleteMany({ where: { documentId, fileId } });
}

export type ChunkHit = { documentId: string; text: string; rank: number };

/** Các đoạn khớp từ khóa nhất trong số tài liệu cho phép (người gọi đã lọc quyền xem). */
export async function searchChunks(documentIds: string[], query: string, limit: number): Promise<ChunkHit[]> {
  const tsQuery = buildTsQuery(query);
  if (!tsQuery || documentIds.length === 0 || limit <= 0) return [];
  return db.$queryRaw<ChunkHit[]>(Prisma.sql`
    SELECT c."documentId", c."text", ts_rank(c."tsv", q) AS "rank"
    FROM "document_chunks" c, to_tsquery('simple', ${tsQuery}) q
    WHERE c."documentId" = ANY(${documentIds}) AND c."tsv" @@ q
    ORDER BY "rank" DESC, c."position" ASC
    LIMIT ${limit}`);
}
