import { describe, expect, it } from "vitest";
import { consume, TRIAL_LIMIT } from "@/server/rate-limit/rules";
import { checkLeadTransition, isLeadOpen, isLeadOverdue } from "./rules";
import { trialRequestSchema } from "./schemas";

const validTrial = {
  parentName: "Nguyễn Văn A",
  phone: "0912 345 678",
  email: "",
  studentName: "Nguyễn Văn B",
  gradeLevel: "9",
  subjectId: "subj1",
  courseSlug: "",
  note: "",
  consent: "on",
};

describe("form học thử", () => {
  it("TC-002 thiếu đồng ý liên hệ → lỗi ở ô consent", () => {
    const result = trialRequestSchema.safeParse({ ...validTrial, consent: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === "consent")).toBe(true);
  });

  it("TC-002 dữ liệu hợp lệ được chuẩn hóa", () => {
    const result = trialRequestSchema.parse(validTrial);
    expect(result.phone).toBe("+84912345678");
    expect(result.gradeLevel).toBe(9);
    expect(result.email).toBeNull();
    expect(result.courseSlug).toBeNull();
  });

  it("TC-001 SĐT sai bị từ chối trong form", () => {
    const result = trialRequestSchema.safeParse({ ...validTrial, phone: "123" });
    expect(result.error?.issues[0]?.path).toEqual(["phone"]);
  });
});

describe("rate limit", () => {
  it("TC-004 5 lần trong 10 phút được phép, lần thứ 6 bị chặn", () => {
    const start = new Date("2026-10-21T03:00:00.000Z");
    let bucket = null as ReturnType<typeof consume>["next"] | null;
    for (let i = 1; i <= 5; i++) {
      const r = consume(bucket, new Date(start.getTime() + i * 1000));
      expect(r.allowed).toBe(true);
      bucket = r.next;
    }
    expect(consume(bucket, new Date(start.getTime() + 60_000)).allowed).toBe(false);
  });

  it("TC-004 hết cửa sổ thì đếm lại", () => {
    const now = new Date("2026-10-21T03:00:00.000Z");
    const bucket = { count: 9, resetAt: now };
    const r = consume(bucket, now);
    expect(r.allowed).toBe(true);
    expect(r.next.count).toBe(1);
    expect(r.next.resetAt.getTime()).toBe(now.getTime() + TRIAL_LIMIT.windowMs);
  });
});

describe("máy trạng thái lead", () => {
  it("TC-005 chuyển hợp lệ theo BR-010", () => {
    expect(checkLeadTransition("NEW", "CONTACTED")).toBeNull();
    expect(checkLeadTransition("CONTACTED", "TRIAL_SCHEDULED")).toBeNull();
    expect(checkLeadTransition("TRIAL_SCHEDULED", "CONTACTED")).toBeNull();
    expect(checkLeadTransition("TRIAL_SCHEDULED", "TRIAL_DONE")).toBeNull();
    expect(checkLeadTransition("LOST", "CONTACTED")).toBeNull();
  });

  it("TC-005 chuyển sai luồng bị từ chối; ENROLLED chỉ qua chuyển học viên", () => {
    expect(checkLeadTransition("NEW", "TRIAL_DONE")).toBe("INVALID_TRANSITION");
    expect(checkLeadTransition("TRIAL_DONE", "CONTACTED")).toBe("INVALID_TRANSITION");
    expect(checkLeadTransition("NEW", "ENROLLED")).toBe("INVALID_TRANSITION");
    expect(checkLeadTransition("ENROLLED", "LOST", "x")).toBe("INVALID_TRANSITION");
  });

  it("TC-006 LOST bắt buộc lý do", () => {
    expect(checkLeadTransition("NEW", "LOST")).toBe("LOST_REASON_REQUIRED");
    expect(checkLeadTransition("NEW", "LOST", "   ")).toBe("LOST_REASON_REQUIRED");
    expect(checkLeadTransition("NEW", "LOST", "Đã học nơi khác")).toBeNull();
  });

  it("BR-004 lead đang mở", () => {
    expect(isLeadOpen("TRIAL_DONE")).toBe(true);
    expect(isLeadOpen("ENROLLED")).toBe(false);
    expect(isLeadOpen("LOST")).toBe(false);
  });

  it("BR-003 NEW quá 24 giờ là quá hạn", () => {
    const now = new Date("2026-10-22T03:00:00.000Z");
    expect(isLeadOverdue({ status: "NEW", createdAt: new Date("2026-10-21T02:59:00.000Z") }, now)).toBe(true);
    expect(isLeadOverdue({ status: "NEW", createdAt: new Date("2026-10-21T03:00:00.000Z") }, now)).toBe(false);
    expect(isLeadOverdue({ status: "CONTACTED", createdAt: new Date("2026-10-01T00:00:00.000Z") }, now)).toBe(false);
  });
});
