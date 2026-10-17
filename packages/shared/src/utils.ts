/**
 * Chuẩn hóa số điện thoại Việt Nam về định dạng E.164: +84xxxxxxxxx
 */
export function normalizeVietnamesePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s.-]/g, '');
  if (cleaned.startsWith('+84')) {
    return cleaned;
  }
  if (cleaned.startsWith('84')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.slice(1);
  }
  return '+84' + cleaned;
}

export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = normalizeVietnamesePhone(phone);
  // Định dạng chuẩn: +84 theo sau bởi 9 chữ số (tổng 12 ký tự)
  return /^\+84[3|5|7|8|9][0-9]{8}$/.test(normalized);
}
