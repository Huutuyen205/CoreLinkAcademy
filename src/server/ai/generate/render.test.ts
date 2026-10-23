import { describe, expect, it } from "vitest";
import { extractJson } from "../json";
import { mockProvider } from "../providers/mock";
import { normalizeContent } from "./exam";
import { render, DOCX_MIME, PPTX_MIME } from "./render";
import { GENERATE_KINDS } from "./schemas";

const meta = { classCode: "TOAN9-K1", courseTitle: "Toán 9", subjectName: "Toán", sessionIndex: 3, dateLabel: "02/11/2026" };

describe("khuôn mẫu Word/PowerPoint", () => {
  for (const kind of GENERATE_KINDS) {
    it(`${kind} → tệp hợp lệ (zip Office)`, async () => {
      const { text } = await mockProvider().complete({ task: kind, system: "", user: "", mock: { kind, group: "math", topic: "Phương trình bậc hai", courseTitle: "Toán 9", sessionIndex: 3, count: 5 } });
      const out = await render(normalizeContent(kind, extractJson(text)), meta);
      expect(out.mimeType).toBe(kind === "slides" ? PPTX_MIME : DOCX_MIME);
      expect(out.ext).toBe(kind === "slides" ? "pptx" : "docx");
      expect(out.data.byteLength).toBeGreaterThan(2_000);
      expect(out.data.byteLength).toBeLessThan(4 * 1024 * 1024); // giới hạn tệp 4 MB (D24)
      // Mọi tệp .docx/.pptx là zip: bắt đầu bằng "PK".
      expect(String.fromCharCode(out.data[0]!, out.data[1]!)).toBe("PK");
    });
  }
});
