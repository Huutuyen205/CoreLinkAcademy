import type { Metadata } from "next";
import Link from "next/link";
import { TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { listClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { CLASS_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { foldVietnamese } from "@/lib/search";

export const metadata: Metadata = { title: "Lớp của tôi" };

const SHORTCUTS = [
  { tab: "bai-tap", label: "Giao bài" },
  { tab: "giao-an", label: "Giáo án, tài liệu" },
  { tab: "hoc-sinh", label: "Học sinh" },
] as const;

// Giáo viên §1: xem danh sách, tìm kiếm lớp phụ trách (mã lớp, tên khóa, phòng); phím tắt vào từng mục của lớp.
export default async function TeacherClassesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await requireRole("TEACHER");
  const all = await listClasses(actor);
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().slice(0, 80) : "";
  const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
  const classes = all.filter((c) => terms.every((t) => foldVietnamese(`${c.code} ${c.course.title} ${c.room?.name ?? ""}`).includes(t)));
  return (
    <>
      <PageHeader title="Lớp của tôi" />
      {all.length > 0 && (
        <FilterForm className="mb-6 max-w-md">
          <TextField name="q" label="Tìm lớp" defaultValue={q} maxLength={80} />
        </FilterForm>
      )}
      {classes.length === 0 ? (
        <EmptyState message={q ? "Không có lớp phù hợp." : "Bạn chưa được phân công lớp nào."} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <li key={c.id} className="flex flex-col rounded-block border border-line bg-surface">
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg">
                    <Link href={`/giao-vien/lop/${c.id}`} className="text-ink no-underline hover:text-primary">
                      {c.code}
                    </Link>
                  </h2>
                  <Badge tone={CLASS_STATUS[c.status].tone}>{CLASS_STATUS[c.status].label}</Badge>
                </div>
                <p className="text-muted">{c.course.title}</p>
                <p className="mt-2 text-sm">{formatSchedule(c.weekdays, c.startTime, c.endTime)}</p>
                <p className="text-sm text-muted">
                  {c._count.enrollments} học sinh{c.room ? ` · ${c.room.name}` : ""}
                </p>
              </div>
              <nav aria-label={`Lối tắt lớp ${c.code}`} className="grid grid-cols-3 divide-x divide-line border-t border-line text-center text-sm">
                {SHORTCUTS.map((s) => (
                  <Link key={s.tab} href={`/giao-vien/lop/${c.id}?tab=${s.tab}`} className="flex min-h-11 items-center justify-center px-1 font-medium no-underline hover:bg-primary-soft">
                    {s.label}
                  </Link>
                ))}
              </nav>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
