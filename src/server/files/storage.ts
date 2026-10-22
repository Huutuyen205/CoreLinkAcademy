// Lưu tệp trong Postgres (DECISION-D24): metadata ở `stored_files`, nội dung ở `file_blobs`.
import type { Tx } from "@/server/db";
import { DomainError } from "@/server/errors";
import { checkUploads, MAX_FILES_PER_UPLOAD, resolveMimeType, sanitizeFileName } from "./rules";

export type PreparedFile = { fileName: string; mimeType: string; size: number; data: Uint8Array<ArrayBuffer> };
export type FileOwner =
  | { assignmentId: string }
  | { submissionId: string; questionId?: string } // questionId: ảnh bài làm câu tự luận
  | { documentId: string }
  | { messageId: string }
  | Record<string, never>; // ảnh đại diện: không có chủ sở hữu, gắn qua `users.avatarFileId`

/** Đọc các ô `<input type="file" name=…>` từ FormData (bỏ ô trống), kiểm tra, đọc nội dung vào bộ nhớ. */
export async function readUploads(formData: FormData, name: string, maxFiles = MAX_FILES_PER_UPLOAD): Promise<PreparedFile[]> {
  const files = formData.getAll(name).filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0);
  const error = checkUploads(files, maxFiles);
  if (error) throw new DomainError("INVALID_FILE", error, { [name]: error });
  return Promise.all(
    files.map(async (f) => ({
      fileName: sanitizeFileName(f.name),
      mimeType: resolveMimeType(f.name, f.type)!,
      size: f.size,
      data: new Uint8Array(await f.arrayBuffer()),
    })),
  );
}

/** Ghi tệp đã chuẩn bị cho một chủ sở hữu, trong transaction của nghiệp vụ gọi. */
export async function storeFiles(tx: Tx, files: PreparedFile[], owner: FileOwner, uploadedById: string): Promise<string[]> {
  const ids: string[] = [];
  for (const f of files) {
    const meta = await tx.storedFile.create({
      data: { fileName: f.fileName, mimeType: f.mimeType, size: f.size, uploadedById, ...owner },
      select: { id: true },
    });
    await tx.fileBlob.create({ data: { fileId: meta.id, data: f.data } });
    ids.push(meta.id);
  }
  return ids;
}

/** Cột metadata dùng ở mọi danh sách — KHÔNG gồm nội dung tệp. */
export const fileMeta = { id: true, fileName: true, mimeType: true, size: true, createdAt: true } as const;
