// Module ngày giờ duy nhất (RISK-005, NFR-005): DB lưu UTC, hiển thị theo giờ Việt Nam.
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** Ngày `YYYY-MM-DD` + giờ `HH:mm` theo giờ Việt Nam → thời điểm UTC. */
export function vnToUtc(date: string, time: string): Date {
  const d = DATE_RE.exec(date);
  const t = TIME_RE.exec(time);
  if (!d || !t) throw new Error(`Ngày giờ không hợp lệ: ${date} ${time}`);
  const local = new TZDate(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), APP_TIME_ZONE);
  return new Date(local.getTime());
}

/** Thời điểm → đối tượng ngày theo giờ Việt Nam (để đọc giờ/thứ/ngày). */
export function inVn(date: Date): TZDate {
  return new TZDate(date.getTime(), APP_TIME_ZONE);
}

/** Thứ theo giờ Việt Nam: 1 = Thứ Hai … 7 = Chủ nhật. */
export function vnWeekday(date: Date): number {
  const day = inVn(date).getDay();
  return day === 0 ? 7 : day;
}

/** `YYYY-MM-DD` theo giờ Việt Nam. */
export function vnDateKey(date: Date): string {
  return format(inVn(date), "yyyy-MM-dd");
}

export function formatVn(date: Date, pattern: string): string {
  return format(inVn(date), pattern, { locale: vi });
}

export const formatDate = (date: Date) => formatVn(date, "dd/MM/yyyy");
export const formatDateTime = (date: Date) => formatVn(date, "HH:mm dd/MM/yyyy");
export const formatTime = (date: Date) => formatVn(date, "HH:mm");

/** Giờ trong danh sách tin nhắn: hôm nay → "HH:mm", cùng năm → "dd/MM", khác năm → "dd/MM/yy" (giờ VN). */
export function formatChatTime(date: Date, now = new Date()): string {
  if (vnDateKey(date) === vnDateKey(now)) return formatTime(date);
  return formatVn(date, vnDateKey(date).slice(0, 4) === vnDateKey(now).slice(0, 4) ? "dd/MM" : "dd/MM/yy");
}

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ nhật",
};

/** Thứ Hai (YYYY-MM-DD, giờ VN) của tuần chứa `date`. */
export function vnWeekStart(date: Date): string {
  const key = vnDateKey(date);
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - (vnWeekday(date) - 1));
  return d.toISOString().slice(0, 10);
}

/** Đọc `?tuan=YYYY-MM-DD` → Thứ Hai của tuần đó; sai định dạng → tuần hiện tại. */
export function parseWeekParam(value: string | string[] | undefined, now = new Date()): string {
  if (typeof value === "string" && DATE_RE.test(value)) {
    const d = new Date(`${value}T05:00:00.000Z`); // giữa ngày theo giờ VN
    if (!Number.isNaN(d.getTime())) return vnWeekStart(d);
  }
  return vnWeekStart(now);
}

/** Khoảng UTC [Thứ Hai 00:00, Thứ Hai tuần sau 00:00) giờ VN. */
export function vnWeekRange(weekStart: string): { from: Date; to: Date } {
  const from = vnToUtc(weekStart, "00:00");
  return { from, to: new Date(from.getTime() + 7 * 24 * 3_600_000) };
}
