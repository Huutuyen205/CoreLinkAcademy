// Khuôn dữ liệu AI phải trả về (Zod). Mọi đầu ra — kể cả bản mock — đều qua các schema này trước khi dùng.
// `figure` (không bắt buộc): đặc tả hình minh họa do hệ thống tự vẽ (DECISION-D43); hình sai khuôn bị bỏ, phần chữ vẫn dùng.
import { z } from "zod";
import { optionalFigure } from "@/server/figures/schema";

const line = (max: number) => z.string().trim().min(1).max(max);
const lines = (max: number, maxItems: number) => z.array(line(max)).max(maxItems);

export const lessonPlanSchema = z.object({
  title: line(200),
  objectives: lines(300, 8).min(1),
  materials: lines(200, 12).default([]),
  activities: z
    .array(
      z.object({
        name: line(160),
        minutes: z.coerce.number().int().min(1).max(180),
        description: line(1500),
        teacherActions: z.string().trim().max(800).default(""),
        studentActions: z.string().trim().max(800).default(""),
      }),
    )
    .min(1)
    .max(12),
  assessment: line(1000),
  homework: z.string().trim().max(1000).default(""),
  notes: z.string().trim().max(1000).default(""),
});
export type LessonPlan = z.infer<typeof lessonPlanSchema>;

export const slidesSchema = z.object({
  title: line(200),
  slides: z
    .array(
      z.object({
        title: line(160),
        bullets: lines(300, 8).default([]),
        notes: z.string().trim().max(1000).default(""),
        figure: optionalFigure,
      }),
    )
    .min(2)
    .max(30),
});
export type SlideDeck = z.infer<typeof slidesSchema>;

export const curriculumSchema = z.object({
  title: line(200),
  summary: line(1200),
  outcomes: lines(300, 10).min(1),
  sections: z
    .array(z.object({ heading: line(160), content: line(2500), keyPoints: lines(300, 10).default([]), figure: optionalFigure }))
    .min(1)
    .max(12),
});
export type CurriculumOutline = z.infer<typeof curriculumSchema>;

/** Câu trắc nghiệm: `correctOption` đánh số từ 0 (khớp `Question.correctOption`). */
const mcqItem = z.object({
  type: z.literal("MCQ"),
  prompt: line(1500),
  options: lines(400, 6).min(2),
  correctOption: z.coerce.number().int().min(0),
  explanation: z.string().trim().max(1000).default(""),
  figure: optionalFigure,
});

const shortItem = z.object({
  type: z.literal("SHORT"),
  prompt: line(1500),
  acceptedAnswers: lines(200, 8).min(1),
  explanation: z.string().trim().max(1000).default(""),
  figure: optionalFigure,
});

const essayItem = z.object({
  type: z.literal("ESSAY"),
  prompt: line(2000),
  sampleAnswer: line(3000),
  rubric: z.array(z.object({ criterion: line(300), points: z.coerce.number().min(0).max(100) })).max(8).default([]),
  points: z.coerce.number().min(0.25).max(100).default(2),
  figure: optionalFigure,
});

/** Đề trắc nghiệm: chỉ MCQ. */
export const quizSchema = z.object({
  title: line(200),
  instructions: z.string().trim().max(1000).default(""),
  questions: z.array(mcqItem).min(1).max(50),
});
export type Quiz = z.infer<typeof quizSchema>;

/** Bài tập: trắc nghiệm + trả lời ngắn (tự chấm được). */
export const exercisesSchema = z.object({
  title: line(200),
  instructions: z.string().trim().max(1000).default(""),
  questions: z.array(z.discriminatedUnion("type", [mcqItem, shortItem])).min(1).max(40),
});
export type Exercises = z.infer<typeof exercisesSchema>;

/** Đề tự luận (Toán, Anh): kèm đáp án mẫu + thang điểm. */
export const essaySetSchema = z.object({
  title: line(200),
  instructions: z.string().trim().max(1000).default(""),
  questions: z.array(essayItem).min(1).max(12),
});
export type EssaySet = z.infer<typeof essaySetSchema>;

export type GeneratedContent =
  | { kind: "lesson_plan"; data: LessonPlan }
  | { kind: "slides"; data: SlideDeck }
  | { kind: "curriculum"; data: CurriculumOutline }
  | { kind: "quiz"; data: Quiz }
  | { kind: "exercises"; data: Exercises }
  | { kind: "essay"; data: EssaySet };

export const GENERATE_KINDS = ["lesson_plan", "slides", "curriculum", "quiz", "exercises", "essay"] as const;
export type GenerateKind = (typeof GENERATE_KINDS)[number];

export const KIND_LABELS: Record<GenerateKind, string> = {
  lesson_plan: "Giáo án",
  slides: "Slide bài giảng",
  curriculum: "Tóm tắt giáo trình buổi học",
  quiz: "Đề trắc nghiệm (có đáp án)",
  exercises: "Bài tập (trắc nghiệm + trả lời ngắn)",
  essay: "Đề tự luận có đáp án mẫu (Toán, Tiếng Anh)",
};

export const SCHEMAS = {
  lesson_plan: lessonPlanSchema,
  slides: slidesSchema,
  curriculum: curriculumSchema,
  quiz: quizSchema,
  exercises: exercisesSchema,
  essay: essaySetSchema,
} as const;

/** Kết quả chấm AI gợi ý cho một câu tự luận. */
export const essayGradeSchema = z.object({
  points: z.coerce.number().min(0),
  feedback: z.string().trim().max(1500).default(""),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
  transcript: z.string().trim().max(4000).default(""),
});
export type EssayGrade = z.infer<typeof essayGradeSchema>;

/** Kết quả đọc phiếu trả lời trắc nghiệm trên giấy: `choice` là chữ A–F hoặc null nếu bỏ trống/không rõ. */
export const answerSheetSchema = z.object({
  answers: z
    .array(z.object({ question: z.coerce.number().int().min(1).max(100), choice: z.string().trim().max(3).nullable() }))
    .max(100),
  note: z.string().trim().max(500).default(""),
});
export type AnswerSheet = z.infer<typeof answerSheetSchema>;

/** Ý định chatbot do AI nhận diện (chỉ để chọn hàm có sẵn; dữ liệu luôn lấy bằng service có kiểm tra phạm vi). */
export const intentGuessSchema = z.object({
  intent: z.string().trim().max(60),
  child: z.string().trim().max(120).nullish(),
  classCode: z.string().trim().max(60).nullish(),
  teacher: z.string().trim().max(120).nullish(),
  day: z.coerce.number().int().min(-7).max(7).nullish(),
});
export type IntentGuess = z.infer<typeof intentGuessSchema>;
