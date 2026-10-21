// Xuất báo cáo CSV (mở bằng Excel) — FR-052. Kiểm tra phiên + vai trò phía server như trang báo cáo.
import { can } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";
import { parseReportFilter } from "@/server/reports/filter";
import { pctOf, toCsv } from "@/server/reports/format";
import { attendanceByClass, completionByClass, reportFilterOptions, resultsByClass } from "@/server/reports/service";
import { vnDateKey } from "@/lib/time";

export async function GET(request: Request) {
  const actor = await getCurrentActor();
  if (!actor || actor.mustChangePassword || !can(actor.role, "report.view")) return new Response("Không tìm thấy.", { status: 404 });
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const options = await reportFilterOptions(actor);
  const { filter, fromKey, toKey } = parseReportFilter(sp, vnDateKey(new Date()), options);

  let csv: string;
  const kind = sp.loai;
  if (kind === "chuyen-can") {
    const rows = await attendanceByClass(actor, filter);
    csv = toCsv(
      ["Lớp", "Số buổi", "Lượt điểm danh", "Có mặt", "Đi muộn", "Vắng", "Có phép", "Tỷ lệ chuyên cần (%)"],
      rows.map((r) => [r.code, r.sessions, r.marked, r.present, r.late, r.absent, r.excused, pctOf(r.present + r.late, r.marked)]),
    );
  } else if (kind === "ket-qua") {
    const rows = await resultsByClass(actor, filter);
    csv = toCsv(["Lớp", "Bài đã chấm", "Điểm TB (%)", "Thấp nhất (%)", "Cao nhất (%)"], rows.map((r) => [r.code, r.graded, r.avgPct, r.minPct, r.maxPct]));
  } else if (kind === "bai-tap") {
    const rows = await completionByClass(actor, filter);
    csv = toCsv(
      ["Lớp", "Bài đã giao", "Cần nộp", "Đã nộp", "Nộp muộn", "Tỷ lệ nộp (%)"],
      rows.map((r) => [r.code, r.assignments, r.expected, r.submitted, r.late, pctOf(r.submitted, r.expected)]),
    );
  } else {
    return new Response("Loại báo cáo không hợp lệ.", { status: 400 });
  }
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bao-cao-${kind}-${fromKey}-${toKey}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
