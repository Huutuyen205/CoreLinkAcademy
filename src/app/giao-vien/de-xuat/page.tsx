import type { Metadata } from "next";
import { Flash } from "@/components/layout/flash";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { LeaveRequestList } from "@/components/requests/leave-request-list";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { cancelScheduleRequestAction, createScheduleRequestAction, updateScheduleRequestAction } from "@/server/requests/actions";
import { listLeaveRequestsForHandler } from "@/server/requests/leave";
import { listMyScheduleRequests, listMyUpcomingSessions } from "@/server/requests/schedule";
import { REQUEST_STATUS, SCHEDULE_REQUEST_TYPE } from "@/lib/labels";
import { formatDateTime, formatTime, formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Đề xuất & đơn nghỉ" };

const typeOptions = [
  { value: "LEAVE", label: SCHEDULE_REQUEST_TYPE.LEAVE },
  { value: "RESCHEDULE", label: SCHEDULE_REQUEST_TYPE.RESCHEDULE },
];

function proposalFields(defaults?: { type: string; date: string; startTime: string; endTime: string; reason: string }): FieldConfig[] {
  return [
    { type: "select", name: "type", label: "Loại đề xuất", required: true, options: typeOptions, defaultValue: defaults?.type ?? "LEAVE" },
    { type: "date", name: "date", label: "Ngày mới (khi dời buổi)", defaultValue: defaults?.date ?? "" },
    { type: "time", name: "startTime", label: "Bắt đầu", defaultValue: defaults?.startTime ?? "" },
    { type: "time", name: "endTime", label: "Kết thúc", defaultValue: defaults?.endTime ?? "" },
    { type: "textarea", name: "reason", label: "Lý do", required: true, maxLength: 500, rows: 2, wide: true, defaultValue: defaults?.reason ?? "" },
  ];
}

// Giáo viên §2 — FR-043: tạo/sửa/rút đề xuất đổi lịch. Phụ huynh §2 — FR-044: duyệt đơn xin nghỉ của lớp mình.
export default async function TeacherRequestsPage({ searchParams }: { searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { thongbao } = await searchParams;
  const [requests, sessions, leaves] = await Promise.all([listMyScheduleRequests(actor), listMyUpcomingSessions(actor), listLeaveRequestsForHandler(actor)]);
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;

  return (
    <>
      <Flash code={thongbao} />
      <PageHeader title="Đề xuất & đơn nghỉ" description="Xin nghỉ hoặc dời buổi dạy (giáo vụ duyệt) và duyệt đơn xin nghỉ của học sinh lớp bạn." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title={`Đơn xin nghỉ của học sinh${pendingLeaves ? ` · ${pendingLeaves} chờ duyệt` : ""}`}>
            <div id="don-nghi">
              <LeaveRequestList rows={leaves} studentHref={(id) => `/giao-vien/hoc-sinh/${id}`} />
            </div>
          </Card>

          <Card title={`Đề xuất của tôi (${requests.length})`}>
            {requests.length === 0 ? (
              <EmptyState message="Chưa có đề xuất nào." />
            ) : (
              <ul className="divide-y divide-line">
                {requests.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {SCHEDULE_REQUEST_TYPE[r.type]} · lớp {r.session.class.code} buổi {r.session.index}
                        </p>
                        <p className="text-sm text-muted">
                          Buổi {formatDateTime(r.session.startsAt)}
                          {r.proposedStartsAt && ` → đề xuất ${formatDateTime(r.proposedStartsAt)}–${formatTime(r.proposedEndsAt!)}`}
                        </p>
                      </div>
                      <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge>
                    </div>
                    <p className="mt-1">Lý do: {r.reason}</p>
                    {r.handledBy && (
                      <p className="text-sm text-muted">
                        {r.handledBy.fullName}
                        {r.responseNote ? `: ${r.responseNote}` : ""}
                      </p>
                    )}
                    {r.status === "PENDING" && (
                      <details className="mt-1">
                        <summary className="cursor-pointer py-2.5 text-sm text-primary">Sửa hoặc rút đề xuất</summary>
                        <div className="mt-2 space-y-4">
                          <ConfigForm
                            action={updateScheduleRequestAction}
                            hidden={{ requestId: r.id }}
                            submitLabel="Lưu"
                            submitVariant="secondary"
                            columns={2}
                            fields={proposalFields({
                              type: r.type,
                              date: r.proposedStartsAt ? formatVn(r.proposedStartsAt, "yyyy-MM-dd") : "",
                              startTime: r.proposedStartsAt ? formatTime(r.proposedStartsAt) : "",
                              endTime: r.proposedEndsAt ? formatTime(r.proposedEndsAt) : "",
                              reason: r.reason,
                            })}
                          />
                          <ConfigForm action={cancelScheduleRequestAction} hidden={{ requestId: r.id }} submitLabel="Rút đề xuất" submitVariant="danger" confirm="Rút đề xuất này?" fields={[]} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Tạo đề xuất đổi lịch">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">Bạn không có buổi dạy nào trong 60 ngày tới.</p>
          ) : (
            <ConfigForm
              action={createScheduleRequestAction}
              submitLabel="Gửi đề xuất"
              fields={[
                {
                  type: "select",
                  name: "sessionId",
                  label: "Buổi dạy",
                  required: true,
                  placeholder: "Chọn buổi",
                  options: sessions.map((s) => ({ value: s.id, label: `${s.class.code} · buổi ${s.index} · ${formatVn(s.startsAt, "EEEE dd/MM HH:mm")}` })),
                },
                ...proposalFields(),
              ]}
            />
          )}
          <p className="mt-3 text-sm text-muted">Xin nghỉ: giáo vụ phân công giáo viên dạy thay hoặc cho lớp nghỉ và xếp học bù. Dời buổi: điền ngày giờ mới.</p>
        </Card>
      </div>
    </>
  );
}
