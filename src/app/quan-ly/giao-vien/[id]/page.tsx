import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/people/profile-form";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { DataTable } from "@/components/ui/data-table";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listSessionsForManager } from "@/server/academic/operations";
import { UserRowActions } from "@/components/people/user-row-actions";
import { ConfigForm } from "@/components/forms/config-form";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { reviewIntroAction, setMemberStatusAction } from "@/server/people/actions";
import { listAvailability } from "@/server/people/teacher";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { getTeacherProfile } from "@/server/people/service";
import { CLASS_STATUS, memberStatusLabel, REQUEST_STATUS, USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatSchedule } from "@/lib/schedule";
import { formatDate, parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Hồ sơ giáo viên" };

// Admin §3 — FR-036: chi tiết hồ sơ, lớp phụ trách, lịch giảng dạy theo tuần.
export default async function TeacherDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tuan?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const weekStart = parseWeekParam((await searchParams).tuan);
  const { from, to } = vnWeekRange(weekStart);
  const [t, sessions, slots] = await Promise.all([orNotFound(getTeacherProfile(actor, id)), listSessionsForManager(actor, from, to, { teacherId: id }), listAvailability(actor, id)]);
  const ms = memberStatusLabel("TEACHER", t.memberStatus);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/giao-vien">← Giáo viên</Link>
      </p>
      <PageHeader
        title={t.fullName}
        description={[t.expertise, t.phone ? formatPhone(t.phone) : null, t.email].filter(Boolean).join(" · ") || "Giáo viên"}
        action={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={ms.tone}>{ms.label}</Badge>
            {t.status === "DISABLED" && <Badge tone={USER_STATUS.DISABLED.tone}>Tài khoản bị khóa</Badge>}
            <ActionLink href={`/quan-ly/lich?gv=${t.id}`} icon="schedule">
              Lịch dạy
            </ActionLink>
            <UserRowActions user={{ ...t, role: "TEACHER" }} actor={actor} hideProfile />
          </span>
        }
      />
      <div className="space-y-6">
        {actor.role === "ADMIN" && (
          <Card title="Trạng thái hoạt động">
            <p className="mb-3 text-sm text-muted">Giáo viên tạm nghỉ / đã nghỉ vẫn giữ lịch sử lớp; khóa đăng nhập dùng nút &ldquo;Khóa&rdquo; ở đầu trang.</p>
            <RowActions>
              {(["ACTIVE", "ON_LEAVE", "INACTIVE"] as const).map((st) => (
                <ActionButton
                  key={st}
                  action={setMemberStatusAction}
                  hidden={{ userId: t.id, status: st }}
                  icon={st === "ACTIVE" ? "restore" : "hide"}
                  tone={t.memberStatus === st ? "primary" : "default"}
                  confirm={t.memberStatus === st ? undefined : `Chuyển ${t.fullName} sang "${memberStatusLabel("TEACHER", st).label}"?`}
                >
                  {memberStatusLabel("TEACHER", st).label}
                  {t.memberStatus === st ? " ✓" : ""}
                </ActionButton>
              ))}
            </RowActions>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Hồ sơ giới thiệu" id="gioi-thieu" className="scroll-mt-24" action={t.introStatus && <Badge tone={REQUEST_STATUS[t.introStatus].tone}>{REQUEST_STATUS[t.introStatus].label}</Badge>}>
            {t.introStatus === "PENDING" ? (
              <>
                <p className="mb-1 text-sm font-semibold">Bản chờ duyệt</p>
                <p className="mb-4 whitespace-pre-line rounded-control bg-paper p-3 text-sm">{t.introDraft}</p>
                <ConfigForm
                  action={reviewIntroAction}
                  hidden={{ teacherId: t.id }}
                  submitLabel="Gửi quyết định"
                  fields={[
                    { type: "select", name: "decision", label: "Quyết định", required: true, options: [{ value: "approve", label: "Duyệt — hiển thị cho HS, PH" }, { value: "reject", label: "Từ chối — yêu cầu sửa" }] },
                    { type: "text", name: "note", label: "Ghi chú cho giáo viên", maxLength: 500 },
                  ]}
                />
              </>
            ) : t.introPublished ? (
              <p className="whitespace-pre-line text-sm">{t.introPublished}</p>
            ) : (
              <p className="text-sm text-muted">Giáo viên chưa gửi hồ sơ giới thiệu.</p>
            )}
          </Card>
          <Card title={`Lịch rảnh đăng ký (${slots.length})`}>
            {slots.length === 0 ? (
              <p className="text-sm text-muted">Giáo viên chưa đăng ký lịch rảnh.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {slots.map((s) => (
                  <li key={s.id} className="py-1.5">
                    <strong>{["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"][s.weekday]}</strong> {s.startTime}–{s.endTime}
                    {s.note ? <span className="text-muted"> · {s.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title={`Lớp phụ trách (${t.teachingClasses.length})`}>
          {t.teachingClasses.length === 0 ? (
            <EmptyState message="Chưa phụ trách lớp nào." />
          ) : (
            <DataTable
              caption="Lớp phụ trách"
              rows={t.teachingClasses}
              rowKey={(c) => c.id}
              columns={[
                {
                  header: "Lớp",
                  primary: true,
                  cell: (c) => (
                    <Link href={`/quan-ly/lop/${c.id}`} className="font-medium">
                      {c.code}
                    </Link>
                  ),
                },
                { header: "Khóa", cell: (c) => c.course.title },
                { header: "Lịch", cell: (c) => formatSchedule(c.weekdays, c.startTime, c.endTime) },
                { header: "Khai giảng", cell: (c) => formatDate(c.startDate) },
                { header: "Sĩ số", cell: (c) => c._count.enrollments },
                { header: "Trạng thái", cell: (c) => <Badge tone={CLASS_STATUS[c.status].tone}>{CLASS_STATUS[c.status].label}</Badge> },
              ]}
            />
          )}
        </Card>

        <section>
          <h2 className="mb-3 text-xl">Lịch giảng dạy</h2>
          <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/quan-ly/giao-vien/${t.id}?tuan=${w}`} sessionHref={(s) => `/quan-ly/buoi/${s.id}`} />
        </section>

        <Card title="Hồ sơ">
          {actor.role === "ADMIN" ? (
            <ProfileForm profile={{ ...t, role: "TEACHER" }} />
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Ngày sinh</dt>
                <dd>{t.dateOfBirth ? formatDate(t.dateOfBirth) : "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Địa chỉ</dt>
                <dd>{t.address ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">Ghi chú</dt>
                <dd className="whitespace-pre-line">{t.profileNote ?? "—"}</dd>
              </div>
            </dl>
          )}
        </Card>
        {actor.role === "ADMIN" && (
          <p className="text-sm">
            Tài khoản đăng nhập (khóa, đặt lại mật khẩu): <Link href={`/quan-ly/nguoi-dung/${t.id}`}>Quản lý tài khoản</Link>
          </p>
        )}
      </div>
    </>
  );
}
