import Link from "next/link";
import type { CourseCardData } from "@/server/catalog/public";
import { formatGradeRange, formatVnd } from "@/lib/format";

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <article className="flex h-full flex-col rounded-block border border-line bg-surface p-5">
      <p className="text-sm font-medium text-accent">
        {course.subject.name} · {formatGradeRange(course.gradeFrom, course.gradeTo)}
      </p>
      <h3 className="mt-2 text-xl">
        <Link href={`/khoa-hoc/${course.slug}`} className="text-ink no-underline hover:text-primary">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-muted">{course.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-muted">Thời lượng</dt>
          <dd>
            {course.totalSessions} buổi × {course.sessionMinutes} phút
          </dd>
        </div>
        <div>
          <dt className="text-muted">Học phí tham khảo</dt>
          <dd>{course.tuitionVnd ? formatVnd(course.tuitionVnd) : "Liên hệ"}</dd>
        </div>
      </dl>
    </article>
  );
}
