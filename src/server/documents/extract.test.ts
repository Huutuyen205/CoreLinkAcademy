import { Document, Packer, Paragraph } from "docx";
import { describe, expect, it } from "vitest";
import { buildTsQuery, CHUNK_MAX, chunkText, extractText, MAX_CHUNKS_PER_FILE, searchForm } from "./extract";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("cắt đoạn văn bản", () => {
  it("rỗng → không có đoạn", () => {
    expect(chunkText("   \n\n ")).toEqual([]);
  });

  it("gom đoạn văn ngắn, không đoạn nào vượt giới hạn", () => {
    const text = Array.from({ length: 40 }, (_, i) => `Đoạn ${i + 1}: ${"nội dung ".repeat(30)}`).join("\n\n");
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(CHUNK_MAX + 400);
    expect(chunks.join(" ")).toContain("Đoạn 40");
  });

  it("một đoạn rất dài không có dấu câu vẫn bị cắt nhỏ; tổng số đoạn có trần", () => {
    const chunks = chunkText("a".repeat(9000));
    expect(chunks.every((c) => c.length <= CHUNK_MAX + 400)).toBe(true);
    expect(chunkText(Array.from({ length: 500 }, () => "x".repeat(700)).join("\n\n")).length).toBeLessThanOrEqual(MAX_CHUNKS_PER_FILE);
  });
});

describe("truy vấn tìm kiếm", () => {
  it("không dấu, chữ thường, bỏ từ ngắn/trùng, nối bằng OR", () => {
    expect(buildTsQuery("Phương trình bậc hai — phương trình x²")).toBe("phuong | trinh | bac | hai");
    expect(buildTsQuery("Đ ?! 'drop; --")).toBe("drop");
    expect(buildTsQuery("! ? .")).toBeNull();
    expect(searchForm("Đường Ơ Ư")).toBe("duong o u");
  });
});

describe("trích văn bản từ tệp", () => {
  it("txt", async () => {
    expect(await extractText({ mimeType: "text/plain", data: bytes("Hệ thức Vi-ét") })).toBe("Hệ thức Vi-ét");
  });

  it("docx", async () => {
    const doc = new Document({ sections: [{ children: [new Paragraph("Công thức nghiệm"), new Paragraph("Delta = b² − 4ac")] }] });
    const data = new Uint8Array(await Packer.toBuffer(doc));
    const text = await extractText({ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", data });
    expect(text).toContain("Công thức nghiệm");
    expect(text).toContain("Delta");
  });

  it("pdf có chữ", async () => {
    const pdf = [
      "%PDF-1.4",
      "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
      "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj",
      "4 0 obj<</Length 52>>stream",
      "BT /F1 18 Tf 20 100 Td (Phuong trinh bac hai) Tj ET",
      "endstream endobj",
      "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
      "trailer<</Root 1 0 R/Size 6>>",
      "%%EOF",
    ].join("\n");
    expect(await extractText({ mimeType: "application/pdf", data: bytes(pdf) })).toContain("Phuong trinh bac hai");
  });

  it("loại chưa hỗ trợ hoặc tệp hỏng → chuỗi rỗng, không ném lỗi", async () => {
    expect(await extractText({ mimeType: "image/png", data: bytes("x") })).toBe("");
    expect(await extractText({ mimeType: "application/pdf", data: bytes("không phải pdf") })).toBe("");
  });
});
