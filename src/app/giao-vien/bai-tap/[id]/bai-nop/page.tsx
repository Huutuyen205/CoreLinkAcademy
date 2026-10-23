import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { deleteSubmissionAction, remindUnsubmittedAction, returnSubmissionAction, uploadSubmissionForStudentAction } from "@/server/assessment/actions";
import { listSubmissions } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { orNotFound } from "@/server/page";
import { SUBMISSION_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài nộp" };

// Giáo viên §8: danh sách bài làm, chấm, yêu cầu nộp lại, xóa bài làm, tải bài làm thay học sinh, nhắc nộp bài.
export default async function SubmissionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const { assignment, rows } = await orNotFound(listSubmissions(actor, id));
  const submitted = rows.filter((r) => r.submission && r.submission.status !== "IN_PROGRESS").length;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/bai-tap/${id}`}>← {assignment.title}</Link>
      </p>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader
        title="Bài nộp"
        description={`${assignment.title} · lớp ${assignment.class.code} · ${submitted}/${rows.length} học sinh đã nộp`}
        action={
          <RowActions>
            {assignment.status === "PUBLISHED" && submitted < rows.length && (
              <ActionButton action={remindUnsubmittedAction} hidden={{ assignmentId: id }} icon="message" tone="primary" confirm="Gửi thông báo nhắc nộp bài cho học sinh chưa nộp và phụ huynh?">
                Nhắc nộp bài
              </ActionButton>
            )}
            <ButtonLink href={`/giao-vien/lop/${assignment.class.id}#bang-diem`} variant="secondary" size="sm">
              Bảng điểm lớp
            </ButtonLink>
          </RowActions>
        }
      />
      {rows.length === 0 ? (
        <EmptyState message="Lớp chưa có học sinh." />
      ) : (
        <DataTable
          caption="Danh sách bài nộp"
          rows={rows}
          rowKey={(r) => r.student.id}
          columns={[
            { header: "Học sinh", primary: true, cell: (r) => `${r.student.fullName} (${r.student.studentCode ?? "—"})` },
            {
              header: "Trạng thái",
              cell: (r) =>
                !r.submission ? (
                  <span className="text-muted">Chưa mở bài</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={SUBMISSION_STATUS[r.submission.status].tone}>
                      {r.submission.status === "IN_PROGRESS" && r.submission.returnedAt ? "Đang nộp lại" : SUBMISSION_STATUS[r.submission.status].label}
                    </Badge>
                    {r.submission.isLate && <Badge tone="warning">Nộp muộn</Badge>}
                  </span>
                ),
            },
            { header: "Nộp lúc", cell: (r) => (r.submission?.submittedAt ? formatDateTime(r.submission.submittedAt) : "—") },
            { header: "Điểm", cell: (r) => (r.submission?.status === "GRADED" ? r.submission.score : "—") },
            {
              header: "Thao tác",
              cell: (r) => {
                const s = r.submission;
                const done = s && s.status !== "IN_PROGRESS";
                return (
                  <div className="space-y-2">
                    <RowActions>
                      {done && (
                        <ActionLink href={`/giao-vien/bai-nop/${s.id}`} icon={s.status === "SUBMITTED" ? "edit" : "view"} tone={s.status === "SUBMITTED" ? "primary" : "default"}>
                          {s.status === "SUBMITTED" ? "Chấm bài" : "Xem / sửa điểm"}
                        </ActionLink>
                      )}
                      {done && assignment.status === "PUBLISHED" && (
                        <ActionButton
                          action={returnSubmissionAction}
                          hidden={{ submissionId: s.id }}
                          icon="restore"
                          prompt={{ name: "note", message: `Yêu cầu ${r.student.fullName} nộp lại? Điểm hiện tại bị xóa, em sửa bài và nộp lại.\nLời nhắn cho học sinh (không bắt buộc):` }}
                        >
                          Yêu cầu nộp lại
                        </ActionButton>
                      )}
                      {s && (
                        <ActionButton
                          action={deleteSubmissionAction}
                          hidden={{ submissionId: s.id }}
                          icon="delete"
                          tone="danger"
                          confirm={`Xóa hẳn bài làm của ${r.student.fullName} (câu trả lời, ảnh, tệp, điểm)? Không hoàn tác được.`}
                        >
                          Xóa bài làm
                        </ActionButton>
                      )}
                    </RowActions>
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-primary">{done ? "Thêm ảnh/tệp bài làm" : "Tải bài làm thay học sinh"}</summary>
                      <ConfigForm
                        className="mt-2 space-y-2"
                        action={uploadSubmissionForStudentAction}
                        hidden={{ assignmentId: id, studentId: r.student.id }}
                        submitLabel="Tải lên"
                        submitVariant="secondary"
                        fields={[{ type: "file", name: "files", label: "Ảnh chụp bài làm trên giấy / tệp", hint: ACCEPT_LABEL, accept: `image/*,${ACCEPT_ATTRIBUTE}`, multiple: true }]}
                      />
                    </details>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </>
  );
}
