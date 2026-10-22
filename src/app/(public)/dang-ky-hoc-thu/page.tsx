import type { Metadata } from "next";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { listPublishedCourses, listSubjects } from "@/server/catalog/public";
import { TrialForm } from "./trial-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đăng ký học thử",
  description: "Đăng ký buổi học thử miễn phí tại CoreLink Academy. Giáo vụ sẽ liên hệ tư vấn và xếp lớp phù hợp.",
};

type Props = { searchParams: Promise<{ khoa?: string | string[] }> };

export default async function TrialPage({ searchParams }: Props) {
  const { khoa } = await searchParams;
  const [subjects, courses] = await Promise.all([listSubjects(), listPublishedCourses()]);
  const preset = typeof khoa === "string" ? courses.find((c) => c.slug === khoa) : undefined;

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      {/* Header Banner */}
      <div className="mb-6 rounded-3xl border border-line bg-gradient-to-br from-surface via-paper to-primary-soft/30 p-6 sm:p-8 text-center shadow-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary mb-3">
          <Sparkles className="size-3.5 text-accent" />
          Học thử hoàn toàn miễn phí
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Đăng ký kiểm tra đầu vào &amp; Học thử
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-muted max-w-lg mx-auto">
          Để lại thông tin, đội ngũ chuyên môn của CoreLink Academy sẽ liên hệ tư vấn lộ trình và xếp lịch học thử phù hợp nhất cho con.
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-xl shadow-primary/6">
        <TrialForm
          subjects={subjects.map((s) => ({ value: s.id, label: s.name }))}
          courses={courses.map((c) => ({ value: c.slug, label: c.title, subjectSlug: c.subject.slug }))}
          subjectSlugToId={Object.fromEntries(subjects.map((s) => [s.slug, s.id]))}
          presetCourse={preset?.slug}
          presetSubjectId={preset ? subjects.find((s) => s.slug === preset.subject.slug)?.id : undefined}
        />

        <div className="mt-6 border-t border-line/70 pt-4 flex items-center justify-between text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" />
            Không phát sinh chi phí
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            Bảo mật thông tin 100%
          </span>
        </div>
      </div>
    </div>
  );
}
