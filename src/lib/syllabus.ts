// Lộ trình khóa học theo từng buổi (DECISION-D37): mỗi dòng một buổi; buổi N của lớp lấy mục N.
// Dạng nhập: "Tiêu đề | Nội dung | Mục tiêu | Kiến thức trọng tâm | Ví dụ" — chỉ tiêu đề là bắt buộc.

export type SyllabusItem = { title: string; detail: string; objectives?: string; knowledge?: string; examples?: string };

const EXTRA = ["objectives", "knowledge", "examples"] as const;

/** Mỗi dòng không trống là một buổi. */
export function parseSyllabus(text: string): SyllabusItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", detail = "", ...extra] = line.split("|").map((s) => s.trim());
      const item: SyllabusItem = { title, detail };
      EXTRA.forEach((key, i) => {
        if (extra[i]) item[key] = extra[i];
      });
      return item;
    });
}

/** Ngược lại của `parseSyllabus` để đổ vào ô nhập. */
export function formatSyllabus(items: SyllabusItem[]): string {
  return items
    .map((s) => {
      const cells = [s.title, s.detail, s.objectives ?? "", s.knowledge ?? "", s.examples ?? ""];
      while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
      return cells.join(" | ");
    })
    .join("\n");
}

/** Đọc JSON an toàn từ DB: bỏ mục sai dạng, chỉ giữ trường phụ có chữ. */
export function readSyllabus(value: unknown): SyllabusItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): SyllabusItem[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const r = raw as Record<string, unknown>;
    if (typeof r.title !== "string") return [];
    const item: SyllabusItem = { title: r.title, detail: typeof r.detail === "string" ? r.detail : "" };
    for (const key of EXTRA) {
      const v = r[key];
      if (typeof v === "string" && v.trim()) item[key] = v;
    }
    return [item];
  });
}

/** Mục của buổi thứ `index` (từ 1) khi khung có đúng `total` mục; ngược lại null (không đoán). */
export function syllabusForSession(value: unknown, index: number, total: number): SyllabusItem | null {
  const items = readSyllabus(value);
  return items.length === total ? (items[index - 1] ?? null) : null;
}
