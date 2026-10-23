// Gộp đề trắc nghiệm / bài tập / tự luận về một dạng có điểm từng câu. Hàm thuần.
import type { ExamData, ExamQuestion } from "./render-docx";
import { DomainError } from "@/server/errors";
import { cleanExercises, cleanQuiz, distributePoints, essayPoints } from "./rules";
import { SCHEMAS, type GenerateKind, type GeneratedContent } from "./schemas";

/** Gộp 3 loại đề về một dạng có điểm từng câu (tổng 10 điểm với trắc nghiệm/trả lời ngắn). */
export function toExamData(content: GeneratedContent): ExamData | null {
  if (content.kind === "quiz" || content.kind === "exercises") {
    const items = content.data.questions;
    const pts = distributePoints(items.length);
    const questions: ExamQuestion[] = items.map((q, i) =>
      q.type === "MCQ"
        ? { type: "MCQ", prompt: q.prompt, options: q.options, correctOption: q.correctOption, explanation: q.explanation, points: pts[i]! }
        : { type: "SHORT", prompt: q.prompt, acceptedAnswers: q.acceptedAnswers, explanation: q.explanation, points: pts[i]! },
    );
    return { title: content.data.title, instructions: content.data.instructions, questions };
  }
  if (content.kind === "essay") {
    const questions: ExamQuestion[] = content.data.questions.map((q) => ({ type: "ESSAY", prompt: q.prompt, sampleAnswer: q.sampleAnswer, rubric: q.rubric, points: essayPoints(q) }));
    return { title: content.data.title, instructions: content.data.instructions, questions };
  }
  return null;
}

/** Kiểm tra lại JSON (từ AI hoặc gửi lại từ trình duyệt khi lưu) và loại câu hỏng. Ném DomainError nếu không còn câu nào dùng được. */
export function normalizeContent(kind: GenerateKind, raw: unknown): GeneratedContent {
  const parsed = SCHEMAS[kind].safeParse(raw);
  if (!parsed.success) throw new DomainError("AI_BAD_OUTPUT", "Nội dung chưa đúng khuôn mẫu. Vui lòng tạo lại.");
  const data = parsed.data;
  switch (kind) {
    case "quiz": {
      const quiz = cleanQuiz(data as never);
      if (quiz.questions.length === 0) throw new DomainError("AI_BAD_OUTPUT", "AI không tạo được câu trắc nghiệm hợp lệ nào. Vui lòng tạo lại.");
      return { kind, data: quiz };
    }
    case "exercises": {
      const ex = cleanExercises(data as never);
      if (ex.questions.length === 0) throw new DomainError("AI_BAD_OUTPUT", "AI không tạo được câu hỏi hợp lệ nào. Vui lòng tạo lại.");
      return { kind, data: ex };
    }
    default:
      return { kind, data } as GeneratedContent;
  }
}
