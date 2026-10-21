import type { Metadata } from "next";
import { SessionAttendance } from "@/components/attendance/session-attendance";
import { getSessionForAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";

export const metadata: Metadata = { title: "Điểm danh" };

// FR-024: Staff/Admin sửa điểm danh, ngoài khung bắt buộc lý do + audit.
export default async function ManageSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const data = await orNotFound(getSessionForAttendance(actor, (await params).id));
  return <SessionAttendance data={data} backHref={`/quan-ly/lop/${data.session.classId}`} backLabel="Về lớp" />;
}
