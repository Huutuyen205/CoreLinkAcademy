import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { getClassForTeacher } from "@/server/academic/service";
import { createAssignmentAction } from "@/server/assessment/actions";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Tạo bài tập" };

// UC-008 — FR-027: bài mới ở trạng thái nháp.
export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<{ lop?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { lop } = await searchParams;
  if (typeof lop !== "string" || lop.length > 40) notFound();
  const klass = await orNotFound(getClassForTeacher(actor, lop));
  if (!klass.isOwner) notFound();
  const due = new Date(Date.now() + 7 * 24 * 3_600_000);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/lop/${klass.id}`}>← Lớp {klass.code}</Link>
      </p>
      <PageHeader title="Tạo bài tập" description={`Lớp ${klass.code} · ${klass.course.title}. Bài được lưu nháp; thêm câu hỏi rồi mới giao cho lớp.`} />
      <Card>
        <ConfigForm
          action={createAssignmentAction}
          hidden={{ classId: klass.id }}
          submitLabel="Tạo bài (nháp)"
          fields={[
            { type: "text", name: "title", label: "Tên bài", required: true, maxLength: 200 },
            { type: "textarea", name: "instructions", label: "Hướng dẫn", maxLength: 5000, rows: 3 },
            { type: "datetime-local", name: "dueAt", label: "Hạn nộp (giờ Việt Nam)", required: true, defaultValue: `${formatVn(due, "yyyy-MM-dd")}T21:00` },
            { type: "checkbox", name: "allowLate", label: "Cho phép nộp muộn (bài nộp sau hạn được đánh dấu muộn)" },
          ]}
        />
      </Card>
    </>
  );
}
