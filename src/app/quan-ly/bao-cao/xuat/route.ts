// Xuất báo cáo Excel (.xlsx, cột % là công thức) — FR-052. Kiểm tra phiên + vai trò phía server như trang báo cáo.
import { can } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";
import { attendanceSheet, completionSheet, resultsSheet, writeWorkbook, type SheetSpec } from "@/server/reports/excel";
import { parseReportFilter } from "@/server/reports/filter";
import { attendanceByClass, completionByClass, reportFilterOptions, resultsByClass } from "@/server/reports/service";
import { formatDateTime, vnDateKey } from "@/lib/time";

const KINDS = ["chuyen-can", "ket-qua", "bai-tap", "tat-ca"] as const;

export async function GET(request: Request) {
  const actor = await getCurrentActor();
  if (!actor || actor.mustChangePassword || !can(actor.role, "report.view")) return new Response("Không tìm thấy.", { status: 404 });
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const kind = KINDS.find((k) => k === sp.loai);
  if (!kind) return new Response("Loại báo cáo không hợp lệ.", { status: 400 });

  const options = await reportFilterOptions(actor);
  const { filter, fromKey, toKey } = parseReportFilter(sp, vnDateKey(new Date()), options);
  const dmy = (k: string) => k.split("-").reverse().join("/");
  const classCode = options.classes.find((c) => c.id === filter.classId)?.code;
  const subjectName = options.subjects.find((s) => s.id === filter.subjectId)?.name;
  const period = [`${dmy(fromKey)} – ${dmy(toKey)}`, classCode && `lớp ${classCode}`, subjectName && `môn ${subjectName}`].filter(Boolean).join(" · ");

  const all = kind === "tat-ca";
  const [attendance, results, completion] = await Promise.all([
    all || kind === "chuyen-can" ? attendanceByClass(actor, filter) : null,
    all || kind === "ket-qua" ? resultsByClass(actor, filter) : null,
    all || kind === "bai-tap" ? completionByClass(actor, filter) : null,
  ]);
  const sheets: SheetSpec[] = [];
  if (attendance) sheets.push(attendanceSheet(attendance, period));
  if (results) sheets.push(resultsSheet(results, period));
  if (completion) sheets.push(completionSheet(completion, period));

  const data = await writeWorkbook(sheets, formatDateTime(new Date()));
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-${kind}-${fromKey}-${toKey}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
