import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { CLASS_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";

export const metadata: Metadata = { title: "Lớp của tôi" };

export default async function TeacherClassesPage() {
  const actor = await requireRole("TEACHER");
  const classes = await listClasses(actor);
  return (
    <>
      <PageHeader title="Lớp của tôi" />
      {classes.length === 0 ? (
        <EmptyState message="Bạn chưa được phân công lớp nào." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <li key={c.id} className="rounded-block border border-line bg-surface p-5">
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
