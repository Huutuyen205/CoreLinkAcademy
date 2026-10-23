// Khoảng ngày theo giờ Việt Nam cho câu hỏi "hôm nay / hôm qua / ngày mai". Hàm thuần.
import { addDays } from "@/lib/schedule";
import { vnDateKey, vnToUtc } from "@/lib/time";

export const DAY_MS = 24 * 3_600_000;

/** [00:00, 24:00) giờ Việt Nam của ngày cách hôm nay `offset` ngày. */
export function dayRange(now: Date, offset: number): { key: string; from: Date; to: Date } {
  const key = addDays(vnDateKey(now), offset);
  const from = vnToUtc(key, "00:00");
  return { key, from, to: new Date(from.getTime() + DAY_MS) };
}
