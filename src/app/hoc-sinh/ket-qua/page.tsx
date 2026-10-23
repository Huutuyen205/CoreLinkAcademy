import type { Metadata } from "next";
import { EvaluationList } from "@/components/learner/evaluation-list";
import { AttendanceSummary } from "@/components/learner/learner-progress";
import { ProgressCharts } from "@/components/learner/progress-charts";
import { CourseProgress, resultFilterHref, ResultsSummary, type ResultFilter } from "@/components/learner/results-summary";
import { PageHeader } from "@/components/ui/feedback";
import { learnerProgress } from "@/server/academic/learner";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";

export const metadata: Metadata = { title: "Kết quả học tập" };

const str = (v: unknown) => (typeof v === "string" && v.length <= 80 ? v : undefined);

// FR-025, FR-033 + HS §4: kết quả tổng hợp (môn, lớp, kỳ), tiến độ khóa / bài tập, xu hướng điểm, chuyên cần, đánh giá.
export default async function StudentResultsPage({ searchParams }: { searchParams: Promise<{ mon?: string; lop?: string; ky?: string }> }) {
  const actor = await requireRole("STUDENT");
  const sp = await searchParams;
  const [results, attendance, evaluations, progress] = await Promise.all([
    listPublishedResults(actor, actor.id),
    getStudentAttendance(actor, actor.id),
    listEvaluationsOfStudent(actor, actor.id),
    learnerProgress(actor, actor.id),
  ]);
  const filter: ResultFilter = { subject: str(sp.mon), classCode: str(sp.lop), period: str(sp.ky) };
  return (
    <>
      <PageHeader title="Kết quả học tập" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <CourseProgress rows={progress} />
        </div>
        <div className="scroll-mt-24 lg:col-span-2" id="tong-hop">
          <ResultsSummary results={results} filter={filter} baseHref={(f) => resultFilterHref("/hoc-sinh/ket-qua", f)} detailHref={(r) => `/hoc-sinh/bai-tap/${r.assignmentId}`} />
        </div>
        <div className="lg:col-span-2">
          <ProgressCharts results={results} attendance={attendance.records} />
        </div>
        <AttendanceSummary data={attendance} limit={30} />
        <EvaluationList evaluations={evaluations} />
      </div>
    </>
  );
}
