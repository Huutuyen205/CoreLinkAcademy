import { describe, expect, it } from "vitest";
import { dayRange } from "./dates";
import { INTENTS, intentsForRole, suggestionsForRole } from "./intents";
import { dayLabel, matchIntent, parseDayOffset } from "./matcher";
import { matchClassCode, matchPeople } from "./names";
import { sessionPresenceText } from "./rules";
import { compactText, hasPhrase, normalizeText } from "./text";

describe("normalizeText", () => {
  it("bỏ dấu, đ→d, chữ thường, bỏ dấu câu", () => {
    expect(normalizeText("Hôm nay, con tôi ĐÃ đến lớp chưa?")).toBe("hom nay con toi da den lop chua");
    expect(compactText("TOAN9-K1")).toBe("toan9k1");
    expect(hasPhrase("diem danh hom nay", "diem")).toBe(true);
    expect(hasPhrase("diemdanh", "diem")).toBe(false);
  });
});

describe("matchIntent — câu hỏi PO nêu", () => {
  const cases: [string, Parameters<typeof matchIntent>[1], string][] = [
    ["Hôm nay con tôi có đi học không?", "PARENT", "learner_today"],
    ["Hôm nay con tôi đã đến lớp chưa?", "PARENT", "learner_today"],
    ["con tôi hôm nay có đi học ko", "PARENT", "learner_today"],
    ["Hôm nay con tôi làm bài được mấy điểm?", "PARENT", "learner_score"],
    ["Con tôi học đến đâu rồi?", "PARENT", "learner_progress"],
    ["Bài tập về nhà của con khi nào phải nộp", "PARENT", "learner_homework"],
    ["Tỷ lệ chuyên cần của con", "PARENT", "learner_attendance_rate"],
    ["Đơn xin nghỉ của con đã được duyệt chưa", "PARENT", "learner_leave"],
    ["Hôm nay mình có buổi học không", "STUDENT", "learner_today"],
    ["Bài giảng hôm nay của tôi là gì?", "TEACHER", "teacher_lesson"],
    ["Nay tôi có mấy lớp?", "TEACHER", "teacher_today"],
    ["hôm nay tôi dạy bao nhiêu lớp", "TEACHER", "teacher_today"],
    ["Buổi nào tôi chưa điểm danh", "TEACHER", "teacher_attendance_todo"],
    ["Có bài nào cần chấm không", "TEACHER", "teacher_grading"],
    ["Nay có bao nhiêu lớp?", "ADMIN", "mgr_today"],
    ["Lớp TOAN9-K1 do ai dạy?", "ADMIN", "mgr_class_teacher"],
    ["Lớp này của giáo viên nào", "ADMIN", "mgr_class_teacher"],
    ["Phòng nào đang trống", "ADMIN", "mgr_rooms"],
    ["Có lead mới nào không", "ADMIN", "mgr_leads"],
    ["Học phí khóa Toán 9 bao nhiêu", "PARENT", "contact_center"],
  ];

  for (const [text, role, intent] of cases) {
    it(`${role}: "${text}" → ${intent}`, () => {
      expect(matchIntent(text, role)?.intent).toBe(intent);
    });
  }

  it("điểm danh không bị nhầm với điểm số", () => {
    expect(matchIntent("điểm danh hôm nay thế nào", "PARENT")?.intent).toBe("learner_today");
  });

  it("câu vô nghĩa → không khớp", () => {
    expect(matchIntent("asdf qwer", "PARENT")).toBeNull();
    expect(matchIntent("", "TEACHER")).toBeNull();
  });

  it("không trả ý định của vai trò khác", () => {
    expect(matchIntent("hôm nay có bao nhiêu lớp", "PARENT")?.intent).not.toBe("mgr_today");
    for (const role of ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const) {
      for (const text of ["chuyên cần", "lớp hôm nay", "lead", "chấm bài", "điểm"]) {
        const m = matchIntent(text, role);
        if (m) expect(intentsForRole(role).some((i) => i.id === m.intent)).toBe(true);
      }
    }
  });
});

describe("danh mục ý định", () => {
  it("id duy nhất; mỗi vai trò có ≥ 3 nút gợi ý; từ khóa đã chuẩn hóa", () => {
    expect(new Set(INTENTS.map((i) => i.id)).size).toBe(INTENTS.length);
    for (const role of ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const) {
      expect(suggestionsForRole(role).length).toBeGreaterThanOrEqual(3);
    }
    for (const i of INTENTS) for (const k of Object.keys(i.keywords)) expect(normalizeText(k)).toBe(k);
  });
});

describe("parseDayOffset", () => {
  it("đọc ngày tương đối, không nhầm tên người 'Mai'", () => {
    expect(parseDayOffset("hôm qua con có đi học không")).toEqual({ offset: -1, explicit: true });
    expect(parseDayOffset("ngày mai tôi dạy lớp nào")).toEqual({ offset: 1, explicit: true });
    expect(parseDayOffset("hôm nay có mấy lớp")).toEqual({ offset: 0, explicit: true });
    expect(parseDayOffset("cô Mai dạy lớp nào")).toEqual({ offset: 0, explicit: false });
    expect(dayLabel(-1)).toBe("Hôm qua");
  });
});

describe("dayRange (giờ Việt Nam)", () => {
  it("hôm nay/ngày mai theo múi giờ VN, không theo UTC", () => {
    // 2026-11-02 20:00 UTC = 03:00 ngày 03/11 giờ VN.
    const now = new Date("2026-11-02T20:00:00Z");
    expect(dayRange(now, 0).key).toBe("2026-11-03");
    expect(dayRange(now, 1).key).toBe("2026-11-04");
    expect(dayRange(now, -1).key).toBe("2026-11-02");
    expect(dayRange(now, 0).from.toISOString()).toBe("2026-11-02T17:00:00.000Z");
    expect(dayRange(now, 0).to.getTime() - dayRange(now, 0).from.getTime()).toBe(24 * 3_600_000);
  });
});

describe("matchPeople / matchClassCode", () => {
  const kids = [{ fullName: "Nguyễn Minh Anh" }, { fullName: "Nguyễn Gia Bảo" }];

  it("khớp tên gọi hoặc họ tên; mơ hồ → trả nhiều người", () => {
    expect(matchPeople(kids, "Bảo hôm nay có đi học không")).toEqual([kids[1]]);
    expect(matchPeople(kids, "nguyen minh anh co di hoc khong")).toEqual([kids[0]]);
    expect(matchPeople(kids, "con tôi có đi học không")).toEqual([]);
    expect(matchPeople([{ fullName: "Trần Anh" }, { fullName: "Lê Anh" }], "Anh học thế nào")).toHaveLength(2);
  });

  it("tên gọi ngắn phải khớp có dấu: 'ăn' không bị nhầm với bé An", () => {
    const an = [{ fullName: "Nguyễn Minh An" }];
    expect(matchPeople(an, "con tôi ăn trưa chưa")).toEqual([]);
    expect(matchPeople(an, "An hôm nay có đi học không")).toEqual(an);
    expect(matchPeople([{ fullName: "Lê A" }], "a b c")).toEqual([]);
  });

  it("mã lớp khớp bỏ dấu/gạch nối; chọn mã dài nhất", () => {
    const classes = [{ code: "TOAN9-K1" }, { code: "TOAN9-K10" }, { code: "VAN9-K1" }];
    expect(matchClassCode(classes, "Lớp toan9 k1 do ai dạy")?.code).toBe("TOAN9-K1");
    expect(matchClassCode(classes, "lớp TOAN9-K10 sĩ số")?.code).toBe("TOAN9-K10");
    expect(matchClassCode(classes, "lớp này của giáo viên nào")).toBeNull();
  });
});

describe("sessionPresenceText — chưa điểm danh khác với vắng", () => {
  const base = { sessionStatus: "SCHEDULED" as const, cancelReason: null, attendance: null, startsAt: new Date("2026-11-02T11:00:00Z"), endsAt: new Date("2026-11-02T12:30:00Z") };

  it("trước giờ học: chưa đến giờ, không nói vắng", () => {
    const t = sessionPresenceText({ ...base, now: new Date("2026-11-02T10:00:00Z") });
    expect(t).toContain("Chưa đến giờ học");
    expect(t).not.toMatch(/vắng/);
  });

  it("đang diễn ra hoặc đã xong mà chưa điểm danh: nói rõ chưa có thông tin", () => {
    expect(sessionPresenceText({ ...base, now: new Date("2026-11-02T11:30:00Z") })).toContain("chưa điểm danh");
    const after = sessionPresenceText({ ...base, now: new Date("2026-11-02T14:00:00Z") });
    expect(after).toContain("chưa điểm danh");
    expect(after).not.toContain("vắng mặt");
  });

  it("đã điểm danh: đúng trạng thái và ghi chú", () => {
    const now = new Date("2026-11-02T14:00:00Z");
    expect(sessionPresenceText({ ...base, now, attendance: { status: "PRESENT", note: null } })).toContain("có mặt");
    expect(sessionPresenceText({ ...base, now, attendance: { status: "ABSENT", note: "ốm" } })).toMatch(/vắng mặt.*ốm/);
    expect(sessionPresenceText({ ...base, now, attendance: { status: "EXCUSED", note: null } })).toContain("có phép");
  });

  it("buổi đã hủy nêu lý do, bỏ qua điểm danh", () => {
    const t = sessionPresenceText({ ...base, sessionStatus: "CANCELLED", cancelReason: "Giáo viên bận", now: new Date("2026-11-02T14:00:00Z"), attendance: { status: "ABSENT", note: null } });
    expect(t).toBe("Buổi học đã hủy (lý do: Giáo viên bận).");
  });
});
