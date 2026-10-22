import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Hourglass,
  Inbox,
  PlusCircle,
  Shapes,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
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
export default async function ManagementDashboard({
  searchParams,
}: {
  searchParams: Promise<{ thongbao?: string | string[] }>;
}) {
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
    { icon: Inbox, label: "Lead mới cần tư vấn", value: leads.newCount, href: "/quan-ly/lead?status=NEW" },
    {
      icon: Hourglass,
      label: "Lead quá 24h chưa xử lý",
      value: leads.overdueCount,
      href: "/quan-ly/lead?quahan=1",
      warn: leads.overdueCount > 0,
    },
    { icon: UserPlus, label: "Lớp đang tuyển sinh", value: classes.open, href: "/quan-ly/lop?status=OPEN" },
    { icon: Shapes, label: "Lớp đang diễn ra", value: classes.running, href: "/quan-ly/lop?status=IN_PROGRESS" },
    {
      icon: CalendarClock,
      label: "Đề xuất đổi lịch chờ duyệt",
      value: scheduleRequests,
      href: "/quan-ly/de-xuat",
      warn: scheduleRequests > 0,
    },
    {
      icon: ClipboardList,
      label: "Đơn xin nghỉ chờ duyệt",
      value: leaveRequests,
      href: "/quan-ly/de-xuat#don-nghi",
      warn: leaveRequests > 0,
    },
  ];

  const todo = [
    leads.overdueCount && `${leads.overdueCount} lead quá hạn`,
    scheduleRequests && `${scheduleRequests} đề xuất đổi lịch`,
    leaveRequests && `${leaveRequests} đơn xin nghỉ`,
  ].filter(Boolean);
  const hasAlerts = alerts.length > 0;

  return (
    <div className="space-y-6">
      <Flash code={thongbao} />

      <WelcomeBanner
        name={actor.fullName}
        roleLabel={ROLE_LABELS[actor.role]}
        summary={
          todo.length > 0
            ? `Cần xử lý: ${todo.join(", ")}.`
            : "Hệ thống vận hành trơn tru. Không có hồ sơ hoặc đề xuất tồn đọng."
        }
      >
        <BannerLink href="/quan-ly/lead/moi">
          <PlusCircle className="size-4" />
          <span>Nhập lead mới</span>
        </BannerLink>
        <BannerLink href="/quan-ly/lop/moi">
          <PlusCircle className="size-4" />
          <span>Mở lớp mới</span>
        </BannerLink>
        <BannerLink href="/quan-ly/lich">Lịch tổng</BannerLink>
        <BannerLink href="/quan-ly/bao-cao">Báo cáo</BannerLink>
        <BannerLink href="/thong-bao/gui">Gửi thông báo</BannerLink>
      </WelcomeBanner>

      {/* ─── Bento KPI grid ─── */}
      <section aria-label="Số liệu tổng quan">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Chỉ số vận hành trọng yếu
          </h2>
          <span className="text-xs text-subtle">Cập nhật theo thời gian thực</span>
        </div>
        <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
          {stats.map((s, i) => (
            <li key={s.label}>
              <StatCard
                icon={s.icon}
                label={s.label}
                value={s.value}
                href={s.href}
                tone={s.warn ? "warning" : "primary"}
                index={i}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Two Columns: Operational Hub & Alerts ─── */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Operational Quick Management Hub */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-line/70">
            <div>
              <h2 className="text-lg font-bold text-ink">Phân hệ nghiệp vụ chính</h2>
              <p className="text-xs text-muted">Truy cập nhanh các chức năng quản trị trường học</p>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              CoreLink v3.3
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/quan-ly/lead"
              className="group flex items-center justify-between rounded-xl border border-line p-3.5 no-underline transition-all duration-200 hover:border-primary/40 hover:bg-paper hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Inbox className="size-5" />
                </span>
                <div>
                  <span className="block font-bold text-sm text-ink group-hover:text-primary">Quản lý Phễu Lead</span>
                  <span className="block text-xs text-muted">{leads.newCount} lead mới nhận</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/quan-ly/lop"
              className="group flex items-center justify-between rounded-xl border border-line p-3.5 no-underline transition-all duration-200 hover:border-primary/40 hover:bg-paper hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Shapes className="size-5" />
                </span>
                <div>
                  <span className="block font-bold text-sm text-ink group-hover:text-primary">Quản lý Lớp học</span>
                  <span className="block text-xs text-muted">{classes.running} lớp đang chạy</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/quan-ly/hoc-vien"
              className="group flex items-center justify-between rounded-xl border border-line p-3.5 no-underline transition-all duration-200 hover:border-primary/40 hover:bg-paper hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Users className="size-5" />
                </span>
                <div>
                  <span className="block font-bold text-sm text-ink group-hover:text-primary">Học viên &amp; Phụ huynh</span>
                  <span className="block text-xs text-muted">Hồ sơ và liên kết gia đình</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/quan-ly/de-xuat"
              className="group flex items-center justify-between rounded-xl border border-line p-3.5 no-underline transition-all duration-200 hover:border-primary/40 hover:bg-paper hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <CalendarClock className="size-5" />
                </span>
                <div>
                  <span className="block font-bold text-sm text-ink group-hover:text-primary">Duyệt đề xuất &amp; Đơn</span>
                  <span className="block text-xs text-muted">{scheduleRequests + leaveRequests} đơn đang chờ</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* ─── Cảnh báo vắng ─── */}
        <Card
          title="Cảnh báo vắng liên tiếp (≥2 buổi)"
          action={
            hasAlerts ? (
              <span className="flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-bold text-danger border border-danger/20">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                {alerts.length} học sinh
              </span>
            ) : undefined
          }
          className={hasAlerts ? "border-danger/30 shadow-xs" : undefined}
        >
          {alerts.length === 0 ? (
            <EmptyState message="Không có học sinh nào vắng không phép liên tiếp. Chuyên cần rất tốt!" />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li
                  key={`${a.classId}-${a.studentId}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="size-2.5 rounded-full bg-danger animate-pulse" aria-hidden="true" />
                    <span className="font-bold text-ink text-sm">{a.studentName}</span>
                  </span>
                  <Link
                    href={`/quan-ly/lop/${a.classId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline rounded-lg bg-primary-soft px-2.5 py-1"
                  >
                    <span>Lớp {a.classCode}</span>
                    <span>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
