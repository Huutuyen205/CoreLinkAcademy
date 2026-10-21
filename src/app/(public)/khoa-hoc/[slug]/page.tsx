import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedCourse } from "@/server/catalog/public";
import { formatGradeRange, formatVnd } from "@/lib/format";
import { parseWeekdays } from "@/lib/schedule";
import { formatDate, WEEKDAY_LABELS } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getPublishedCourse((await params).slug);
  if (!course) return { title: "Không tìm thấy khóa học" };
  return { title: course.title, description: course.summary };
}

// FR-003: khóa chưa xuất bản → 404.
export default async function CourseDetailPage({ params }: Props) {
  const course = await getPublishedCourse((await params).slug);
  if (!course) notFound();

  const facts = [
    { label: "Đối tượng", value: formatGradeRange(course.gradeFrom, course.gradeTo) },
    { label: "Trình độ", value: course.level },
    { label: "Số buổi", value: `${course.totalSessions} buổi × ${course.sessionMinutes} phút` },
    { label: "Học phí tham khảo", value: course.tuitionVnd ? formatVnd(course.tuitionVnd) : "Liên hệ" },
  ];

  return (
    <article className="space-y-10">
      <header className="max-w-3xl">
        <p className="text-sm">
          <Link href="/khoa-hoc">Khóa học</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={`/khoa-hoc?mon=${course.subject.slug}`}>{course.subject.name}</Link>
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{course.title}</h1>
        <p className="mt-4 text-lg text-muted">{course.description}</p>
        <div className="mt-6">
          <ButtonLink href={`/dang-ky-hoc-thu?khoa=${course.slug}`}>Đăng ký học thử khóa này</ButtonLink>
        </div>
      </header>

      <dl className="grid gap-4 rounded-block border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="mt-0.5 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="-mt-6 text-sm text-muted">Học phí chỉ để tham khảo; học viện sẽ tư vấn cụ thể khi xếp lớp.</p>

      <div className="grid gap-10 lg:grid-cols-2">
        {course.outcomes.length > 0 && (
          <section aria-labelledby="muc-tieu">
            <h2 id="muc-tieu" className="text-2xl">
              Mục tiêu sau khóa học
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {course.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
        )}

        {course.syllabus.length > 0 && (
          <section aria-labelledby="lo-trinh">
            <h2 id="lo-trinh" className="text-2xl">
              Lộ trình
            </h2>
            <ol className="mt-4 space-y-4">
              {course.syllabus.map((s, i) => (
                <li key={`${i}-${s.title}`} className="grid grid-cols-[2rem_1fr] gap-2">
                  <span className="font-serif text-xl text-accent">{i + 1}</span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    {s.detail && <p className="text-muted">{s.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <section aria-labelledby="lop-tuyen">
        <h2 id="lop-tuyen" className="text-2xl">
          Lớp đang tuyển
        </h2>
        {course.classes.length === 0 ? (
          <p className="mt-3 text-muted">Hiện chưa có lớp mở. Hãy đăng ký học thử, học viện sẽ báo khi có lớp phù hợp.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {course.classes.map((c) => {
              const left = Math.max(0, c.capacity - c._count.enrollments);
              return (
                <li key={c.id} className="rounded-block border border-line bg-surface p-5">
                  <p className="font-medium">Lớp {c.code}</p>
                  <p className="mt-1 text-muted">
                    {parseWeekdays(c.weekdays)
                      .map((d) => WEEKDAY_LABELS[d])
                      .join(", ")}{" "}
                    · {c.startTime}–{c.endTime}
                  </p>
                  <p className="text-muted">Khai giảng {formatDate(c.startDate)}</p>
                  <p className="mt-2 text-sm">{left > 0 ? `Còn ${left} chỗ` : "Đã đủ học sinh"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
