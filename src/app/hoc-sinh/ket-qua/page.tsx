import type { Metadata } from "next";
import { EvaluationList } from "@/components/learner/evaluation-list";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { PageHeader } from "@/components/ui/feedback";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";

export const metadata: Metadata = { title: "Kết quả học tập" };

// FR-025, FR-033.
export default async function StudentResultsPage() {
  const actor = await requireRole("STUDENT");
  const [results, attendance, evaluations] = await Promise.all([
    listPublishedResults(actor, actor.id),
    getStudentAttendance(actor, actor.id),
    listEvaluationsOfStudent(actor, actor.id),
  ]);
  return (
    <>
      <PageHeader title="Kết quả học tập" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ResultsList results={results} linkToAssignment />
        <AttendanceSummary data={attendance} limit={30} />
        <div className="lg:col-span-2">
          <EvaluationList evaluations={evaluations} />
        </div>
      </div>
    </>
  );
}
