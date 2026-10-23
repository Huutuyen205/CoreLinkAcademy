import type { PracticeDifficulty } from "@prisma/client";
import type { FieldConfig } from "@/components/forms/config-form";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";

type Options = { subjects: { id: string; name: string }[]; levels: { id: string; name: string }[]; topics: string[]; formats: string[] };
type Current = { title: string; description: string | null; topic: string; format: string; difficulty: PracticeDifficulty; subjectId: string | null; levelId: string | null };

/** Ô nhập thông tin đề luyện (tạo + sửa). Gợi ý chuyên đề/dạng bài đã dùng để lọc được thống nhất. */
export function practiceSetFields(o: Options, s?: Current): FieldConfig[] {
  const hint = (list: string[], fallback: string) => (list.length ? `Đã dùng: ${list.slice(0, 8).join(", ")}` : fallback);
  return [
    { type: "text", name: "title", label: "Tên đề", required: true, maxLength: 200, wide: true, defaultValue: s?.title },
    { type: "text", name: "topic", label: "Chuyên đề", required: true, maxLength: 100, hint: hint(o.topics, "vd. Hệ phương trình, Thì hiện tại"), defaultValue: s?.topic },
    { type: "text", name: "format", label: "Dạng bài", required: true, maxLength: 60, hint: hint(o.formats, "vd. Trắc nghiệm, Đọc hiểu, Tính toán"), defaultValue: s?.format },
    {
      type: "select",
      name: "difficulty",
      label: "Mức độ",
      required: true,
      options: (Object.keys(PRACTICE_DIFFICULTY) as PracticeDifficulty[]).map((d) => ({ value: d, label: PRACTICE_DIFFICULTY[d].label })),
      defaultValue: s?.difficulty ?? "MEDIUM",
    },
    { type: "select", name: "subjectId", label: "Môn", placeholder: "Không gắn môn", options: o.subjects.map((x) => ({ value: x.id, label: x.name })), defaultValue: s?.subjectId ?? "" },
    { type: "select", name: "levelId", label: "Cấp học", placeholder: "Mọi cấp", options: o.levels.map((x) => ({ value: x.id, label: x.name })), defaultValue: s?.levelId ?? "" },
    { type: "textarea", name: "description", label: "Mô tả / hướng dẫn", maxLength: 3000, rows: 3, wide: true, defaultValue: s?.description ?? "" },
  ];
}
