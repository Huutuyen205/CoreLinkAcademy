import type { Course } from "@prisma/client";
import { asStringArray, asSyllabus } from "@/server/catalog/public";
import { GRADE_OPTIONS } from "@/lib/labels";
import type { FieldConfig } from "./config-form";

/** Cấu hình form khóa học dùng cho tạo mới và sửa (FR-015). */
export function courseFields(subjects: { id: string; name: string }[], c?: Course): FieldConfig[] {
  return [
    { type: "select", name: "subjectId", label: "Môn", required: true, placeholder: "Chọn môn", options: subjects.map((s) => ({ value: s.id, label: s.name })), defaultValue: c?.subjectId },
    { type: "text", name: "title", label: "Tên khóa", required: true, maxLength: 160, defaultValue: c?.title },
    { type: "text", name: "slug", label: "Đường dẫn web (slug)", maxLength: 160, hint: "Để trống: tự tạo từ tên khóa (vd. toan-9-on-thi-vao-10).", defaultValue: c?.slug },
    { type: "text", name: "level", label: "Trình độ", required: true, maxLength: 60, defaultValue: c?.level ?? "Cơ bản" },
    { type: "select", name: "gradeFrom", label: "Từ khối", required: true, options: GRADE_OPTIONS, defaultValue: c ? String(c.gradeFrom) : "6" },
    { type: "select", name: "gradeTo", label: "Đến khối", required: true, options: GRADE_OPTIONS, defaultValue: c ? String(c.gradeTo) : "9" },
    { type: "number", name: "totalSessions", label: "Số buổi", required: true, min: "1", max: "500", defaultValue: c ? String(c.totalSessions) : "24" },
    { type: "number", name: "sessionMinutes", label: "Phút mỗi buổi", required: true, min: "15", max: "300", defaultValue: c ? String(c.sessionMinutes) : "90" },
    { type: "text", name: "tuitionVnd", label: "Học phí tham khảo (đồng)", hint: "Để trống = Liên hệ", maxLength: 15, defaultValue: c?.tuitionVnd != null ? String(c.tuitionVnd) : "" },
    { type: "textarea", name: "summary", label: "Tóm tắt", required: true, maxLength: 300, rows: 2, wide: true, defaultValue: c?.summary },
    { type: "textarea", name: "description", label: "Mô tả chi tiết", required: true, maxLength: 10000, rows: 4, wide: true, defaultValue: c?.description },
    { type: "textarea", name: "outcomes", label: "Mục tiêu (mỗi dòng một ý)", maxLength: 5000, rows: 3, wide: true, defaultValue: c ? asStringArray(c.outcomes).join("\n") : "" },
    {
      type: "textarea",
      name: "syllabus",
      label: "Lộ trình (mỗi dòng: Tiêu đề | chi tiết)",
      maxLength: 10000,
      rows: 5,
      wide: true,
      defaultValue: c ? asSyllabus(c.syllabus).map((s) => (s.detail ? `${s.title} | ${s.detail}` : s.title)).join("\n") : "",
    },
    { type: "checkbox", name: "isPublished", label: "Xuất bản trên website", defaultChecked: c?.isPublished ?? false },
    { type: "checkbox", name: "isFeatured", label: "Khóa nổi bật ở trang chủ", defaultChecked: c?.isFeatured ?? false },
  ];
}
