// Tìm người (con, giáo viên) và lớp được nhắc trong câu hỏi. Hàm thuần: chỉ so khớp với danh sách ĐÃ được lọc theo phạm vi.
import { compactText, hasPhrase, normalizeText } from "./text";

/** Chữ thường, giữ dấu, chỉ giữ chữ-số (so khớp CÓ dấu cho tên gọi ngắn). */
const lowerKeepAccents = (s: string) => s.normalize("NFC").toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Người được nhắc tên: khớp đầy đủ họ tên, hoặc riêng tên gọi (từ cuối của họ tên).
 * Tên gọi 2 ký tự (vd. "An") phải khớp CÓ dấu để "ăn" không bị nhầm với "An"; tên ≥ 3 ký tự khớp không phân biệt dấu.
 * Nhiều người cùng khớp → trả hết (để hỏi lại), không đoán.
 */
export function matchPeople<T extends { fullName: string }>(people: T[], ...texts: (string | null | undefined)[]): T[] {
  const raw = texts.filter((t): t is string => Boolean(t));
  if (raw.length === 0) return [];
  const plain = raw.map(normalizeText);
  const accented = raw.map(lowerKeepAccents);
  const full = people.filter((p) => plain.some((h) => hasPhrase(h, normalizeText(p.fullName))));
  if (full.length > 0) return full;
  return people.filter((p) => {
    const given = lowerKeepAccents(p.fullName).split(" ").pop() ?? "";
    const givenPlain = normalizeText(given);
    if (givenPlain.length >= 3) return plain.some((h) => hasPhrase(h, givenPlain));
    return givenPlain.length >= 2 && accented.some((h) => hasPhrase(h, given));
  });
}

/** Lớp có mã nằm trong câu hỏi (so khớp bỏ dấu/khoảng trắng/gạch nối); nhiều lớp khớp → lớp có mã dài nhất. */
export function matchClassCode<T extends { code: string }>(classes: T[], ...texts: (string | null | undefined)[]): T | null {
  const haystacks = texts.filter((t): t is string => Boolean(t)).map(compactText);
  let best: T | null = null;
  for (const c of classes) {
    const code = compactText(c.code);
    if (code.length < 3) continue;
    if (haystacks.some((h) => h.includes(code)) && (!best || code.length > compactText(best.code).length)) best = c;
  }
  return best;
}
