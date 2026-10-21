import Link from "next/link";
import { CourseCard } from "@/components/catalog/course-card";
import { ButtonLink } from "@/components/ui/button";
import { listFeaturedCourses, listSubjectsWithCourses } from "@/server/catalog/public";

export const dynamic = "force-dynamic";

const steps = [
  { title: "Đăng ký học thử", detail: "Để lại thông tin trong khoảng hai phút, không cần tạo tài khoản." },
  { title: "Tư vấn và xếp lớp", detail: "Giáo vụ gọi lại, hỏi mục tiêu của con và hẹn buổi học thử phù hợp." },
  { title: "Theo dõi việc học", detail: "Phụ huynh xem lịch, chuyên cần và điểm của con trên cổng phụ huynh." },
];

// FR-001: chỉ hiển thị môn/khóa đã xuất bản.
export default async function HomePage() {
  const [subjects, featured] = await Promise.all([listSubjectsWithCourses(), listFeaturedCourses(3)]);

  return (
    <div className="space-y-16">
      <section className="max-w-2xl pt-2 sm:pt-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">Học viện đào tạo phổ thông</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Học vững từng môn, tiến bộ từng buổi</h1>
        <p className="mt-4 text-lg text-muted">
          CoreLink Academy dạy Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học và Tin học cho học sinh phổ thông, với lớp nhỏ, lộ trình rõ ràng
          và giáo viên theo sát từng em.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/dang-ky-hoc-thu">Đăng ký học thử</ButtonLink>
          <ButtonLink href="/khoa-hoc" variant="secondary">
            Xem khóa học
          </ButtonLink>
        </div>
      </section>

      {subjects.length > 0 && (
        <section aria-labelledby="mon-hoc">
          <h2 id="mon-hoc" className="text-2xl">
            Các môn đang giảng dạy
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <li key={s.id} className="rounded-block border border-line bg-surface p-5">
                <h3 className="text-lg">
                  <Link href={`/khoa-hoc?mon=${s.slug}`} className="text-ink no-underline hover:text-primary">
                    {s.name}
                  </Link>
                </h3>
                <p className="mt-1 text-muted">{s.description}</p>
                <p className="mt-3 text-sm text-primary">{s._count.courses} khóa học</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="khoa-noi-bat">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="khoa-noi-bat" className="text-2xl">
              Khóa học nổi bật
            </h2>
            <Link href="/khoa-hoc">Tất cả khóa học</Link>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {featured.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="quy-trinh" className="border-t border-line pt-10">
        <h2 id="quy-trinh" className="text-2xl">
          Bắt đầu như thế nào
        </h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <p className="font-serif text-3xl text-accent">{i + 1}</p>
              <h3 className="mt-1 text-lg">{s.title}</h3>
              <p className="mt-1 text-muted">{s.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <ButtonLink href="/dang-ky-hoc-thu">Đăng ký học thử miễn phí</ButtonLink>
        </div>
      </section>
    </div>
  );
}
