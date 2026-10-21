import { describe, expect, it } from "vitest";
import { MAX_IMPORT_ROWS, parseStudentImport } from "./import";

describe("parseStudentImport", () => {
  it("đọc dòng dán từ Excel (Tab), bỏ tiêu đề và dòng trống", () => {
    const { rows, errors } = parseStudentImport("Họ tên\tKhối\tSĐT\tEmail\nNguyễn Văn A\t9\t0912345678\tA@x.vn\n\nTrần B\t6\t\t");
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { line: 2, fullName: "Nguyễn Văn A", gradeLevel: 9, phone: "+84912345678", email: "a@x.vn" },
      { line: 4, fullName: "Trần B", gradeLevel: 6, phone: null, email: null },
    ]);
  });
  it("chấp nhận dấu phẩy / chấm phẩy", () => {
    expect(parseStudentImport("Lê C,10,,c@x.vn").rows[0]?.email).toBe("c@x.vn");
    expect(parseStudentImport("Lê D;0").rows[0]?.gradeLevel).toBe(0);
  });
  it("báo lỗi theo số dòng: khối, SĐT, email, trùng trong file", () => {
    const { errors } = parseStudentImport("A\t13\nBé B\t5\tabc\nBé C\t5\t0912345678\tx@\nBé D\t5\t0912345678");
    expect(errors).toContain("Dòng 1: họ tên không hợp lệ.");
    expect(errors).toContain("Dòng 1: khối lớp phải là số 0–12.");
    expect(errors).toContain("Dòng 2: số điện thoại không hợp lệ.");
    expect(errors).toContain("Dòng 3: email không hợp lệ.");
    expect(errors).toContain("Dòng 4: số điện thoại trùng với dòng khác.");
  });
  it("giới hạn số dòng và nội dung rỗng", () => {
    expect(parseStudentImport("").errors).toEqual(["Chưa có dòng dữ liệu nào."]);
    const many = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `HS số ${i}\t5`).join("\n");
    expect(parseStudentImport(many).errors.at(-1)).toMatch(/tối đa/);
  });
});
