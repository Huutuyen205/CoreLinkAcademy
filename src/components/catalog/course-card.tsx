import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { CourseCardData } from "@/server/catalog/public";
import { formatGradeRange, formatVnd } from "@/lib/format";
import { SubjectIcon } from "./subject-icons";

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-2xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8">
      {/* Top subtle highlight bar on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-bold text-primary">
            <SubjectIcon slug={course.subject.slug} className="size-3.5" />
            {course.subject.name}
          </span>
          <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-semibold text-muted">
            {formatGradeRange(course.gradeFrom, course.gradeTo)}
          </span>
        </div>

        <h3 className="mt-3.5 text-lg font-bold text-ink sm:text-xl">
          <Link
            href={`/khoa-hoc/${course.slug}`}
            className="text-ink no-underline transition-colors group-hover:text-primary flex items-center justify-between"
          >
            <span>{course.title}</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 text-primary opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </Link>
        </h3>

        <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3">{course.summary}</p>
      </div>

      <div className="mt-5 border-t border-line/70 pt-4">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-paper p-2.5">
            <dt className="flex items-center gap-1 text-muted text-[11px] font-medium uppercase tracking-wider">
              <Clock className="size-3" />
              Thời lượng
            </dt>
            <dd className="mt-0.5 font-bold text-ink">
              {course.totalSessions} buổi × {course.sessionMinutes}&apos;
            </dd>
          </div>
          <div className="rounded-xl bg-primary-soft/60 p-2.5">
            <dt className="flex items-center gap-1 text-primary text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="size-3 text-accent" />
              Học phí
            </dt>
            <dd className="mt-0.5 font-extrabold text-primary text-sm sm:text-base">
              {course.tuitionVnd ? formatVnd(course.tuitionVnd) : "Liên hệ"}
            </dd>
          </div>
        </dl>

        <div className="mt-3.5 flex items-center justify-between">
          <Link
            href={`/khoa-hoc/${course.slug}`}
            className="text-xs font-bold text-primary group-hover:text-accent transition-colors flex items-center gap-1"
          >
            <span>Xem chi tiết lộ trình</span>
            <span>→</span>
          </Link>
          <Link
            href="/dang-ky-hoc-thu"
            className="rounded-full bg-primary/10 hover:bg-primary hover:text-white px-3 py-1 text-xs font-semibold text-primary transition-all duration-200"
          >
            Học thử
          </Link>
        </div>
      </div>
    </article>
  );
}
