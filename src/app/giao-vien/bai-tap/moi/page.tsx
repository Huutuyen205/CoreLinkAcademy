import type { PracticeDifficulty } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { composeHrefFor } from "@/lib/ai-compose";
import { getClassForTeacher, listClasses } from "@/server/academic/service";
import { createAssignmentAction } from "@/server/assessment/actions";
import { requireRole } from "@/server/auth/guard";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { orNotFound } from "@/server/page";
import { createSupplementalSetAction } from "@/server/practice/actions";
import { cn } from "@/lib/format";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";
import { formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Tạo bài tập, đề" };

/** Ba loại dùng chung một form soạn: loại quyết định phần giao (DECISION-D38). */
const KINDS = [
  { key: "btvn", label: "Bài tập về nhà" },
  { key: "kiem-tra", label: "Đề thi, kiểm tra" },
  { key: "bo-sung", label: "Bài bổ sung cá nhân" },
] as const;
type Kind = (typeof KINDS)[number]["key"];
/** Mỗi loại có form soạn bằng AI tương ứng (`/giao-vien/soan-bai/<slug>`). */
const AI_SLUG: Record<Kind, string> = { btvn: "bai-tap", "kiem-tra": "trac-nghiem", "bo-sung": "bo-sung" };

const DIFFICULTIES = (Object.keys(PRACTICE_DIFFICULTY) as PracticeDifficulty[]).map((d) => ({ value: d, label: PRACTICE_DIFFICULTY[d].label }));

// UC-008 — FR-027: bài mới ở trạng thái nháp. Bài bổ sung = đề luyện tập chỉ giao cho một học sinh (FR-060).
export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<{ lop?: string; loai?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { lop, loai } = await searchParams;
  if (lop === undefined) return <PickClass />;
  if (typeof lop !== "string" || lop.length > 40) notFound();
  const klass = await orNotFound(getClassForTeacher(actor, lop));
  if (!klass.isOwner) notFound();
  const kind: Kind = KINDS.find((k) => k.key === loai)?.key ?? "btvn";
  const due = new Date(Date.now() + 7 * 24 * 3_600_000);
  const students = klass.enrollments.filter((e) => e.status === "ACTIVE");

  const common: FieldConfig[] = [
    { type: "text", name: "title", label: "Tên bài", required: true, maxLength: 200, wide: true },
    { type: "textarea", name: "instructions", label: "Hướng dẫn", maxLength: 5000, rows: 3, wide: true },
    { type: "datetime-local", name: "dueAt", label: "Hạn nộp (giờ Việt Nam)", required: true, defaultValue: `${formatVn(due, "yyyy-MM-dd")}T21:00` },
    { type: "checkbox", name: "allowLate", label: "Cho phép nộp muộn" },
    { type: "checkbox", name: "acceptsFiles", label: "Nhận bài nộp dạng tệp/ảnh" },
    { type: "number", name: "manualMaxScore", label: "Điểm tối đa khi bài không có câu hỏi", min: "1", max: "100", step: "0.25" },
    { type: "file", name: "files", label: "Tệp đề bài kèm theo", hint: ACCEPT_LABEL, accept: ACCEPT_ATTRIBUTE, multiple: true, camera: true, wide: true },
    { type: "textarea", name: "solution", label: "Bài chữa / lời giải", maxLength: 20000, rows: 4, wide: true },
  ];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/lop/${klass.id}?tab=bai-tap`}>← Lớp {klass.code}</Link>
      </p>
      <PageHeader
        title="Tạo bài tập, đề"
        description={`Lớp ${klass.code}`}
        action={
          <ButtonLink href={composeHrefFor(AI_SLUG[kind], { lop: klass.id })} variant="secondary" size="sm">
            Tạo bằng AI
          </ButtonLink>
        }
      />
      <nav aria-label="Loại bài" className="mb-4 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Link
            key={k.key}
            href={`/giao-vien/bai-tap/moi?lop=${klass.id}&loai=${k.key}`}
            aria-current={k.key === kind ? "page" : undefined}
            className={cn("inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline", k.key === kind ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink")}
          >
            {k.label}
          </Link>
        ))}
      </nav>
      <Card>
        {kind === "bo-sung" ? (
          students.length === 0 ? (
            <EmptyState message="Lớp chưa có học sinh đang học." />
          ) : (
            <ConfigForm
              action={createSupplementalSetAction}
              hidden={{ classId: klass.id, subjectId: klass.course.subjectId }}
              submitLabel="Tạo bài (nháp)"
              columns={2}
              fields={[
                { type: "combobox", name: "studentId", label: "Học sinh nhận bài", required: true, placeholder: "Gõ tên học sinh để tìm…", wide: true, options: students.map((e) => ({ value: e.student.id, label: `${e.student.fullName}${e.student.studentCode ? ` (${e.student.studentCode})` : ""}` })) },
                { type: "text", name: "title", label: "Tên bài", required: true, maxLength: 200, wide: true },
                { type: "textarea", name: "description", label: "Hướng dẫn", maxLength: 3000, rows: 3, wide: true },
                { type: "text", name: "topic", label: "Chuyên đề", maxLength: 100, hint: "Bỏ trống: lấy theo tên bài." },
                { type: "text", name: "format", label: "Dạng bài", required: true, maxLength: 60, defaultValue: "Trắc nghiệm" },
                { type: "select", name: "difficulty", label: "Mức độ", required: true, options: DIFFICULTIES, defaultValue: "MEDIUM" },
              ]}
            />
          )
        ) : (
          <ConfigForm
            action={createAssignmentAction}
            hidden={{ classId: klass.id, ...(kind === "kiem-tra" ? { isTest: "on" } : {}) }}
            submitLabel={kind === "kiem-tra" ? "Tạo đề thi (nháp)" : "Tạo bài (nháp)"}
            columns={2}
            fields={common}
          />
        )}
      </Card>
    </>
  );
}

/** Mở từ danh sách bài tập (chưa chọn lớp): chọn lớp đang dạy. */
async function PickClass() {
  const actor = await requireRole("TEACHER");
  const classes = (await listClasses(actor)).filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/giao-vien/lop">← Lớp của tôi</Link>
      </p>
      <PageHeader title="Chọn lớp" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {classes.map((c) => (
          <li key={c.id}>
            <Link href={`/giao-vien/bai-tap/moi?lop=${c.id}`} className="card-interactive block rounded-block border border-line bg-surface p-4 no-underline">
              <span className="font-semibold text-primary">{c.code}</span>
              <span className="block text-sm text-muted">{c.course.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
