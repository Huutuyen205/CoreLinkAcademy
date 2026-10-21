// Nhập danh sách học sinh hàng loạt (Admin §2 — FR-036): hàm thuần đọc dữ liệu dán từ Excel/CSV.
import { normalizePhone } from "@/lib/phone";

export const MAX_IMPORT_ROWS = 50;

export type ImportRow = { line: number; fullName: string; gradeLevel: number; phone: string | null; email: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mỗi dòng: Họ tên | Khối (0–12) | SĐT | Email — phân tách bằng Tab (dán từ Excel), dấu phẩy hoặc chấm phẩy.
 * Dòng tiêu đề (chứa "họ tên") và dòng trống được bỏ qua. Trả lỗi theo số dòng; có lỗi thì không nhập dòng nào.
 */
export function parseStudentImport(text: string): { rows: ImportRow[]; errors: string[] } {
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seenPhone = new Set<string>();
  const seenEmail = new Set<string>();
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (!raw.trim()) return;
    const cells = raw.split(/\t|;|,/).map((c) => c.trim());
    if (/h[oọ]\s*t[eê]n/i.test(cells[0] ?? "")) return;
    const [fullName = "", grade = "", phoneRaw = "", emailRaw = ""] = cells;
    if (fullName.length < 2 || fullName.length > 120) errors.push(`Dòng ${line}: họ tên không hợp lệ.`);
    const gradeLevel = Number(grade);
    if (!/^\d{1,2}$/.test(grade) || gradeLevel > 12) errors.push(`Dòng ${line}: khối lớp phải là số 0–12.`);
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    if (phoneRaw && !phone) errors.push(`Dòng ${line}: số điện thoại không hợp lệ.`);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    if (email && (!EMAIL.test(email) || email.length > 191)) errors.push(`Dòng ${line}: email không hợp lệ.`);
    if (phone && seenPhone.has(phone)) errors.push(`Dòng ${line}: số điện thoại trùng với dòng khác.`);
    if (email && seenEmail.has(email)) errors.push(`Dòng ${line}: email trùng với dòng khác.`);
    if (phone) seenPhone.add(phone);
    if (email) seenEmail.add(email);
    rows.push({ line, fullName, gradeLevel, phone, email });
  });
  if (rows.length === 0 && errors.length === 0) errors.push("Chưa có dòng dữ liệu nào.");
  if (rows.length > MAX_IMPORT_ROWS) errors.push(`Mỗi lần nhập tối đa ${MAX_IMPORT_ROWS} học sinh.`);
  return { rows, errors };
}
