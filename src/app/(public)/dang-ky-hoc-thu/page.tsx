import type { Metadata } from "next";
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
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl">Đăng ký học thử</h1>
      <p className="mt-2 text-muted">
        Để lại thông tin, giáo vụ của học viện sẽ gọi lại để tư vấn và hẹn buổi học thử. Các ô có dấu * là bắt buộc.
      </p>
      <div className="mt-6 rounded-block border border-line bg-surface p-5 sm:p-6">
        <TrialForm
          subjects={subjects.map((s) => ({ value: s.id, label: s.name }))}
          courses={courses.map((c) => ({ value: c.slug, label: c.title, subjectSlug: c.subject.slug }))}
          subjectSlugToId={Object.fromEntries(subjects.map((s) => [s.slug, s.id]))}
          presetCourse={preset?.slug}
          presetSubjectId={preset ? subjects.find((s) => s.slug === preset.subject.slug)?.id : undefined}
        />
      </div>
    </div>
  );
}
