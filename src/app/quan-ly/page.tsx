import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { classCounts } from "@/server/academic/service";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { leadCounts } from "@/server/leads/service";

export const metadata: Metadata = { title: "Tổng quan quản lý" };

// FR-034: lead mới/quá hạn, lớp đang chạy, cảnh báo vắng.
export default async function ManagementDashboard({ searchParams }: { searchParams: Promise<{ thongbao?: string | string[] }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { thongbao } = await searchParams;
  const [leads, classes, alerts] = await Promise.all([leadCounts(actor), classCounts(actor), listAbsenceAlerts(actor)]);

  const stats = [
    { label: "Lead mới", value: leads.newCount, href: "/quan-ly/lead?status=NEW" },
    { label: "Lead quá 24 giờ chưa xử lý", value: leads.overdueCount, href: "/quan-ly/lead?quahan=1", warn: leads.overdueCount > 0 },
    { label: "Lớp đang tuyển", value: classes.open, href: "/quan-ly/lop?status=OPEN" },
    { label: "Lớp đang học", value: classes.running, href: "/quan-ly/lop?status=IN_PROGRESS" },
  ];

  return (
    <>
      <Flash code={thongbao} />
      <PageHeader title={`Xin chào, ${actor.fullName}`} description="Tổng quan tuyển sinh và đào tạo." />
      <ul className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`block rounded-block border bg-surface p-4 text-ink no-underline hover:border-primary ${s.warn ? "border-warning" : "border-line"}`}>
              <span className={`block font-heading text-3xl font-bold ${s.warn ? "text-warning" : "text-primary"}`}>{s.value}</span>
              <span className="mt-1 block text-sm text-muted">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Card title="Cảnh báo vắng không phép 2 buổi liên tiếp">
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
