/** Chuẩn hóa để tìm kiếm không phân biệt dấu/hoa thường: "Nguyễn Văn Đức" → "nguyen van duc". */
export function foldVietnamese(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Slug đường dẫn từ tên tiếng Việt: "Toán 9 – Ôn thi vào 10" → "toan-9-on-thi-vao-10". */
export function slugify(text: string, max = 80): string {
  return foldVietnamese(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}
