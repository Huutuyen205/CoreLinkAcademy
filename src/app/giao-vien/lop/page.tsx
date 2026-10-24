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

// Giáo viên §1: xem danh sách, tìm kiếm lớp phụ trách (mã lớp, tên khóa, phòng); bấm vào lớp để vào chi tiết lớp.
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
            <li key={c.id}>
              <Link href={`/giao-vien/lop/${c.id}`} className="card-interactive block h-full rounded-block border border-line bg-surface p-5 text-ink no-underline">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg text-primary">{c.code}</h2>
                  <Badge tone={CLASS_STATUS[c.status].tone}>{CLASS_STATUS[c.status].label}</Badge>
                </div>
                <p className="text-muted">{c.course.title}</p>
                <p className="mt-2 text-sm">{formatSchedule(c.weekdays, c.startTime, c.endTime)}</p>
                <p className="text-sm text-muted">
                  {c._count.enrollments} học sinh{c.room ? ` · ${c.room.name}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
