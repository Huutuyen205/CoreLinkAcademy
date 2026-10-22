import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/people/profile-form";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { DataTable } from "@/components/ui/data-table";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listSessionsForManager } from "@/server/academic/operations";
import { UserRowActions } from "@/components/people/user-row-actions";
import { ActionLink } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { getTeacherProfile } from "@/server/people/service";
import { CLASS_STATUS, memberStatusLabel, USER_STATUS } from "@/lib/labels";
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
  const [t, sessions] = await Promise.all([orNotFound(getTeacherProfile(actor, id)), listSessionsForManager(actor, from, to, { teacherId: id })]);
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
