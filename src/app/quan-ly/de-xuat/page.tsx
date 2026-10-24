import type { RequestStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { ConfigForm } from "@/components/forms/config-form";
import { LeaveRequestList } from "@/components/requests/leave-request-list";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { scheduleFilterOptions } from "@/server/academic/operations";
import { requireRole } from "@/server/auth/guard";
import { handleScheduleRequestAction } from "@/server/requests/actions";
import { listLeaveRequestsForHandler } from "@/server/requests/leave";
import { listScheduleRequests } from "@/server/requests/schedule";
import { cn } from "@/lib/format";
import { REQUEST_STATUS, SCHEDULE_REQUEST_TYPE } from "@/lib/labels";
import { formatDateTime, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Đề xuất & đơn nghỉ" };

const FILTERS: (RequestStatus | undefined)[] = ["PENDING", undefined];

// Admin §7 — FR-043: xử lý đề xuất đổi lịch của giáo viên; FR-044: đơn xin nghỉ của phụ huynh.
export default async function ManagerRequestsPage({ searchParams }: { searchParams: Promise<{ tat?: string; thongbao?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const all = sp.tat === "1";
  const status: RequestStatus | undefined = all ? undefined : "PENDING";
  const [requests, leaves, options] = await Promise.all([listScheduleRequests(actor, status), listLeaveRequestsForHandler(actor, status), scheduleFilterOptions(actor)]);

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader title="Đề xuất & đơn nghỉ" description="Đề xuất đổi lịch của giáo viên và đơn xin nghỉ của phụ huynh." />
      <nav aria-label="Lọc" className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f ?? "all"}
            href={f ? "/quan-ly/de-xuat" : "/quan-ly/de-xuat?tat=1"}
            aria-current={(f === undefined) === all ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline",
              (f === undefined) === all ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink",
            )}
          >
            {f ? "Chờ duyệt" : "Tất cả"}
          </Link>
        ))}
      </nav>
      <div className="space-y-6">
        <Card title={`Đề xuất đổi lịch của giáo viên (${requests.length})`}>
          {requests.length === 0 ? (
            <EmptyState message="Không có đề xuất." />
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {r.teacher.fullName} · {SCHEDULE_REQUEST_TYPE[r.type]}
                      </p>
                      <p className="text-sm text-muted">
                        Lớp <Link href={`/quan-ly/lop/${r.session.class.id}`}>{r.session.class.code}</Link> buổi {r.session.index}: {formatDateTime(r.session.startsAt)}
                        {r.proposedStartsAt && ` → ${formatDateTime(r.proposedStartsAt)}–${formatTime(r.proposedEndsAt!)}`} · gửi {formatDateTime(r.createdAt)}
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
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <ConfigForm
                        action={handleScheduleRequestAction}
                        hidden={{ requestId: r.id, decision: "approve", ...(r.type === "RESCHEDULE" ? { substituteTeacherId: "" } : {}) }}
                        submitLabel={r.type === "RESCHEDULE" ? "Duyệt và dời buổi" : "Duyệt"}
                        confirm={r.type === "RESCHEDULE" ? "Dời buổi theo đề xuất và thông báo cho lớp?" : "Duyệt nghỉ? Không chọn GV dạy thay thì buổi học bị hủy và lớp được thông báo."}
                        fields={[
                          ...(r.type === "LEAVE"
                            ? ([
                                {
                                  type: "select",
                                  name: "substituteTeacherId",
                                  label: "Giáo viên dạy thay",
                                  placeholder: "Không có — hủy buổi",
                                  options: options.teachers.filter((t) => t.id !== r.teacher.id).map((t) => ({ value: t.id, label: t.fullName })),
                                },
                              ] as const)
                            : []),
                          { type: "text", name: "note", label: "Phản hồi (tùy chọn)", maxLength: 500 },
                        ]}
                      />
                      <ConfigForm
                        action={handleScheduleRequestAction}
                        hidden={{ requestId: r.id, decision: "reject", substituteTeacherId: "" }}
                        submitLabel="Từ chối"
                        submitVariant="secondary"
                        fields={[{ type: "text", name: "note", label: "Lý do từ chối", maxLength: 500 }]}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={`Đơn xin nghỉ của học sinh (${leaves.length})`}>
          <div id="don-nghi">
            <LeaveRequestList rows={leaves} studentHref={(id) => `/quan-ly/hoc-vien/${id}`} />
          </div>
        </Card>
      </div>
    </>
  );
}
