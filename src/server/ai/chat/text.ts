// Chuẩn hóa tiếng Việt để so khớp câu hỏi: bỏ dấu, chữ thường, chỉ giữ chữ-số. Hàm thuần.

/** "Hôm nay, con tôi ĐÃ đến lớp chưa?" → "hom nay con toi da den lop chua" */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Dạng liền không khoảng trắng (khớp mã lớp "TOAN9-K1" với "toan9 k1"). */
export function compactText(input: string): string {
  return normalizeText(input).replace(/ /g, "");
}

/** `phrase` (đã chuẩn hóa) xuất hiện như cụm từ nguyên vẹn trong `text` (đã chuẩn hóa). */
export function hasPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}
