import { vnToUtc } from "@/lib/time";
import { addDays } from "@/lib/schedule";
import type { ReportFilter } from "./service";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Đọc bộ lọc báo cáo từ query (`tu`, `den` = ngày giờ VN, bao gồm ngày `den`). Mặc định: 30 ngày gần nhất. */
export function parseReportFilter(sp: Record<string, string | string[] | undefined>, today: string, options: { classes: { id: string }[]; subjects: { id: string }[] }) {
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const toKey = str("den") && DATE.test(str("den")!) ? str("den")! : today;
  const fromKey = str("tu") && DATE.test(str("tu")!) && str("tu")! <= toKey ? str("tu")! : addDays(toKey, -29);
  const classId = options.classes.some((c) => c.id === str("lop")) ? str("lop") : undefined;
  const subjectId = options.subjects.some((s) => s.id === str("mon")) ? str("mon") : undefined;
  const filter: ReportFilter = { from: vnToUtc(fromKey, "00:00"), to: vnToUtc(addDays(toKey, 1), "00:00"), classId, subjectId };
  return { filter, fromKey, toKey };
}
