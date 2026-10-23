// BR-001: chuẩn hóa số điện thoại Việt Nam về dạng +84xxxxxxxxx.

const VN_MOBILE = /^\+84[35789]\d{8}$/;

/** Trả về SĐT dạng `+84…` hoặc `null` nếu không hợp lệ. */
export function normalizePhone(input: string): string | null {
  let digits = input.trim().replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) digits = digits.slice(3);
  else if (digits.startsWith("84") && digits.length === 11) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  else return null;

  const phone = `+84${digits}`;
  return VN_MOBILE.test(phone) ? phone : null;
}

/**
 * Mảnh số để tìm SĐT gần đúng (vd. "0912 34" → "91234"). Chỉ khi từ khóa toàn là số/dấu phân cách và có ≥ 3 chữ số —
 * tránh "Lớp 9" khớp mọi SĐT có chữ số 9. SĐT lưu dạng +84… nên bỏ số 0 / 84 đầu.
 */
export function phoneFragment(query: string): string | null {
  const q = query.trim();
  if (!/^[+\d\s.\-()]+$/.test(q)) return null;
  let digits = q.replace(/\D/g, "");
  if (digits.length < 3) return null;
  if (digits.startsWith("84") && digits.length > 9) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits || null;
}

/** `+84912345678` → `0912 345 678` để hiển thị. */
export function formatPhone(phone: string): string {
  if (!phone.startsWith("+84")) return phone;
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
