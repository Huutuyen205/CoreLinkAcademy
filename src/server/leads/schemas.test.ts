import { describe, expect, it } from "vitest";
import { consume, LOGIN_LIMIT } from "@/server/rate-limit/rules";
import { manualLeadSchema } from "./schemas";

const valid = {
  source: "phone",
  parentName: "Phụ huynh Thử",
  phone: "0912 345 678",
  email: "",
  studentName: "Học sinh Thử",
  gradeLevel: "",
  subjectId: "",
  courseSlug: "",
  note: "",
};

describe("nhập lead tay FR-006", () => {
  it("TC-039 hợp lệ khi không có khối/môn; chuẩn hóa SĐT", () => {
    const r = manualLeadSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe("+84912345678");
      expect(r.data.gradeLevel).toBeNull();
      expect(r.data.subjectId).toBeNull();
    }
  });

  it("TC-039 thiếu tên học sinh, SĐT sai, khối ngoài khoảng → lỗi từng ô", () => {
    const r = manualLeadSchema.safeParse({ ...valid, studentName: "A", phone: "012345", gradeLevel: "13" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["studentName", "phone", "gradeLevel"]));
    }
  });

  it("TC-045 nguồn chỉ nhận phone/walk_in/referral/other (BR-012)", () => {
    for (const source of ["phone", "walk_in", "referral", "other"]) {
      expect(manualLeadSchema.safeParse({ ...valid, source }).success).toBe(true);
    }
    for (const source of ["web_form", "abc", ""]) {
      expect(manualLeadSchema.safeParse({ ...valid, source }).success).toBe(false);
    }
  });
});

describe("rate limit đăng nhập BR-009", () => {
  it("TC-043 20 lần trong 10 phút được phép, lần 21 bị chặn", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    let bucket = null as ReturnType<typeof consume>["next"] | null;
    for (let i = 1; i <= 20; i++) {
      const r = consume(bucket, now, LOGIN_LIMIT);
      expect(r.allowed).toBe(true);
      bucket = r.next;
    }
    expect(consume(bucket, now, LOGIN_LIMIT).allowed).toBe(false);
  });
});
