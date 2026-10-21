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

/** `+84912345678` → `0912 345 678` để hiển thị. */
export function formatPhone(phone: string): string {
  if (!phone.startsWith("+84")) return phone;
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
