// Đọc JSON từ phản hồi AI (có thể bọc trong ```json … ```, hoặc kèm vài chữ thừa). Hàm thuần để unit test.

export function extractJson(raw: string): unknown {
  let text = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  if (fenced) text = fenced[1]!.trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start < 0 || end <= start) throw new Error("Phản hồi không phải JSON.");
    return JSON.parse(text.slice(start, end + 1));
  }
}
