import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { Badge, PageHeader } from "@/components/ui/feedback";
import { getClassForTeacher } from "@/server/academic/service";
import { getGradebook, listClassAssignments } from "@/server/assessment/service";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { listDocuments, listClassLessonPlans } from "@/server/documents/service";
import { listClassSupplementalSets } from "@/server/practice/service";
import { orNotFound } from "@/server/page";
import { CLASS_STATUS } from "@/lib/labels";
import { AssignmentsTab } from "./_tabs/assignments";
import { DetailsTab } from "./_tabs/details";
import { PlansAndMaterialsTab } from "./_tabs/documents";
import { StudentsTab } from "./_tabs/students";
import { TabNav } from "./_tabs/tab-nav";
import { parseTab } from "./_tabs/tabs";

export const metadata: Metadata = { title: "Lớp học" };

// FR-033 + UC-007/UC-008: lớp mình dạy gom thành 4 mục — chi tiết, giáo án và tài liệu, bài tập và đề, học sinh (DECISION-D36).
export default async function TeacherClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string; q?: string; tab?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const klass = await orNotFound(getClassForTeacher(actor, id));
  // Giáo viên dạy thay chỉ thấy mục chi tiết (các buổi của mình).
  const tab = klass.isOwner ? parseTab(sp.tab) : "chi-tiet";

  // Buổi gần nhất chưa diễn ra (hoặc buổi cuối) làm mặc định cho nút soạn bằng AI.
  const now = Date.now();
  const upcoming = klass.sessions.find((s) => s.status === "SCHEDULED" && s.startsAt.getTime() >= now) ?? klass.sessions.at(-1);
  const aiSessionId = upcoming?.id ?? null;

  let content;
  if (tab === "giao-an") {
    const [plans, materials] = await Promise.all([listClassLessonPlans(actor, id), listDocuments(actor, { classId: id })]);
    content = <PlansAndMaterialsTab classId={klass.id} plans={plans} materials={materials} aiSessionId={aiSessionId} />;
  } else if (tab === "bai-tap") {
    const [assignments, supplemental, gradebook] = await Promise.all([listClassAssignments(actor, id), listClassSupplementalSets(actor, id), getGradebook(actor, id)]);
    content = <AssignmentsTab classId={klass.id} classCode={klass.code} assignments={assignments} supplemental={supplemental} gradebook={gradebook} aiSessionId={aiSessionId} />;
  } else if (tab === "hoc-sinh") {
    const alerts = await listAbsenceAlerts(actor);
    content = <StudentsTab klass={klass} q={q} absentees={new Set(alerts.filter((a) => a.classId === id).map((a) => a.studentId))} />;
  } else {
    content = <DetailsTab klass={klass} actorId={actor.id} />;
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/giao-vien/lop">← Lớp của tôi</Link>
      </p>
      <Flash code={sp.thongbao} />
      <PageHeader title={`Lớp ${klass.code}`} action={<Badge tone={CLASS_STATUS[klass.status].tone}>{CLASS_STATUS[klass.status].label}</Badge>} />
      {klass.isOwner && <TabNav classId={klass.id} active={tab} />}
      {content}
    </>
  );
}
