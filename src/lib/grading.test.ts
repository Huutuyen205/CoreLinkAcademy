import { describe, expect, it } from "vitest";
import {
  autoGrade,
  assignmentMaxScore,
  checkAssignmentTransition,
  checkSubmitContent,
  checkSubmit,
  checkTeacherPoints,
  normalizeAnswer,
  resultsVisible,
  statusAfterSubmit,
  submissionResultVisible,
  toStudentQuestion,
  totalScore,
  validateQuestion,
  type QuestionData,
} from "./grading";

const mcq: QuestionData = { id: "q1", order: 1, type: "MCQ", prompt: "2 + 2 = ?", options: ["3", "4", "5"], correctOption: 1, acceptedAnswers: null, points: 2 };
const short: QuestionData = { id: "q2", order: 2, type: "SHORT", prompt: "Thủ đô Việt Nam?", options: null, correctOption: null, acceptedAnswers: ["Hà Nội", "Ha Noi"], points: 1 };
const now = new Date("2026-10-21T03:00:00Z");

describe("chuyển trạng thái bài tập", () => {
  it("TC-023 xuất bản bài không có câu → NO_QUESTIONS", () => {
    expect(checkAssignmentTransition("DRAFT", "PUBLISHED", { questionCount: 0, dueAt: new Date("2026-10-30Z"), now })).toBe("NO_QUESTIONS");
    expect(checkAssignmentTransition("DRAFT", "PUBLISHED", { questionCount: 0, acceptsFiles: true, dueAt: new Date("2026-10-30Z"), now })).toBeNull();
  });

  it("TC-024 DRAFT → PUBLISHED → CLOSED → PUBLISHED; hạn nộp quá khứ bị chặn", () => {
    const ctx = { questionCount: 3, dueAt: new Date("2026-10-30T00:00:00Z"), now };
    expect(checkAssignmentTransition("DRAFT", "PUBLISHED", ctx)).toBeNull();
    expect(checkAssignmentTransition("PUBLISHED", "CLOSED", ctx)).toBeNull();
    expect(checkAssignmentTransition("CLOSED", "PUBLISHED", ctx)).toBeNull();
    expect(checkAssignmentTransition("PUBLISHED", "DRAFT", ctx)).toBe("INVALID_TRANSITION");
    expect(checkAssignmentTransition("DRAFT", "CLOSED", ctx)).toBe("INVALID_TRANSITION");
    expect(checkAssignmentTransition("DRAFT", "PUBLISHED", { ...ctx, dueAt: new Date("2026-10-20T00:00:00Z") })).toBe("DUE_IN_PAST");
  });
});

describe("kiểm tra câu hỏi", () => {
  it("TC-025 MCQ 2–6 lựa chọn, đáp án trong phạm vi", () => {
    expect(validateQuestion({ ...mcq })).toBeNull();
    expect(validateQuestion({ ...mcq, options: ["Chỉ một"] })?.options).toBeDefined();
    expect(validateQuestion({ ...mcq, options: ["1", "2", "3", "4", "5", "6", "7"] })?.options).toBeDefined();
    expect(validateQuestion({ ...mcq, options: ["a", " "] })?.options).toBeDefined();
    expect(validateQuestion({ ...mcq, correctOption: 3 })?.correctOption).toBeDefined();
    expect(validateQuestion({ ...mcq, correctOption: null })?.correctOption).toBeDefined();
  });

  it("điểm câu > 0 và bước 0,25; trả lời ngắn cần đáp án", () => {
    expect(validateQuestion({ ...mcq, points: 0 })?.points).toBeDefined();
    expect(validateQuestion({ ...mcq, points: 1.3 })?.points).toBeDefined();
    expect(validateQuestion({ ...mcq, points: 1.25 })).toBeNull();
    expect(validateQuestion({ ...short, acceptedAnswers: ["  "] })?.acceptedAnswers).toBeDefined();
    expect(validateQuestion({ ...short, type: "ESSAY", acceptedAnswers: null })).toBeNull();
  });
});

describe("tự chấm", () => {
  it("TC-026 MCQ đúng đủ điểm, sai 0", () => {
    expect(autoGrade(mcq, "1")).toBe(2);
    expect(autoGrade(mcq, "0")).toBe(0);
    expect(autoGrade(mcq, null)).toBe(0);
  });

  it("TC-027 trả lời ngắn không phân biệt hoa thường/khoảng trắng", () => {
    expect(autoGrade(short, "  hà   NỘI ")).toBe(1);
    expect(autoGrade(short, "ha noi")).toBe(1);
    expect(autoGrade(short, "Huế")).toBe(0);
    expect(normalizeAnswer("Hà Nội")).toBe(normalizeAnswer("Hà Nội")); // NFD vs NFC
  });

  it("tự luận không tự chấm", () => {
    expect(autoGrade({ ...short, type: "ESSAY" }, "bài làm")).toBeNull();
  });
});

describe("nộp bài", () => {
  const dueAt = new Date("2026-10-21T02:00:00Z");

  it("TC-028 quá hạn: chặn nếu không cho nộp muộn, đánh dấu muộn nếu cho", () => {
    expect(checkSubmit({ submissionStatus: "IN_PROGRESS", dueAt, allowLate: false, now })).toEqual({ error: "PAST_DUE" });
    expect(checkSubmit({ submissionStatus: "IN_PROGRESS", dueAt, allowLate: true, now })).toEqual({ error: null, isLate: true });
    expect(checkSubmit({ submissionStatus: "IN_PROGRESS", dueAt: new Date("2026-10-22Z"), allowLate: false, now })).toEqual({ error: null, isLate: false });
  });

  it("BR-045 không nộp lần hai", () => {
    expect(checkSubmit({ submissionStatus: "SUBMITTED", dueAt, allowLate: true, now })).toEqual({ error: "ALREADY_SUBMITTED" });
    expect(checkSubmit({ submissionStatus: "GRADED", dueAt, allowLate: true, now })).toEqual({ error: "ALREADY_SUBMITTED" });
  });

  it("TC-029 bài chỉ có câu khách quan → GRADED ngay", () => {
    expect(statusAfterSubmit([{ type: "MCQ" }, { type: "SHORT" }])).toBe("GRADED");
    expect(statusAfterSubmit([{ type: "MCQ" }, { type: "ESSAY" }])).toBe("SUBMITTED");
  });
  it("FR-040: có tệp hoặc không có câu hỏi → chờ chấm", () => {
    expect(statusAfterSubmit([{ type: "MCQ" }], true)).toBe("SUBMITTED");
    expect(statusAfterSubmit([], true)).toBe("SUBMITTED");
  });
  it("FR-040: điểm tối đa và nội dung nộp", () => {
    expect(assignmentMaxScore({ questions: [{ points: 2 }, { points: 0.25 }], manualMaxScore: 10 })).toBe(2.25);
    expect(assignmentMaxScore({ questions: [], manualMaxScore: 10 })).toBe(10);
    expect(checkSubmitContent(0, 0)).toBe("NO_FILES");
    expect(checkSubmitContent(0, 1)).toBeNull();
    expect(checkSubmitContent(2, 0)).toBeNull();
  });
});

describe("chấm của giáo viên", () => {
  it("TC-030 điểm ngoài [0, max] hoặc lệch bước 0,25 → lỗi", () => {
    expect(checkTeacherPoints(-0.25, 2)).not.toBeNull();
    expect(checkTeacherPoints(2.25, 2)).not.toBeNull();
    expect(checkTeacherPoints(1.1, 2)).not.toBeNull();
    expect(checkTeacherPoints(1.75, 2)).toBeNull();
    expect(checkTeacherPoints(0, 2)).toBeNull();
  });

  it("TC-031 tổng điểm ưu tiên điểm giáo viên, làm tròn 2 chữ số", () => {
    expect(
      totalScore([
        { autoPoints: 2, teacherPoints: null },
        { autoPoints: 0, teacherPoints: 0.75 },
        { autoPoints: null, teacherPoints: 1.5 },
        { autoPoints: null, teacherPoints: null },
      ]),
    ).toBe(4.25);
    expect(totalScore([{ autoPoints: 0.1, teacherPoints: null }, { autoPoints: 0.2, teacherPoints: null }])).toBe(0.3);
  });
});

describe("bảo vệ đáp án", () => {
  it("TC-032 câu hỏi gửi cho học sinh không chứa đáp án", () => {
    const q = toStudentQuestion(mcq);
    expect(q).not.toHaveProperty("correctOption");
    expect(q).not.toHaveProperty("acceptedAnswers");
    expect(JSON.stringify(toStudentQuestion(short))).not.toContain("Hà Nội");
  });

  it("TC-033 kết quả chỉ hiển thị sau công bố", () => {
    expect(resultsVisible({ resultsPublishedAt: null })).toBe(false);
    expect(resultsVisible({ resultsPublishedAt: now })).toBe(true);
  });

  it("TC-042 đã công bố nhưng bài chưa chấm thì chưa hiện điểm (BR-047)", () => {
    expect(submissionResultVisible({ resultsPublishedAt: now }, "SUBMITTED")).toBe(false);
    expect(submissionResultVisible({ resultsPublishedAt: now }, "GRADED")).toBe(true);
    expect(submissionResultVisible({ resultsPublishedAt: null }, "GRADED")).toBe(false);
    expect(submissionResultVisible({ resultsPublishedAt: now }, null)).toBe(false);
  });
});
