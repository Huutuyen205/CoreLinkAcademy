import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Sparkles, X } from "lucide-react";
import { CourseCard } from "@/components/catalog/course-card";
import { Stagger, StaggerItem } from "@/components/home/motion";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/feedback";
import { listPublishedCourses, listSubjects, parseCatalogFilter } from "@/server/catalog/public";
import { GRADE_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/format";
import { SubjectIcon } from "@/components/catalog/subject-icons";

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
    <div className="space-y-6">
      {/* ─── Hero Header ─── */}
      <div className="rounded-3xl border border-line bg-gradient-to-br from-surface via-paper to-primary-soft/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-0.5 text-xs font-bold text-primary">
            <Sparkles className="size-3.5 text-accent" />
            Chương trình đào tạo đa môn
          </span>
          <span className="text-xs text-muted">Lớp nhỏ tối đa 7–12 học sinh</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Danh mục khóa học &amp; lộ trình
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted">
          Tìm kiếm khóa học theo môn hoặc khối lớp để xây dựng lộ trình học tập tối ưu, vững vàng kiến thức phổ thông và bứt phá thi cử.
        </p>

        {/* Quick Subject Pills */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line/60 pt-4">
          <Link
            href="/khoa-hoc"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold no-underline transition-all duration-200",
              !filter.subjectSlug
                ? "bg-primary text-white shadow-xs"
                : "border border-line bg-surface text-ink hover:border-primary/40 hover:bg-paper"
            )}
          >
            <span>Tất cả môn</span>
          </Link>
          {subjects.map((s) => {
            const active = filter.subjectSlug === s.slug;
            return (
              <Link
                key={s.slug}
                href={`/khoa-hoc?mon=${s.slug}${filter.grade ? `&khoi=${filter.grade}` : ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold no-underline transition-all duration-200",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "border border-line bg-surface text-ink hover:border-primary/40 hover:bg-paper"
                )}
              >
                <SubjectIcon slug={s.slug} className="size-3" />
                <span>{s.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Filter Form Bar ─── */}
      <form
        method="get"
        className="grid gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-2xs sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <SelectField
          name="mon"
          label="Môn học"
          placeholder="Tất cả môn"
          defaultValue={filter.subjectSlug ?? ""}
          options={subjects.map((s) => ({ value: s.slug, label: s.name }))}
        />
        <SelectField
          name="khoi"
          label="Khối lớp"
          placeholder="Tất cả khối"
          defaultValue={filter.grade ? String(filter.grade) : ""}
          options={GRADE_OPTIONS}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className={cn(buttonClass("primary", "md", "flex-1 sm:flex-none"), "shadow-sm shadow-primary/20")}
          >
            <Filter className="size-4" />
            <span>Lọc khóa</span>
          </button>
          {filtered && (
            <ButtonLink href="/khoa-hoc" variant="secondary" className="flex items-center gap-1">
              <X className="size-3.5" />
              <span>Bỏ lọc</span>
            </ButtonLink>
          )}
        </div>
      </form>

      {/* ─── Course List ─── */}
      {courses.length === 0 ? (
        <EmptyState
          message={filtered ? "Chưa có khóa học phù hợp với tiêu chí lọc này." : "Học viện đang cập nhật danh mục khóa học."}
          action={<ButtonLink href="/dang-ky-hoc-thu">Để lại thông tin để được tư vấn xếp lớp</ButtonLink>}
        />
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between text-xs text-muted">
            <span aria-live="polite" className="font-semibold text-ink">
              Hiển thị <span className="text-primary font-bold">{courses.length}</span> khóa học
            </span>
            <span>Cam kết tối đa 12 học sinh / lớp</span>
          </div>
          <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <StaggerItem key={c.id} as="li" className="list-none">
                <CourseCard course={c} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
