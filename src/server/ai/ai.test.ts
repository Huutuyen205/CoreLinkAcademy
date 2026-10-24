import { describe, expect, it } from "vitest";
import { readAiConfig } from "./config";
import { extractJson } from "./json";
import { mockProvider } from "./providers/mock";
import { subjectGroupOf, type MockGenCtx, type SubjectGroup } from "./generate/samples";
import { normalizeContent, toExamData } from "./generate/exam";
import { buildSystemPrompt, buildUserPrompt } from "./generate/prompts";
import type { SessionContext } from "./generate/context";
import { clampCount, cleanItems, distributePoints, essayPoints, isValidMcq } from "./generate/rules";
import { GENERATE_KINDS, SCHEMAS, answerSheetSchema, essayGradeSchema, intentGuessSchema } from "./generate/schemas";

describe("readAiConfig", () => {
  it("mặc định và thiếu khóa → mock", () => {
    expect(readAiConfig({}).provider).toBe("mock");
    expect(readAiConfig({ AI_PROVIDER: "gemini" }).provider).toBe("mock");
    expect(readAiConfig({ AI_PROVIDER: "khong-ton-tai", AI_API_KEY: "k" }).provider).toBe("mock");
  });

  it("có khóa → dùng nhà cung cấp, model mặc định theo nhà cung cấp", () => {
    const c = readAiConfig({ AI_PROVIDER: "Gemini", AI_API_KEY: " k " });
    expect(c.provider).toBe("gemini");
    expect(c.apiKey).toBe("k");
    expect(c.model).toMatch(/gemini/);
    expect(readAiConfig({ AI_PROVIDER: "openai", AI_API_KEY: "k", AI_MODEL: "llama-3.3-70b-versatile", AI_BASE_URL: "https://api.groq.com/openai/v1/" })).toMatchObject({
      model: "llama-3.3-70b-versatile",
      baseUrl: "https://api.groq.com/openai/v1",
    });
  });

  it("AI_JSON_MODE=off tắt chế độ JSON", () => {
    expect(readAiConfig({ AI_JSON_MODE: "off" }).jsonMode).toBe(false);
    expect(readAiConfig({}).jsonMode).toBe(true);
  });
});

describe("extractJson", () => {
  it("đọc JSON thuần, bọc ```json, và có chữ thừa", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Đây là kết quả:\n{"a":[1,2]}\nHết.')).toEqual({ a: [1, 2] });
  });

  it("không phải JSON → lỗi", () => {
    expect(() => extractJson("xin chào")).toThrow();
  });
});

describe("distributePoints", () => {
  it("tổng luôn 10 điểm và bước 0,25", () => {
    for (const n of [1, 2, 3, 6, 7, 10, 13, 20]) {
      const pts = distributePoints(n);
      expect(pts).toHaveLength(n);
      expect(pts.every((p) => Math.abs(p * 4 - Math.round(p * 4)) < 1e-9 && p >= 0.25)).toBe(true);
      expect(Math.round(pts.reduce((a, b) => a + b, 0) * 100) / 100).toBe(10);
    }
  });

  it("nhiều câu hơn 40 vẫn ≥ 0,25 mỗi câu", () => {
    expect(Math.min(...distributePoints(50))).toBeGreaterThanOrEqual(0.25);
  });
});

describe("kiểm tra câu hỏi AI sinh", () => {
  const mcq = (o: Partial<{ prompt: string; options: string[]; correctOption: number }> = {}) => ({
    type: "MCQ" as const,
    prompt: "2 + 2 = ?",
    options: ["3", "4", "5", "6"],
    correctOption: 1,
    explanation: "",
    ...o,
  });

  it("loại câu có đáp án ngoài danh sách, lựa chọn trùng hoặc rỗng", () => {
    expect(isValidMcq(mcq())).toBe(true);
    expect(isValidMcq(mcq({ correctOption: 4 }))).toBe(false);
    expect(isValidMcq(mcq({ correctOption: -1 }))).toBe(false);
    expect(isValidMcq(mcq({ options: ["3", "3 ", "5", "6"] }))).toBe(false);
    expect(isValidMcq(mcq({ options: ["3", "", "5", "6"] }))).toBe(false);
    expect(isValidMcq(mcq({ options: ["3"], correctOption: 0 }))).toBe(false);
  });

  it("cleanItems bỏ câu lỗi, câu trùng đề, gộp đáp án trùng", () => {
    const out = cleanItems([
      mcq(),
      mcq(), // trùng đề
      mcq({ prompt: "câu hỏng", correctOption: 9 }),
      { type: "SHORT", prompt: "1 + 1 = ?", acceptedAnswers: ["2", " 2 ", ""], explanation: "" },
      { type: "SHORT", prompt: "câu không đáp án", acceptedAnswers: [" "], explanation: "" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ type: "SHORT", acceptedAnswers: ["2"] });
  });

  it("clampCount và essayPoints", () => {
    expect(clampCount(null, 10, 30)).toBe(10);
    expect(clampCount(0, 10, 30)).toBe(1);
    expect(clampCount(99, 10, 30)).toBe(30);
    expect(essayPoints({ type: "ESSAY", prompt: "x", sampleAnswer: "y", rubric: [{ criterion: "a", points: 1 }, { criterion: "b", points: 1.6 }], points: 5 })).toBe(2.5);
    expect(essayPoints({ type: "ESSAY", prompt: "x", sampleAnswer: "y", rubric: [], points: 3 })).toBe(3);
  });
});

describe("subjectGroupOf", () => {
  it("nhận Toán / Tiếng Anh / môn khác", () => {
    expect(subjectGroupOf("Toán")).toBe("math");
    expect(subjectGroupOf("Toán học")).toBe("math");
    expect(subjectGroupOf("Tiếng Anh")).toBe("english");
    expect(subjectGroupOf("English")).toBe("english");
    expect(subjectGroupOf("Ngữ văn")).toBe("other");
    expect(subjectGroupOf("Khoa học tự nhiên")).toBe("other");
  });
});

describe("dữ liệu mẫu (mock) qua đúng schema như AI thật", () => {
  const groups: SubjectGroup[] = ["math", "english", "other"];

  for (const group of groups) {
    for (const kind of GENERATE_KINDS) {
      it(`${group} · ${kind}`, async () => {
        const ctx: MockGenCtx = { kind, group, topic: "Phương trình bậc hai", courseTitle: "Toán 9", sessionIndex: 3, count: 4 };
        const { text } = await mockProvider().complete({ task: kind, system: "", user: "", mock: ctx });
        const content = normalizeContent(kind, extractJson(text));
        expect(content.kind).toBe(kind);
        if (kind === "quiz" || kind === "exercises" || kind === "essay") {
          const exam = toExamData(content)!;
          expect(exam.questions.length).toBeGreaterThan(0);
          for (const q of exam.questions) {
            if (q.type === "MCQ") expect(q.correctOption).toBeLessThan(q.options.length);
            if (q.type === "SHORT") expect(q.acceptedAnswers.length).toBeGreaterThan(0);
            if (q.type === "ESSAY") expect(q.sampleAnswer).not.toBe("");
          }
        }
      });
    }
  }

  it("đáp án mẫu Toán đúng về toán học", async () => {
    const { text } = await mockProvider().complete({ task: "quiz", system: "", user: "", mock: { kind: "quiz", group: "math", topic: "", courseTitle: "", sessionIndex: 1, count: 5 } });
    const quiz = SCHEMAS.quiz.parse(extractJson(text));
    // Δ của x² − 4x + 3 = 0 là 4; tổng hai nghiệm x² − 7x + 10 = 0 là 7.
    expect(quiz.questions[1]!.options[quiz.questions[1]!.correctOption]).toBe("4");
    expect(quiz.questions[3]!.options[quiz.questions[3]!.correctOption]).toBe("7");
    // Câu đọc đồ thị y = x² − 4x + 3 (có hình): 2 nghiệm.
    const full = SCHEMAS.quiz.parse(extractJson((await mockProvider().complete({ task: "quiz", system: "", user: "", mock: { kind: "quiz", group: "math", topic: "", courseTitle: "", sessionIndex: 1, count: 10 } })).text));
    const graph = full.questions.find((q) => q.figure)!;
    expect(graph.figure).toMatchObject({ type: "function", expr: "x^2-4x+3" });
    expect(graph.options[graph.correctOption]).toBe("2");
  });

  it("mock nhận diện ý định trả unknown; chấm tự luận/đọc phiếu qua đúng schema", async () => {
    const p = mockProvider();
    expect(intentGuessSchema.parse(extractJson((await p.complete({ task: "intent", system: "", user: "" })).text)).intent).toBe("unknown");
    const grade = essayGradeSchema.parse(extractJson((await p.complete({ task: "grade_essay", system: "", user: "", mock: { maxPoints: 3, response: "một hai ba bốn năm sáu bảy tám chín mười ".repeat(5), hasPhotos: false } })).text));
    expect(grade.points).toBeGreaterThan(0);
    expect(grade.points).toBeLessThanOrEqual(3);
    expect(grade.confidence).toBe("low");
    const sheet = answerSheetSchema.parse(extractJson((await p.complete({ task: "read_answer_sheet", system: "", user: "", mock: { questionCount: 6 } })).text));
    expect(sheet.answers).toHaveLength(6);
  });
});

describe("normalizeContent", () => {
  it("JSON sai khuôn mẫu hoặc không còn câu hợp lệ → lỗi", () => {
    expect(() => normalizeContent("quiz", { title: "x" })).toThrow();
    expect(() => normalizeContent("quiz", { title: "x", questions: [{ type: "MCQ", prompt: "p", options: ["a", "a"], correctOption: 0 }] })).toThrow();
  });
});

describe("prompt gửi AI không chứa dữ liệu học sinh", () => {
  const ctx: SessionContext = {
    sessionId: "s1",
    classId: "c1",
    classCode: "TOAN9-K1",
    isClassOwner: true,
    courseTitle: "Toán 9 ôn thi vào 10",
    subjectId: "m1",
    subjectName: "Toán",
    group: "math",
    gradeFrom: 9,
    gradeTo: 9,
    level: "Nâng cao",
    sessionIndex: 5,
    totalSessions: 24,
    sessionMinutes: 90,
    startsAt: new Date("2026-11-02T11:00:00Z"),
    endsAt: new Date("2026-11-02T12:30:00Z"),
    syllabusItem: { title: "Phương trình bậc hai", detail: "Công thức nghiệm" },
    outcomes: ["Giải được phương trình bậc hai"],
    lessonContent: null,
    homework: null,
    note: null,
    documents: [{ kind: "CURRICULUM", title: "Giáo trình Toán 9", description: "Chương 4" }],
    excerpts: [],
  };

  it("có khóa học, buổi, khung chương trình; chỉ dẫn yêu cầu JSON đúng cấu trúc", () => {
    const user = buildUserPrompt("quiz", ctx, { topic: "", count: 8, difficulty: "mixed", notes: "Có câu vận dụng" });
    expect(user).toContain("Toán 9 ôn thi vào 10");
    expect(user).toContain("Phương trình bậc hai");
    expect(user).toContain("Số câu: 8");
    expect(user).toContain("Có câu vận dụng");
    const system = buildSystemPrompt("quiz", ctx);
    expect(system).toContain("correctOption");
    expect(system).toContain("TỪ 0");
  });

  it("hướng dẫn hình minh họa: chỉ môn Toán, không cho giáo án; đề nhắc không lộ đáp án (DECISION-D43)", () => {
    expect(buildSystemPrompt("slides", ctx)).toContain('"figure"');
    expect(buildSystemPrompt("quiz", ctx)).toContain("KHÔNG được lộ đáp án");
    expect(buildSystemPrompt("lesson_plan", ctx)).not.toContain('"figure"');
    expect(buildSystemPrompt("slides", { ...ctx, group: "english" })).not.toContain('"figure"');
    expect(buildSystemPrompt("slides", { ...ctx, group: "other" })).not.toContain('"figure"');
  });
});
