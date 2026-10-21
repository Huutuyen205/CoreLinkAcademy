import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { EvaluationList } from "@/components/learner/evaluation-list";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { ProfileForm } from "@/components/people/profile-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { setEnrollmentStatusAction } from "@/server/academic/actions";
import { transferStudentAction } from "@/server/academic/operations-actions";
import { listEnrollableClasses } from "@/server/academic/service";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";
import { orNotFound } from "@/server/page";
import { getStudentProfile } from "@/server/people/service";
import { linkGuardianAction, unlinkGuardianAction } from "@/server/users/actions";
import { listParents } from "@/server/users/service";
import { MAX_GUARDIANS } from "@/server/users/rules";
import { CLASS_STATUS, ENROLLMENT_STATUS, memberStatusLabel, USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Hồ sơ học sinh" };

// Admin §2 — FR-036: hồ sơ, lịch sử lớp, chuyển/gỡ lớp, phụ huynh, chuyên cần, kết quả, đánh giá.
export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const s = await orNotFound(getStudentProfile(actor, id));
  const [attendance, results, classes, parents, evaluations] = await Promise.all([
    getStudentAttendance(actor, id),
    listPublishedResults(actor, id),
    listEnrollableClasses(actor),
    listParents(actor),
    listEvaluationsOfStudent(actor, id),
  ]);
  const ms = memberStatusLabel("STUDENT", s.memberStatus);
  const parentOptions = parents.filter((p) => !s.parentLinks.some((l) => l.parent.id === p.id)).map((p) => ({ value: p.id, label: `${p.fullName}${p.phone ? ` · ${formatPhone(p.phone)}` : ""}` }));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/hoc-vien">← Học viên</Link>
      </p>
      <PageHeader
        title={s.fullName}
        description={[s.studentCode, s.gradeLevel !== null ? (s.gradeLevel === 0 ? "Tiền tiểu học" : `lớp ${s.gradeLevel}`) : null, s.phone ? formatPhone(s.phone) : null, s.email]
          .filter(Boolean)
          .join(" · ")}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone={ms.tone}>{ms.label}</Badge>
            {s.status === "DISABLED" && <Badge tone={USER_STATUS.DISABLED.tone}>Tài khoản bị khóa</Badge>}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title={`Lớp học (${s.enrollments.length})`}>
            {s.enrollments.length === 0 ? (
              <EmptyState message="Chưa ghi danh lớp nào. Ghi danh tại trang chi tiết lớp." />
            ) : (
              <ul className="divide-y divide-line">
                {s.enrollments.map((e) => {
                  const open = e.status === "ACTIVE" || e.status === "PAUSED";
                  return (
                    <li key={e.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link href={`/quan-ly/lop/${e.class.id}`} className="font-medium">
                            {e.class.code}
                          </Link>{" "}
                          <span className="text-sm text-muted">
                            {e.class.course.title} · GV {e.class.teacher.fullName}
                          </span>
                          <p className="text-sm text-muted">
                            Ghi danh {formatDate(e.enrolledAt)}
                            {!open ? ` · cập nhật ${formatDate(e.updatedAt)}` : ""} · lớp {CLASS_STATUS[e.class.status].label.toLowerCase()}
                          </p>
                        </div>
                        <Badge tone={ENROLLMENT_STATUS[e.status].tone}>{ENROLLMENT_STATUS[e.status].label}</Badge>
                      </div>
                      {open && (
                        <details className="mt-1">
                          <summary className="cursor-pointer py-2.5 text-sm text-primary">Chuyển lớp hoặc gỡ khỏi lớp</summary>
                          <div className="mt-2 grid gap-4 md:grid-cols-2">
                            <ConfigForm
                              action={transferStudentAction}
                              hidden={{ enrollmentId: e.id }}
                              submitLabel="Chuyển lớp"
                              submitVariant="secondary"
                              confirm="Chuyển học sinh sang lớp đã chọn? Ghi danh lớp hiện tại sẽ chuyển thành 'Đã nghỉ'."
                              fields={[
                                {
                                  type: "select",
                                  name: "toClassId",
                                  label: "Lớp mới",
                                  required: true,
                                  placeholder: "Chọn lớp còn chỗ",
                                  options: classes.filter((c) => c.id !== e.class.id).map((c) => ({ value: c.id, label: `${c.code} · ${c.course.title} (${c._count.enrollments}/${c.capacity})` })),
                                },
                              ]}
                            />
                            <ConfigForm
                              action={setEnrollmentStatusAction}
                              hidden={{ enrollmentId: e.id, status: "DROPPED" }}
                              submitLabel="Gỡ khỏi lớp"
                              submitVariant="danger"
                              confirm="Gỡ học sinh khỏi lớp này? Ghi danh chuyển thành 'Đã nghỉ', lịch sử học tập được giữ lại."
                              fields={[]}
                            />
                          </div>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <AttendanceSummary data={attendance} />
          <ResultsList results={results} />
          <EvaluationList evaluations={evaluations} title={`Đánh giá định kỳ (${evaluations.length})`} />
          <Card title="Hồ sơ">
            <ProfileForm profile={{ ...s, role: "STUDENT" }} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`Phụ huynh (${s.parentLinks.length}/${MAX_GUARDIANS})`}>
            {s.parentLinks.length === 0 ? (
              <p className="text-sm text-muted">Chưa liên kết phụ huynh.</p>
            ) : (
              <ul className="space-y-3">
                {s.parentLinks.map(({ parent }) => (
                  <li key={parent.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <Link href={`/quan-ly/phu-huynh/${parent.id}`}>{parent.fullName}</Link>
                      <span className="block text-sm text-muted">{[parent.phone ? formatPhone(parent.phone) : null, parent.email].filter(Boolean).join(" · ")}</span>
                    </span>
                    <ConfigForm action={unlinkGuardianAction} hidden={{ parentId: parent.id, studentId: s.id }} submitLabel="Bỏ" submitVariant="secondary" confirm="Bỏ liên kết phụ huynh này?" fields={[]} />
                  </li>
                ))}
              </ul>
            )}
            {s.parentLinks.length < MAX_GUARDIANS && parentOptions.length > 0 && (
              <ConfigForm
                className="mt-4"
                action={linkGuardianAction}
                hidden={{ studentId: s.id }}
                submitLabel="Liên kết"
                submitVariant="secondary"
                fields={[{ type: "select", name: "parentId", label: "Thêm phụ huynh", placeholder: "Chọn phụ huynh", options: parentOptions }]}
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
