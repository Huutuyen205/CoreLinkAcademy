// Quy tắc tệp tải lên (FR-040): hàm thuần, không truy cập DB.

/** Vercel giới hạn body request 4,5 MB → mỗi lần gửi tối đa 4 MB dữ liệu tệp. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;

const ALLOWED: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
  "text/plain": ["txt"],
};

export const ACCEPT_ATTRIBUTE = Object.values(ALLOWED)
  .flat()
  .map((e) => `.${e}`)
  .join(",");

export const ACCEPT_LABEL = "Ảnh (JPG, PNG, WEBP, HEIC), PDF, Word, Excel, PowerPoint, TXT — tối đa 4 MB mỗi lần gửi";

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

/**
 * Trình duyệt có thể gửi MIME rỗng hoặc chung chung (vd. HEIC trên Windows) → suy ra từ phần mở rộng.
 * Trả MIME đã chuẩn hóa, hoặc null nếu loại tệp không được phép.
 */
export function resolveMimeType(fileName: string, declared: string): string | null {
  const ext = extensionOf(fileName);
  if (declared && ALLOWED[declared]?.includes(ext)) return declared;
  for (const [mime, exts] of Object.entries(ALLOWED)) if (exts.includes(ext)) return mime;
  return null;
}

/** Bỏ ký tự điều khiển / đường dẫn khỏi tên tệp, giữ tối đa 200 ký tự (giữ phần mở rộng). */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/[\\/]/g, "_").replace(/[\u0000-\u001f\u007f"]/g, "").trim() || "tep";
  if (base.length <= 200) return base;
  const ext = extensionOf(base);
  return ext ? `${base.slice(0, 199 - ext.length)}.${ext}` : base.slice(0, 200);
}

export type UploadCheck = { name: string; type: string; size: number };

/** Kiểm tra một lô tệp: số lượng, tổng dung lượng, loại tệp. Trả thông báo lỗi tiếng Việt hoặc null. */
export function checkUploads(files: UploadCheck[], maxFiles = MAX_FILES_PER_UPLOAD): string | null {
  if (files.length > maxFiles) return `Mỗi lần chỉ gửi tối đa ${maxFiles} tệp.`;
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_FILE_BYTES) return "Tổng dung lượng vượt quá 4 MB. Hãy gửi từng tệp hoặc giảm kích thước ảnh.";
  for (const f of files) {
    if (f.size === 0) return `Tệp "${f.name}" rỗng.`;
    if (!resolveMimeType(f.name, f.type)) return `Không hỗ trợ loại tệp "${f.name}".`;
  }
  return null;
}

/** Ảnh và PDF mở trực tiếp trong trình duyệt; loại khác luôn tải xuống. */
export function isInlineType(mime: string): boolean {
  return mime === "application/pdf" || (mime.startsWith("image/") && mime !== "image/heic" && mime !== "image/heif");
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
