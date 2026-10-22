import type { Metadata } from "next";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  PenLine,
  TriangleAlert,
  Users,
} from "lucide-react";
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
export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: Promise<{ thongbao?: string | string[] }>;
}) {
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
    <div className="space-y-6">
      <Flash code={thongbao} />

      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Giáo viên"
        summary={
          today.length > 0
            ? `Hôm nay bạn có ${today.length} buổi giảng dạy. Hãy điểm danh đúng khung giờ quy định để hệ thống đồng bộ dữ liệu tới phụ huynh!`
            : "Hôm nay bạn không có lịch lên lớp. Chúc bạn một ngày làm việc và chuẩn bị giáo án hiệu quả!"
        }
      >
        <BannerLink href="/giao-vien/lich">
          <CalendarCheck className="size-4" />
          <span>Lịch dạy tuần</span>
        </BannerLink>
        <BannerLink href="/giao-vien/lop">
          <Users className="size-4" />
          <span>Lớp của tôi</span>
        </BannerLink>
        <BannerLink href="/tai-lieu">
          <FileCheck className="size-4" />
          <span>Tài liệu &amp; Giáo án</span>
        </BannerLink>
      </WelcomeBanner>

      {/* ─── 4 Stat Cards ─── */}
      <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <li>
          <StatCard
            icon={CalendarCheck}
            label="Buổi dạy hôm nay"
            value={today.length}
            href="/giao-vien/lich"
            index={0}
          />
        </li>
        <li>
          <StatCard
            icon={PenLine}
            label="Bài tập chờ chấm"
            value={pending.total}
            tone={pending.total > 0 ? "warning" : "primary"}
            index={1}
          />
        </li>
        <li>
          <StatCard
            icon={FileCheck}
            label="Đơn xin nghỉ học sinh"
            value={leaves}
            href="/giao-vien/de-xuat#don-nghi"
            tone={leaves > 0 ? "warning" : "primary"}
            index={2}
          />
        </li>
        <li>
          <StatCard
            icon={TriangleAlert}
            label="Cảnh báo vắng liên tiếp"
            value={alerts.length}
            tone={alerts.length > 0 ? "danger" : "success"}
            index={3}
          />
        </li>
      </ul>

      {/* ─── Two Columns: Today's Classes & Grading Queue ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card Buổi dạy hôm nay */}
        <Card
          title="Lịch lên lớp hôm nay"
          action={
            <Link
              href="/giao-vien/lich"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline rounded-lg bg-primary-soft px-3 py-1.5"
            >
              <span>Xem toàn bộ tuần</span>
              <span>→</span>
            </Link>
          }
        >
          {today.length === 0 ? (
            <EmptyState message="Hôm nay bạn không có buổi dạy nào." />
          ) : (
            <ul className="divide-y divide-line">
              {today.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-tint px-2 py-0.5 text-xs font-extrabold text-primary font-mono">
                        {s.class.code}
                      </span>
                      <span className="font-bold text-ink text-sm sm:text-base">
                        {s.class.course.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <Clock className="size-3.5 text-primary" />
                        {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                      </span>
                      {s.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted" />
                          {s.room.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {s.status === "CANCELLED" ? (
                    <Badge tone={SESSION_STATUS.CANCELLED.tone}>{SESSION_STATUS.CANCELLED.label}</Badge>
                  ) : (
                    <Link
                      href={`/giao-vien/buoi/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-strong text-white px-4 py-2 text-xs font-bold shadow-sm transition-all hover:scale-102"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Điểm danh ngay</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Card Bài chờ chấm */}
        <Card
          title={`Hàng đợi chấm bài (${pending.total})`}
          action={
            pending.total > 0 ? (
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning border border-warning/30">
                {pending.total} bài cần chấm
              </span>
            ) : undefined
          }
        >
          {pending.total === 0 ? (
            <EmptyState message="Tất cả bài tập đã được chấm xong. Không có bài chờ!" />
          ) : (
            <ul className="divide-y divide-line">
              {pending.items.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/giao-vien/bai-nop/${p.id}`}
                      className="font-bold text-ink hover:text-primary transition-colors text-sm truncate block"
                    >
                      {p.student.fullName}
                    </Link>
                    <span className="block text-xs text-muted truncate mt-0.5">
                      {p.assignment.title} · Lớp <span className="font-semibold text-ink">{p.assignment.class.code}</span>
                    </span>
                    {p.submittedAt && (
                      <span className="block text-[11px] text-subtle mt-0.5">
                        Nộp lúc {formatDateTime(p.submittedAt)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/giao-vien/bai-nop/${p.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary-soft hover:bg-primary hover:text-white px-3 py-1.5 text-xs font-bold text-primary transition-all duration-150"
                  >
                    <span>Chấm</span>
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
