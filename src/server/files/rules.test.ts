import { describe, expect, it } from "vitest";
import { checkUploads, formatBytes, isInlineType, MAX_FILE_BYTES, resolveMimeType, sanitizeFileName } from "./rules";

describe("resolveMimeType", () => {
  it("chấp nhận MIME khai báo khớp phần mở rộng", () => {
    expect(resolveMimeType("bai.pdf", "application/pdf")).toBe("application/pdf");
  });
  it("suy ra từ phần mở rộng khi MIME rỗng/sai", () => {
    expect(resolveMimeType("IMG_001.HEIC", "")).toBe("image/heic");
    expect(resolveMimeType("anh.jpg", "application/octet-stream")).toBe("image/jpeg");
  });
  it("từ chối loại không cho phép", () => {
    expect(resolveMimeType("virus.exe", "application/x-msdownload")).toBeNull();
    expect(resolveMimeType("trang.html", "text/html")).toBeNull();
    expect(resolveMimeType("khong-duoi", "")).toBeNull();
  });
});

describe("checkUploads", () => {
  const ok = { name: "a.png", type: "image/png", size: 1000 };
  it("lô hợp lệ", () => expect(checkUploads([ok, ok])).toBeNull());
  it("quá số tệp", () => expect(checkUploads([ok, ok, ok], 2)).toMatch(/tối đa 2/));
  it("quá tổng dung lượng", () => expect(checkUploads([{ ...ok, size: MAX_FILE_BYTES + 1 }])).toMatch(/4 MB/));
  it("tệp rỗng", () => expect(checkUploads([{ ...ok, size: 0 }])).toMatch(/rỗng/));
  it("loại không hỗ trợ", () => expect(checkUploads([{ name: "x.svg", type: "image/svg+xml", size: 10 }])).toMatch(/Không hỗ trợ/));
});

describe("sanitizeFileName", () => {
  it("bỏ dấu gạch đường dẫn và ký tự điều khiển", () => {
    expect(sanitizeFileName('..\\..\\a/b"\u0001.pdf')).toBe(".._.._a_b.pdf");
  });
  it("cắt tên dài nhưng giữ phần mở rộng", () => {
    const name = sanitizeFileName(`${"x".repeat(300)}.docx`);
    expect(name.length).toBe(200);
    expect(name.endsWith(".docx")).toBe(true);
  });
});

describe("hiển thị", () => {
  it("ảnh/PDF mở trực tiếp, HEIC và Office tải xuống", () => {
    expect(isInlineType("image/png")).toBe(true);
    expect(isInlineType("application/pdf")).toBe(true);
    expect(isInlineType("image/heic")).toBe(false);
    expect(isInlineType("application/msword")).toBe(false);
  });
  it("formatBytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});
