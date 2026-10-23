import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { getClassForTeacher } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { deleteEvaluationAction, saveEvaluationAction, sendEvaluationAction } from "@/server/evaluations/actions";
import { classLearningSummary, listClassEvaluations } from "@/server/evaluations/service";
import { orNotFound } from "@/server/page";
import { EVALUATION_STATUS } from "@/lib/labels";
import { formatDateTime, formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Đánh giá định kỳ" };

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);

// Giáo viên §9 — FR-049: xem tổng hợp kết quả, tạo / sửa / gửi đánh giá định kỳ, xem lịch sử.
export default async function ClassEvaluationsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const klass = await orNotFound(getClassForTeacher(actor, id));
  const [rows, summary] = await Promise.all([orNotFound(listClassEvaluations(actor, id)), orNotFound(classLearningSummary(actor, id))]);
  const defaultPeriod = `Tháng ${formatVn(new Date(), "MM/yyyy")}`;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/lop/${klass.id}`}>← Lớp {klass.code}</Link>
      </p>
      <PageHeader title="Đánh giá định kỳ" description={`Lớp ${klass.code}. Bản nháp chỉ bạn thấy; bấm "Gửi" để học sinh và phụ huynh nhận đánh giá.`} />
      {rows.length === 0 ? (
        <EmptyState message="Lớp chưa có học sinh." />
      ) : (
        <ul className="space-y-6">
          {rows.map(({ student, evaluations }) => {
            const sum = summary.get(student.id);
            return (
              <li key={student.id}>
                <Card
                  title={student.fullName}
                  action={
                    <Link href={`/giao-vien/hoc-sinh/${student.id}`} className="inline-flex min-h-11 items-center text-sm">
                      Hồ sơ
                    </Link>
                  }
                >
                  <dl className="mb-4 grid grid-cols-2 gap-3 rounded-control bg-paper p-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-muted">Chuyên cần</dt>
                      <dd className="text-lg font-semibold">{pct(sum?.attendanceRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Buổi đã điểm danh</dt>
                      <dd className="text-lg font-semibold">{sum?.marked ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Điểm TB (bài đã chấm)</dt>
                      <dd className="text-lg font-semibold">{pct(sum?.averagePct)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Bài đã chấm</dt>
                      <dd className="text-lg font-semibold">{sum?.graded ?? 0}</dd>
                    </div>
                  </dl>

                  {evaluations.length > 0 && (
                    <ul className="mb-4 space-y-3">
                      {evaluations.map((ev) => (
                        <li key={ev.id} className="rounded-control border border-line p-3">
                          <p className="flex flex-wrap items-center gap-2 font-medium">
                            {ev.period} <Badge tone={EVALUATION_STATUS[ev.status].tone}>{EVALUATION_STATUS[ev.status].label}</Badge>
                            {ev.sentAt && <span className="text-sm font-normal text-muted">{formatDateTime(ev.sentAt)}</span>}
                          </p>
                          {ev.status === "SENT" ? (
                            <>
                              <p className="mt-1 whitespace-pre-line">{ev.content}</p>
                              {ev.strengths && <p className="mt-1 text-sm">Điểm mạnh: {ev.strengths}</p>}
                              {ev.improvements && <p className="mt-1 text-sm">Cần cải thiện: {ev.improvements}</p>}
                              <details className="mt-2">
                                <summary className="cursor-pointer py-2 text-sm text-primary">Cập nhật đánh giá đã gửi</summary>
                                <ConfigForm
                                  className="mt-2"
                                  action={saveEvaluationAction}
                                  hidden={{ classId: klass.id, studentId: student.id, period: ev.period }}
                                  submitLabel="Lưu và báo HS, PH"
                                  confirm="Cập nhật đánh giá đã gửi? Học sinh và phụ huynh sẽ nhận thông báo."
                                  fields={[
                                    { type: "textarea", name: "content", label: "Nhận xét chung", required: true, maxLength: 5000, rows: 3, defaultValue: ev.content },
                                    { type: "textarea", name: "strengths", label: "Điểm mạnh", maxLength: 2000, rows: 2, defaultValue: ev.strengths ?? "" },
                                    { type: "textarea", name: "improvements", label: "Cần cải thiện", maxLength: 2000, rows: 2, defaultValue: ev.improvements ?? "" },
                                  ]}
                                />
                              </details>
                            </>
                          ) : (
                            <div className="mt-2 space-y-3">
                              <ConfigForm
                                action={saveEvaluationAction}
                                hidden={{ classId: klass.id, studentId: student.id, period: ev.period }}
                                submitLabel="Lưu nháp"
                                submitVariant="secondary"
                                fields={[
                                  { type: "textarea", name: "content", label: "Nhận xét chung", required: true, maxLength: 5000, rows: 3, defaultValue: ev.content },
                                  { type: "textarea", name: "strengths", label: "Điểm mạnh", maxLength: 2000, rows: 2, defaultValue: ev.strengths ?? "" },
                                  { type: "textarea", name: "improvements", label: "Cần cải thiện", maxLength: 2000, rows: 2, defaultValue: ev.improvements ?? "" },
                                ]}
                              />
                              <div className="flex flex-wrap gap-2">
                                <ConfigForm action={sendEvaluationAction} hidden={{ evaluationId: ev.id }} submitLabel="Gửi cho HS & PH" confirm="Gửi đánh giá cho học sinh và phụ huynh? (Sau khi gửi vẫn cập nhật được; HS/PH sẽ được báo.)" fields={[]} />
                                <ConfigForm action={deleteEvaluationAction} hidden={{ evaluationId: ev.id }} submitLabel="Xóa nháp" submitVariant="secondary" confirm="Xóa bản nháp?" fields={[]} />
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <details>
                    <summary className="cursor-pointer py-2.5 text-sm font-medium text-primary">Viết đánh giá kỳ mới</summary>
                    <ConfigForm
                      className="mt-2"
                      action={saveEvaluationAction}
                      hidden={{ classId: klass.id, studentId: student.id }}
                      submitLabel="Lưu nháp"
                      columns={2}
                      fields={[
                        { type: "text", name: "period", label: "Kỳ đánh giá", required: true, maxLength: 40, defaultValue: defaultPeriod, hint: "Vd. Tháng 10/2026, Giữa khóa, Cuối khóa." },
                        { type: "textarea", name: "content", label: "Nhận xét chung", required: true, maxLength: 5000, rows: 3, wide: true },
                        { type: "textarea", name: "strengths", label: "Điểm mạnh", maxLength: 2000, rows: 2 },
                        { type: "textarea", name: "improvements", label: "Cần cải thiện", maxLength: 2000, rows: 2 },
                      ]}
                    />
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
