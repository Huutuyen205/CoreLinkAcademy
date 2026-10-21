import type { Metadata } from "next";
import { CourseCard } from "@/components/catalog/course-card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { listPublishedCourses, listSubjects, parseCatalogFilter } from "@/server/catalog/public";
import { GRADE_OPTIONS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khóa học",
  description: "Danh mục khóa học Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học theo khối lớp tại CoreLink Academy.",
};

type Props = { searchParams: Promise<{ mon?: string | string[]; khoi?: string | string[] }> };

// FR-002: lọc bằng form GET để dùng được không cần JavaScript.
export default async function CatalogPage({ searchParams }: Props) {
  const filter = parseCatalogFilter(await searchParams);
  const [subjects, courses] = await Promise.all([listSubjects(), listPublishedCourses(filter)]);
  const filtered = Boolean(filter.subjectSlug || filter.grade);

  return (
    <>
      <PageHeader title="Khóa học" description="Chọn môn và khối lớp để xem các khóa phù hợp." />
      <form method="get" className="mb-8 grid gap-4 rounded-block border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <SelectField
          name="mon"
          label="Môn học"
          placeholder="Tất cả môn"
          defaultValue={filter.subjectSlug ?? ""}
          options={subjects.map((s) => ({ value: s.slug, label: s.name }))}
        />
        <SelectField name="khoi" label="Khối lớp" placeholder="Tất cả khối" defaultValue={filter.grade ? String(filter.grade) : ""} options={GRADE_OPTIONS} />
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("primary", "md", "flex-1 sm:flex-none")}>
            Lọc
          </button>
          {filtered && (
            <ButtonLink href="/khoa-hoc" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </form>

      {courses.length === 0 ? (
        <EmptyState
          message={filtered ? "Chưa có khóa học phù hợp với lựa chọn này." : "Học viện đang cập nhật danh mục khóa học."}
          action={<ButtonLink href="/dang-ky-hoc-thu">Để lại thông tin để được tư vấn</ButtonLink>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted" aria-live="polite">
            {courses.length} khóa học
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
