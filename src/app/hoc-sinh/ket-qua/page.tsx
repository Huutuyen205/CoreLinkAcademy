import type { Metadata } from "next";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { PageHeader } from "@/components/ui/feedback";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Kết quả học tập" };

// FR-025, FR-033.
export default async function StudentResultsPage() {
  const actor = await requireRole("STUDENT");
  const [results, attendance] = await Promise.all([listPublishedResults(actor, actor.id), getStudentAttendance(actor, actor.id)]);
  return (
    <>
      <PageHeader title="Kết quả học tập" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ResultsList results={results} linkToAssignment />
        <AttendanceSummary data={attendance} limit={30} />
      </div>
    </>
  );
}
