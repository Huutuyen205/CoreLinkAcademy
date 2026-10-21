import Link from "next/link";
import type { CourseCardData } from "@/server/catalog/public";
import { formatGradeRange, formatVnd } from "@/lib/format";

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <article className="card-interactive group flex h-full flex-col rounded-block border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="rounded-[6px] bg-brand-tint px-2.5 py-0.5 font-semibold text-primary">
          {course.subject.name}
        </span>
        <span className="rounded-[6px] bg-paper px-2 py-0.5 font-medium text-muted">
          {formatGradeRange(course.gradeFrom, course.gradeTo)}
        </span>
      </div>
      <h3 className="mt-3 text-xl">
        <Link
          href={`/khoa-hoc/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-ink no-underline transition-colors group-hover:text-primary"
        >
          <span>{course.title}</span>
          <span aria-hidden="true" className="text-sm transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-muted leading-relaxed line-clamp-3">{course.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line/80 pt-3 text-sm">
        <div>
          <dt className="text-muted text-xs">Thời lượng</dt>
          <dd className="font-medium text-ink">
            {course.totalSessions} buổi × {course.sessionMinutes}&apos;
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs">Học phí tham khảo</dt>
          <dd className="font-semibold text-primary">
            {course.tuitionVnd ? formatVnd(course.tuitionVnd) : "Liên hệ"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
