import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Alert, Card, PageHeader } from "@/components/ui/feedback";
import { createClassAction } from "@/server/academic/actions";
import { classFormOptions } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { vnDateKey, WEEKDAY_LABELS } from "@/lib/time";

export const metadata: Metadata = { title: "Mở lớp mới" };

// UC-005 — FR-017, FR-018.
export default async function NewClassPage() {
  const actor = await requireRole("ADMIN", "STAFF");
  const { courses, teachers, rooms } = await classFormOptions(actor);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/lop">← Danh sách lớp</Link>
      </p>
      <PageHeader title="Mở lớp mới" description="Hệ thống sinh đủ số buổi theo các thứ đã chọn và kiểm tra trùng lịch giáo viên, phòng." />
      {courses.length === 0 || teachers.length === 0 ? (
        <Alert tone="warning">Cần có ít nhất một khóa học và một giáo viên đang hoạt động trước khi mở lớp.</Alert>
      ) : (
        <Card>
          <ConfigForm
            action={createClassAction}
            submitLabel="Mở lớp"
            columns={2}
            fields={[
              { type: "select", name: "courseId", label: "Khóa học", required: true, placeholder: "Chọn khóa", wide: true, options: courses.map((c) => ({ value: c.id, label: `${c.title} (${c.totalSessions} buổi)` })) },
              { type: "text", name: "code", label: "Mã lớp", required: true, maxLength: 30, hint: "Ví dụ: TOAN9-K1" },
              { type: "select", name: "teacherId", label: "Giáo viên", required: true, placeholder: "Chọn giáo viên", options: teachers.map((t) => ({ value: t.id, label: t.fullName })) },
              { type: "select", name: "roomId", label: "Phòng", placeholder: "Chưa xếp phòng", options: rooms.map((r) => ({ value: r.id, label: `${r.name} (${r.capacity} chỗ)` })) },
              { type: "date", name: "startDate", label: "Ngày bắt đầu", required: true, defaultValue: vnDateKey(new Date()) },
              { type: "checkboxes", name: "weekdays", label: "Các thứ trong tuần", required: true, wide: true, options: Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({ value, label })) },
              { type: "time", name: "startTime", label: "Giờ bắt đầu", required: true, defaultValue: "18:00" },
              { type: "time", name: "endTime", label: "Giờ kết thúc", required: true, defaultValue: "19:30" },
              { type: "number", name: "totalSessions", label: "Số buổi", required: true, min: "1", max: "200" },
              { type: "number", name: "capacity", label: "Sĩ số tối đa", required: true, min: "1", max: "100", defaultValue: "16" },
            ]}
          />
        </Card>
      )}
    </>
  );
}
