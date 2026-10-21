// Cache dữ liệu đọc nhiều, ít đổi (Next Data Cache). Quy ước:
// - Chỉ cache dữ liệu KHÔNG phụ thuộc người xem; kiểm tra quyền luôn chạy trước, ngoài hàm được cache.
// - Giá trị cache đi qua JSON: không cache hàm trả `Date`.
// - Mỗi tag có điểm vô hiệu hóa ở Server Action ghi tương ứng (gọi `invalidate`) + TTL dự phòng
//   cho thay đổi từ ngoài app (seed, sửa tay DB) và cho số liệu phụ thuộc thời gian.
import { revalidateTag, unstable_cache } from "next/cache";

export const CACHE_TAGS = {
  /** Danh sách môn — vô hiệu khi lưu/xóa môn, khóa học (catalog/actions). */
  subjects: "subjects",
  /** Số liệu tổng quan quản lý — vô hiệu khi lead/lớp thay đổi (leads/actions, academic/actions). */
  dashboard: "dashboard",
} as const;

type Tag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export function cached<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, options: { tags: Tag[]; revalidate: number }) {
  return unstable_cache(fn, [key], options);
}

/** Gọi trong Server Action sau khi ghi thành công. */
export function invalidate(...tags: Tag[]): void {
  for (const tag of tags) revalidateTag(tag);
}
