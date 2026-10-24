export const CLASS_TABS = [
  { key: "chi-tiet", label: "Chi tiết" },
  { key: "giao-an", label: "Giáo án và tài liệu" },
  { key: "bai-tap", label: "Bài tập và đề" },
  { key: "hoc-sinh", label: "Học sinh" },
] as const;

export type ClassTab = (typeof CLASS_TABS)[number]["key"];

/** Nhận cả liên kết cũ `tab=tai-lieu` (đã gộp vào Giáo án và tài liệu). */
export function parseTab(value: string | undefined): ClassTab {
  if (value === "tai-lieu") return "giao-an";
  return CLASS_TABS.find((t) => t.key === value)?.key ?? "chi-tiet";
}
