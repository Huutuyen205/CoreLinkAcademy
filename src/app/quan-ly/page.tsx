import type { Metadata } from "next";
import { AlertTriangle, CalendarClock, ClipboardList, Hourglass, Inbox, Shapes, UserPlus } from "lucide-react";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { BannerLink, WelcomeBanner } from "@/components/layout/welcome-banner";
import { Card, EmptyState } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/stat-card";
import { ROLE_LABELS } from "@/server/auth/policy";
import { classCounts } from "@/server/academic/service";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { countPendingLeaveRequests } from "@/server/requests/leave";
import { countPendingScheduleRequests } from "@/server/requests/schedule";
import { leadCounts } from "@/server/leads/service";

export const metadata: Metadata = { title: "Tổng quan quản lý" };

// FR-034: lead mới/quá hạn, lớp đang chạy, cảnh báo vắng.
export default async function ManagementDashboard({ searchParams }: { searchParams: Promise<{ thongbao?: string | string[] }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { thongbao } = await searchParams;
  const [leads, classes, alerts, scheduleRequests, leaveRequests] = await Promise.all([
    leadCounts(actor),
    classCounts(actor),
    listAbsenceAlerts(actor),
    countPendingScheduleRequests(actor),
    countPendingLeaveRequests(actor),
  ]);

  const stats = [
    { icon: Inbox, label: "Lead mới", value: leads.newCount, href: "/quan-ly/lead?status=NEW" },
    { icon: Hourglass, label: "Lead quá 24 giờ chưa xử lý", value: leads.overdueCount, href: "/quan-ly/lead?quahan=1", warn: leads.overdueCount > 0 },
    { icon: UserPlus, label: "Lớp đang tuyển", value: classes.open, href: "/quan-ly/lop?status=OPEN" },
    { icon: Shapes, label: "Lớp đang học", value: classes.running, href: "/quan-ly/lop?status=IN_PROGRESS" },
    { icon: CalendarClock, label: "Đề xuất đổi lịch chờ duyệt", value: scheduleRequests, href: "/quan-ly/de-xuat", warn: scheduleRequests > 0 },
    { icon: ClipboardList, label: "Đơn xin nghỉ chờ duyệt", value: leaveRequests, href: "/quan-ly/de-xuat#don-nghi", warn: leaveRequests > 0 },
  ];
  const todo = [
    leads.overdueCount && `${leads.overdueCount} lead quá hạn`,
    scheduleRequests && `${scheduleRequests} đề xuất đổi lịch`,
    leaveRequests && `${leaveRequests} đơn xin nghỉ`,
  ].filter(Boolean);

  return (
    <>
      <Flash code={thongbao} />
      <WelcomeBanner
        name={actor.fullName}
        roleLabel={ROLE_LABELS[actor.role]}
        summary={todo.length > 0 ? `Cần xử lý: ${todo.join(", ")}.` : "Không có việc tồn đọng. Tuyển sinh và đào tạo đang ổn định."}
      >
        <BannerLink href="/quan-ly/lich">Lịch tổng</BannerLink>
        <BannerLink href="/quan-ly/bao-cao">Báo cáo</BannerLink>
        <BannerLink href="/thong-bao/gui">Gửi thông báo</BannerLink>
        <BannerLink href="/tai-lieu">Giáo trình & tài liệu</BannerLink>
      </WelcomeBanner>
      <ul className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {stats.map((s, i) => (
          <li key={s.label}>
            <StatCard icon={s.icon} label={s.label} value={s.value} href={s.href} tone={s.warn ? "warning" : "primary"} index={i} />
          </li>
        ))}
      </ul>
      <Card title="Cảnh báo vắng không phép 2 buổi liên tiếp" action={alerts.length > 0 ? <AlertTriangle className="size-5 text-danger" aria-hidden="true" /> : undefined}>
        {alerts.length === 0 ? (
          <EmptyState message="Không có học sinh nào cần chú ý." />
        ) : (
          <ul className="divide-y divide-line">
            {alerts.map((a) => (
              <li key={`${a.classId}-${a.studentId}`} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{a.studentName}</span>
                <Link href={`/quan-ly/lop/${a.classId}`}>Lớp {a.classCode}</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
