// Chọn con đang xem của phụ huynh (DECISION-D42) — hàm thuần, không đụng DB hay cookie.

export const CHILD_COOKIE = "cl_child";

type WithId = { id: string };

/** Con được chọn: đúng `wanted` nếu còn trong danh sách liên kết, ngược lại con đầu tiên; không có con → null. */
export function pickChild<T extends WithId>(children: T[], wanted: string | null | undefined): T | null {
  return children.find((c) => c.id === wanted) ?? children[0] ?? null;
}

/** Chỉ nhận đường dẫn nội bộ (`/abc`), chặn `//host`, `/\host`, địa chỉ tuyệt đối — tránh chuyển hướng mở. */
export function safeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value || value.length > 300) return fallback;
  return /^\/(?![/\\])[^\s\\]*$/.test(value) ? value : fallback;
}

/** Liên kết đổi con rồi mở `den` (dùng cho ô chọn con, thông báo, gợi ý chatbot). Phải là thẻ `<a>`, không dùng `<Link>` (tránh prefetch). */
export function switchChildHref(childId: string, den: string): string {
  return `/phu-huynh/chon-con?con=${encodeURIComponent(childId)}&den=${encodeURIComponent(den)}`;
}

const SECTIONS = new Set(["lich", "lop", "bai-tap", "don-nghi"]);

/**
 * Sau khi đổi con, trang chi tiết của con cũ (lớp, bài, buổi) không còn hợp lệ → về trang danh sách cùng mục.
 * Trang không phụ thuộc con (tin nhắn, thông báo, tài khoản) giữ nguyên.
 */
export function pathAfterSwitch(pathname: string): string {
  if (pathname.startsWith("/on-luyen")) return "/phu-huynh/bai-tap?loai=on-luyen";
  if (pathname === "/phu-huynh" || pathname.startsWith("/phu-huynh/")) {
    const section = pathname.split("/")[2] ?? "";
    return SECTIONS.has(section) ? `/phu-huynh/${section}` : "/phu-huynh/lich";
  }
  return pathname || "/phu-huynh/lich";
}
