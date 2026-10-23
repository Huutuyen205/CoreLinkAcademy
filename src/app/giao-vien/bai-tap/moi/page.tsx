import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { getClassForTeacher, listClasses } from "@/server/academic/service";
import { createAssignmentAction } from "@/server/assessment/actions";
import { requireRole } from "@/server/auth/guard";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { orNotFound } from "@/server/page";
import { formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Tạo bài tập" };

// UC-008 — FR-027: bài mới ở trạng thái nháp.
export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<{ lop?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { lop } = await searchParams;
  if (lop === undefined) return <PickClass />;
  if (typeof lop !== "string" || lop.length > 40) notFound();
  const klass = await orNotFound(getClassForTeacher(actor, lop));
  if (!klass.isOwner) notFound();
  const due = new Date(Date.now() + 7 * 24 * 3_600_000);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/lop/${klass.id}`}>← Lớp {klass.code}</Link>
      </p>
      <PageHeader title="Tạo bài tập" description={`Lớp ${klass.code} · ${klass.course.title}. Bài được lưu nháp; thêm câu hỏi (hoặc bật nhận bài nộp dạng tệp/ảnh) rồi mới giao cho lớp.`} />
      <Card>
        <ConfigForm
          action={createAssignmentAction}
          hidden={{ classId: klass.id }}
          submitLabel="Tạo bài (nháp)"
          fields={[
            { type: "text", name: "title", label: "Tên bài", required: true, maxLength: 200 },
            { type: "textarea", name: "instructions", label: "Hướng dẫn", maxLength: 5000, rows: 3 },
            { type: "datetime-local", name: "dueAt", label: "Hạn nộp (giờ Việt Nam)", required: true, defaultValue: `${formatVn(due, "yyyy-MM-dd")}T21:00` },
            { type: "checkbox", name: "isTest", label: "Đây là bài kiểm tra / mock test (học sinh và phụ huynh nhận thông báo \"Lịch kiểm tra\")" },
            { type: "checkbox", name: "allowLate", label: "Cho phép nộp muộn (bài nộp sau hạn được đánh dấu muộn)" },
            { type: "checkbox", name: "acceptsFiles", label: "Nhận bài nộp dạng tệp/ảnh (học sinh chụp bài làm trên giấy hoặc nộp PDF/Word)" },
            {
              type: "number",
              name: "manualMaxScore",
              label: "Điểm tối đa khi bài không có câu hỏi",
              hint: "Chỉ dùng cho bài chỉ nộp tệp; để trống = thang 10. Bài có câu hỏi tính theo tổng điểm câu.",
              min: "1",
              max: "100",
              step: "0.25",
            },
            { type: "file", name: "files", label: "Tệp đề bài / tài liệu kèm theo (tùy chọn)", hint: ACCEPT_LABEL, accept: ACCEPT_ATTRIBUTE, multiple: true },
            {
              type: "textarea",
              name: "solution",
              label: "Bài chữa / lời giải (tùy chọn)",
              hint: "Học sinh và phụ huynh chỉ xem được sau khi bạn công bố kết quả.",
              maxLength: 20000,
              rows: 4,
            },
          ]}
        />
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
        <Link href="/giao-vien/bai-tap">← Bài tập</Link>
      </p>
      <PageHeader title="Tạo bài tập" description="Chọn lớp sẽ giao bài." />
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
