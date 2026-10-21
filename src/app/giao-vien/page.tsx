import type { Metadata } from "next";
import { CalendarCheck, ClipboardList, PenLine, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { BannerLink, WelcomeBanner } from "@/components/layout/welcome-banner";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/stat-card";
import { listSessionsInRange } from "@/server/academic/service";
import { countPendingGrading } from "@/server/assessment/service";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { countPendingLeaveRequests } from "@/server/requests/leave";
import { SESSION_STATUS } from "@/lib/labels";
import { formatDateTime, formatTime, vnDateKey, vnToUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Tổng quan giáo viên" };

// FR-034: buổi hôm nay, bài chờ chấm, cảnh báo vắng của lớp mình.
export default async function TeacherDashboard({ searchParams }: { searchParams: Promise<{ thongbao?: string | string[] }> }) {
  const actor = await requireRole("TEACHER");
  const { thongbao } = await searchParams;
  const from = vnToUtc(vnDateKey(new Date()), "00:00");
  const to = new Date(from.getTime() + 24 * 3_600_000);
  const [today, pending, alerts, leaves] = await Promise.all([
    listSessionsInRange(actor, from, to),
    countPendingGrading(actor),
    listAbsenceAlerts(actor),
    countPendingLeaveRequests(actor),
  ]);

  return (
    <>
      <Flash code={thongbao} />
      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Giáo viên"
        summary={today.length > 0 ? `Hôm nay bạn có ${today.length} buổi dạy. Nhớ điểm danh trong khung giờ nhé!` : "Hôm nay bạn không có buổi dạy."}
      >
        <BannerLink href="/giao-vien/lich">Lịch dạy</BannerLink>
        <BannerLink href="/giao-vien/lop">Lớp của tôi</BannerLink>
        <BannerLink href="/tai-lieu">Tài liệu & giáo án</BannerLink>
      </WelcomeBanner>
      <ul className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <li>
          <StatCard icon={CalendarCheck} label="Buổi dạy hôm nay" value={today.length} href="/giao-vien/lich" index={0} />
        </li>
        <li>
          <StatCard icon={PenLine} label="Bài chờ chấm" value={pending.total} tone={pending.total > 0 ? "warning" : "primary"} index={1} />
        </li>
        <li>
          <StatCard icon={ClipboardList} label="Đơn xin nghỉ chờ duyệt" value={leaves} href="/giao-vien/de-xuat#don-nghi" tone={leaves > 0 ? "warning" : "primary"} index={2} />
        </li>
        <li>
          <StatCard icon={TriangleAlert} label="Cảnh báo vắng liên tiếp" value={alerts.length} tone={alerts.length > 0 ? "danger" : "success"} index={3} />
        </li>
      </ul>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Buổi dạy hôm nay" action={<Link href="/giao-vien/lich" className="inline-flex min-h-11 items-center">Lịch tuần</Link>}>
          {today.length === 0 ? (
            <EmptyState message="Hôm nay bạn không có buổi dạy." />
          ) : (
            <ul className="divide-y divide-line">
              {today.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    <span className="font-medium">
                      {formatTime(s.startsAt)}–{formatTime(s.endsAt)} · {s.class.code}
                    </span>
                    <span className="block text-sm text-muted">
                      {s.class.course.title}
                      {s.room ? ` · ${s.room.name}` : ""}
                    </span>
                  </span>
                  {s.status === "CANCELLED" ? (
                    <Badge tone={SESSION_STATUS.CANCELLED.tone}>{SESSION_STATUS.CANCELLED.label}</Badge>
                  ) : (
                    <Link href={`/giao-vien/buoi/${s.id}`} className="inline-flex min-h-11 items-center">
                      Điểm danh
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Bài chờ chấm (${pending.total})`}>
          {pending.total === 0 ? (
            <EmptyState message="Không có bài nào chờ chấm." />
          ) : (
            <ul className="divide-y divide-line">
              {pending.items.map((p) => (
                <li key={p.id} className="py-3">
                  <Link href={`/giao-vien/bai-nop/${p.id}`} className="font-medium">
                    {p.student.fullName}
                  </Link>
                  <span className="block text-sm text-muted">
                    {p.assignment.title} · {p.assignment.class.code}
                    {p.submittedAt ? ` · nộp ${formatDateTime(p.submittedAt)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Cảnh báo vắng 2 buổi liên tiếp" className="lg:col-span-2">
          {alerts.length === 0 ? (
            <EmptyState message="Không có học sinh nào vắng không phép 2 buổi liên tiếp." />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={`${a.classId}-${a.studentId}`} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{a.studentName}</span>
                  <Link href={`/giao-vien/lop/${a.classId}`}>Lớp {a.classCode}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
