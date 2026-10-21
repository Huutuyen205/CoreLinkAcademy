import type { ClassStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { CLASS_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Lớp học" };

export default async function ClassListPage({ searchParams }: { searchParams: Promise<{ status?: string; thongbao?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const status = sp.status && sp.status in CLASS_STATUS ? (sp.status as ClassStatus) : undefined;
  const classes = await listClasses(actor, { status });

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader title="Lớp học" description="Mở lớp, ghi danh và quản lý buổi học." action={<ButtonLink href="/quan-ly/lop/moi">Mở lớp mới</ButtonLink>} />
      <nav aria-label="Lọc theo trạng thái" className="mb-4 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/quan-ly/lop" active={!status}>
          Tất cả
        </FilterLink>
        {(Object.keys(CLASS_STATUS) as ClassStatus[]).map((s) => (
          <FilterLink key={s} href={`/quan-ly/lop?status=${s}`} active={status === s}>
            {CLASS_STATUS[s].label}
          </FilterLink>
        ))}
      </nav>
      {classes.length === 0 ? (
        <EmptyState message="Chưa có lớp nào." action={<ButtonLink href="/quan-ly/lop/moi">Mở lớp đầu tiên</ButtonLink>} />
      ) : (
        <DataTable
          caption="Danh sách lớp"
          rows={classes}
          rowKey={(c) => c.id}
          columns={[
            {
              header: "Lớp",
              primary: true,
              cell: (c) => (
                <>
                  <Link href={`/quan-ly/lop/${c.id}`} className="font-medium">
                    {c.code}
                  </Link>
                  <span className="block text-sm text-muted">{c.course.title}</span>
                </>
              ),
            },
            { header: "Lịch", cell: (c) => formatSchedule(c.weekdays, c.startTime, c.endTime) },
            { header: "Giáo viên", cell: (c) => c.teacher.fullName },
            { header: "Khai giảng", cell: (c) => formatDate(c.startDate) },
            { header: "Sĩ số", cell: (c) => `${c._count.enrollments}/${c.capacity}` },
            { header: "Trạng thái", cell: (c) => <Badge tone={CLASS_STATUS[c.status].tone}>{CLASS_STATUS[c.status].label}</Badge> },
          ]}
        />
      )}
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 no-underline ${active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-ink"}`}
    >
      {children}
    </Link>
  );
}
