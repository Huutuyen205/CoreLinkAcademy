import type { Metadata } from "next";
import { SessionAttendance } from "@/components/attendance/session-attendance";
import { getSessionForAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";

export const metadata: Metadata = { title: "Điểm danh" };

// FR-023: giáo viên điểm danh buổi của lớp mình trong khung thời gian.
export default async function TeacherSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const data = await orNotFound(getSessionForAttendance(actor, (await params).id));
  return <SessionAttendance data={data} backHref={`/giao-vien/lop/${data.session.classId}`} backLabel="Về lớp" />;
}
