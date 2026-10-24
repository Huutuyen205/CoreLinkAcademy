// Trích văn bản từ tệp tài liệu và cắt thành đoạn nhỏ để AI chỉ lấy vài đoạn liên quan (DECISION-D37). Không truy cập DB.
import { foldVietnamese } from "@/lib/search";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const CHUNK_TARGET = 800;
export const CHUNK_MAX = 1100;
/** Giới hạn mỗi tệp để một giáo trình dài không làm phình DB. */
export const MAX_CHUNKS_PER_FILE = 80;
export const MAX_TEXT_PER_FILE = 70_000;

/** Văn bản thô của tệp; rỗng nếu loại tệp chưa hỗ trợ (ảnh, bản scan, doc/xls/ppt cũ). Không ném lỗi. */
export async function extractText(file: { mimeType: string; data: Uint8Array }): Promise<string> {
  try {
    if (file.mimeType === "text/plain") return new TextDecoder("utf-8").decode(file.data);
    if (file.mimeType === DOCX) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file.data) });
      return value;
    }
    if (file.mimeType === "application/pdf") {
      const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(file.data));
      const { text } = await pdfText(pdf, { mergePages: true });
      return text;
    }
  } catch (error) {
    console.error("[documents] không trích được văn bản:", error instanceof Error ? error.message : error);
  }
  return "";
}

/** Cắt theo đoạn văn (dòng trống), gom tới ~800 ký tự mỗi đoạn; đoạn quá dài thì cắt theo câu. */
export function chunkText(raw: string): string[] {
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_PER_FILE);
  if (!text) return [];

  const pieces: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const p = para.replace(/\s*\n\s*/g, " ").trim();
    if (!p) continue;
    if (p.length <= CHUNK_MAX) {
      pieces.push(p);
      continue;
    }
    let cur = "";
    for (const sentence of p.split(/(?<=[.!?…])\s+/)) {
      if (cur && cur.length + sentence.length + 1 > CHUNK_TARGET) {
        pieces.push(cur);
        cur = "";
      }
      // Câu đơn dài bất thường: cắt cứng.
      for (let s = sentence; s; s = s.slice(CHUNK_MAX)) {
        if (s.length <= CHUNK_MAX) {
          cur = cur ? `${cur} ${s}` : s;
          break;
        }
        pieces.push(s.slice(0, CHUNK_MAX));
      }
    }
    if (cur) pieces.push(cur);
  }

  const chunks: string[] = [];
  let cur = "";
  for (const p of pieces) {
    if (cur && cur.length + p.length + 1 > CHUNK_TARGET) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n${p}` : p;
  }
  if (cur) chunks.push(cur);
  return chunks.slice(0, MAX_CHUNKS_PER_FILE);
}

/** Chữ không dấu, chữ thường — dạng lưu để tìm kiếm không phân biệt dấu. */
export const searchForm = (text: string) => foldVietnamese(text).replace(/\s+/g, " ");

/** Câu truy vấn `to_tsquery('simple', …)` dạng OR từ các từ khóa (bỏ từ quá ngắn, trùng, ký tự lạ). */
export function buildTsQuery(query: string, maxTerms = 14): string | null {
  const terms = [...new Set(searchForm(query).split(/[^a-z0-9]+/).filter((t) => t.length >= 2))].slice(0, maxTerms);
  return terms.length > 0 ? terms.join(" | ") : null;
}
