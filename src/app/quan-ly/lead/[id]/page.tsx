import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { listEnrollableClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { addLeadNoteAction, changeLeadStatusAction } from "@/server/leads/actions";
import { CONVERTIBLE_STATUSES, isLeadOverdue, LEAD_TRANSITIONS } from "@/server/leads/rules";
import { getLead } from "@/server/leads/service";
import { LEAD_SOURCE_LABELS, LEAD_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";
import { ConvertLeadForm } from "./convert-form";

export const metadata: Metadata = { title: "Chi tiết lead" };

const ACTIVITY_LABELS = {
  CREATED: "Tạo từ form",
  RESUBMITTED: "Gửi lại form",
  NOTE: "Ghi chú",
  STATUS_CHANGE: "Đổi trạng thái",
  CONVERTED: "Chuyển học viên",
} as const;

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const { thongbao } = await searchParams;
  const lead = await orNotFound(getLead(actor, id));
  const next = LEAD_TRANSITIONS[lead.status];
  const canConvert = CONVERTIBLE_STATUSES.includes(lead.status);
  const classes = canConvert ? await listEnrollableClasses(actor) : [];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/lead">← Danh sách lead</Link>
      </p>
      <Flash code={thongbao} />
      <PageHeader
        title={lead.parentName}
        description={`Học sinh ${lead.studentName}${lead.gradeLevel ? `, lớp ${lead.gradeLevel}` : ""}`}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone={LEAD_STATUS[lead.status].tone}>{LEAD_STATUS[lead.status].label}</Badge>
            {isLeadOverdue(lead, new Date()) && <Badge tone="warning">Quá hạn xử lý</Badge>}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Thông tin">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Số điện thoại" value={<a href={`tel:${lead.phone}`}>{formatPhone(lead.phone)}</a>} />
              <Info label="Email" value={lead.email ?? "—"} />
              <Info label="Môn quan tâm" value={lead.subject?.name ?? "—"} />
              <Info label="Khóa học" value={lead.course?.title ?? "—"} />
              <Info label="Nguồn" value={LEAD_SOURCE_LABELS[lead.source] ?? lead.source} />
              <Info label="Ngày tạo" value={formatDateTime(lead.createdAt)} />
              {lead.lostReason && <Info label="Lý do không theo học" value={lead.lostReason} />}
              {lead.convertedStudent && (
                <Info label="Học viên" value={`${lead.convertedStudent.fullName} (${lead.convertedStudent.studentCode ?? "—"})`} />
              )}
            </dl>
            {lead.note && <p className="mt-4 whitespace-pre-line border-t border-line pt-3 text-sm">{lead.note}</p>}
          </Card>

          <Card title="Lịch sử hoạt động">
            <ol className="space-y-4">
              {lead.activities.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-4">
                  <p className="text-sm text-muted">
                    {ACTIVITY_LABELS[a.type]} · {formatDateTime(a.createdAt)} · {a.actor?.fullName ?? "Hệ thống"}
                  </p>
                  <p className="mt-1 whitespace-pre-line">{a.content}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {next.length > 0 && (
            <Card title="Đổi trạng thái">
              <ConfigForm
                action={changeLeadStatusAction}
                hidden={{ leadId: lead.id }}
                submitLabel="Cập nhật"
                fields={[
                  { type: "select", name: "status", label: "Trạng thái mới", required: true, placeholder: "Chọn", options: next.map((s) => ({ value: s, label: LEAD_STATUS[s].label })) },
                  { type: "textarea", name: "lostReason", label: "Lý do (bắt buộc khi chọn Không theo học)", maxLength: 255, rows: 2 },
                ]}
              />
            </Card>
          )}
          <Card title="Thêm ghi chú">
            <ConfigForm
              action={addLeadNoteAction}
              hidden={{ leadId: lead.id }}
              submitLabel="Lưu ghi chú"
              fields={[{ type: "textarea", name: "content", label: "Nội dung", required: true, maxLength: 2000, rows: 3 }]}
            />
          </Card>
          {canConvert && (
            <Card title="Chuyển thành học viên">
              <ConvertLeadForm
                lead={{ id: lead.id, studentName: lead.studentName, gradeLevel: lead.gradeLevel, parentName: lead.parentName, phone: lead.phone, email: lead.email }}
                classes={classes.map((c) => ({ value: c.id, label: `${c.code} — ${c.course.title} (còn ${c.capacity - c._count.enrollments} chỗ)` }))}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
