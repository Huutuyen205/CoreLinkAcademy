import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { listPublishedCourses, listSubjects } from "@/server/catalog/public";
import { ManualLeadForm } from "./manual-lead-form";

export const metadata: Metadata = { title: "Nhập lead" };

// UC-020 — FR-006: khách gọi điện, đến trực tiếp hoặc được giới thiệu.
export default async function NewLeadPage() {
  await requireRole("ADMIN");
  const [subjects, courses] = await Promise.all([listSubjects(), listPublishedCourses()]);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/lead">← Danh sách lead</Link>
      </p>
      <PageHeader title="Nhập lead" description="Khách gọi điện, đến trực tiếp hoặc được giới thiệu. Hãy xác nhận khách đồng ý để học viện liên hệ." />
      <Card className="max-w-3xl">
        <ManualLeadForm subjects={subjects.map((s) => ({ value: s.id, label: s.name }))} courses={courses.map((c) => ({ value: c.slug, label: c.title }))} />
      </Card>
    </>
  );
}
