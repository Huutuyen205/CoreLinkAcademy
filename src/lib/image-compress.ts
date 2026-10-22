// Chạy trên trình duyệt: thu nhỏ ảnh chụp từ điện thoại (thường 3–8 MB) trước khi gửi,
// để vừa giới hạn 4 MB mỗi lần gửi (src/server/files/rules.ts) mà chữ viết tay vẫn đọc rõ.

const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Ảnh JPEG/PNG/WEBP lớn hơn `maxBytes` hoặc cạnh dài hơn `maxSide` → JPEG ≤ `maxSide` px. Loại khác (HEIC, PDF…) giữ nguyên. */
export async function compressImage(file: File, { maxSide = 2000, quality = 0.82, maxBytes = 700 * 1024 } = {}): Promise<File> {
  if (!COMPRESSIBLE.has(file.type) || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= maxBytes) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#fff"; // PNG trong suốt → nền trắng khi đổi sang JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") || "anh";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

/** Nén cả lô (giữ thứ tự). */
export function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)));
}
