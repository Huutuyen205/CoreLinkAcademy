// Sinh giáo án / slide / giáo trình / đề / bài tập cho MỘT buổi học (DECISION-D34).
// AI trả JSON → Zod kiểm tra → hệ thống đổ vào khuôn mẫu (Word/PowerPoint) hoặc tạo bài tập NHÁP. Không bao giờ tự giao bài.
import { Prisma } from "@prisma/client";
import { validateQuestion } from "@/lib/grading";
import { formatDate } from "@/lib/time";
import { aiStatus, auditAiUse, completeJson, consumeAiQuota, getProvider } from "@/server/ai/client";
import { writeAudit } from "@/server/audit/log";
import { assertTeacherOwnsClass } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { createDocument } from "@/server/documents/service";
import { DomainError } from "@/server/errors";
import { sanitizeFileName } from "@/server/files/rules";
import { loadSessionContext, type SessionContext } from "./context";
import { buildSystemPrompt, buildUserPrompt, resolveTopic, type Difficulty } from "./prompts";
import { render } from "./render";
import { findExcerpts } from "./retrieval";
import { normalizeContent, toExamData } from "./exam";
import { clampCount } from "./rules";
import { KIND_LABELS, SCHEMAS, type GenerateKind, type GeneratedContent } from "./schemas";

const DAY_MS = 86_400_000;
const DEFAULT_COUNTS: Record<GenerateKind, number> = { lesson_plan: 1, slides: 1, curriculum: 1, quiz: 10, exercises: 8, essay: 3 };

export type GenerateInput = { sessionId: string; kind: GenerateKind; topic: string; count: number | null; difficulty: Difficulty; notes: string };

export type GenerateResult = {
  sessionId: string;
  topic: string;
  content: GeneratedContent;
  /** true = dữ liệu mẫu cố định (chưa nối AI thật) — giao diện phải ghi rõ. */
  mock: boolean;
  provider: string;
  model: string;
};

export async function generateContent(actor: Actor, input: GenerateInput): Promise<GenerateResult> {
  const ctx = await loadSessionContext(actor, input.sessionId);
  if (input.kind === "essay" && ctx.group === "other") {
    throw new DomainError("ESSAY_SUBJECT", "Đề tự luận có đáp án mẫu hiện chỉ hỗ trợ môn Toán và Tiếng Anh. Với môn khác hãy dùng đề trắc nghiệm hoặc bài tập.", { kind: "Chọn loại khác." });
  }
  const provider = getProvider();
  await consumeAiQuota(actor, "generate", provider);

  const count = clampCount(input.count, DEFAULT_COUNTS[input.kind], input.kind === "essay" ? 8 : 30);
  const topic = resolveTopic(ctx, input.topic);
  const opts = { topic: input.topic, count, difficulty: input.difficulty, notes: input.notes };
  // Chỉ vài đoạn tài liệu liên quan nhất (đã lọc quyền) thay vì cả tệp; lỗi truy xuất không chặn việc soạn.
  ctx.excerpts = await findExcerpts(actor, ctx, topic).catch(() => []);
  const result = await completeJson(
    {
      task: input.kind,
      system: buildSystemPrompt(input.kind, ctx),
      user: buildUserPrompt(input.kind, ctx, opts),
      mock: { kind: input.kind, group: ctx.group, topic, courseTitle: ctx.courseTitle, sessionIndex: ctx.sessionIndex, count },
      maxOutputTokens: 7000,
    },
    SCHEMAS[input.kind],
    provider,
  );
  const content = normalizeContent(input.kind, result.data);
  await auditAiUse(actor, "ai.generate", "ClassSession", ctx.sessionId, { ...result, extra: { kind: input.kind } });
  return { sessionId: ctx.sessionId, topic, content, mock: result.mock, provider: result.provider, model: result.model };
}

/* ───────── Lưu kết quả ───────── */

export type SaveMode = "assignment" | "document";
export const EXAM_KINDS: GenerateKind[] = ["quiz", "exercises", "essay"];

const truncate = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

function metaOf(ctx: SessionContext) {
  return { classCode: ctx.classCode, courseTitle: ctx.courseTitle, subjectName: ctx.subjectName, sessionIndex: ctx.sessionIndex, dateLabel: formatDate(ctx.startsAt) };
}

/** Bài tập NHÁP từ đề đã sinh: giáo viên xem, sửa rồi mới giao (FR-027/028). Chỉ giáo viên phụ trách lớp. */
async function saveAsAssignment(actor: Actor, ctx: SessionContext, content: GeneratedContent): Promise<string> {
  const exam = toExamData(content);
  if (!exam) throw new DomainError("NOT_EXAM", "Loại nội dung này không tạo thành bài tập.");
  await assertTeacherOwnsClass(actor, ctx.classId);
  exam.questions.forEach((q, i) => {
    const errors = validateQuestion({
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      options: q.type === "MCQ" ? q.options : null,
      correctOption: q.type === "MCQ" ? q.correctOption : null,
      acceptedAnswers: q.type === "SHORT" ? q.acceptedAnswers : null,
    });
    if (errors) throw new DomainError("INVALID_QUESTION", `Câu ${i + 1} chưa hợp lệ: ${Object.values(errors).join(" ")}`);
  });
  const dueAt = new Date(Math.max(ctx.endsAt.getTime(), Date.now()) + 7 * DAY_MS);
  const isMock = aiStatus().mock;
  return db.$transaction(async (tx) => {
    const a = await tx.assignment.create({
      data: { classId: ctx.classId, createdById: actor.id, title: truncate(exam.title, 200), instructions: truncate(exam.instructions, 5000), dueAt, allowLate: false, acceptsFiles: false, manualMaxScore: null },
      select: { id: true },
    });
    await tx.question.createMany({
      data: exam.questions.map((q, i) => ({
        assignmentId: a.id,
        order: i + 1,
        type: q.type,
        prompt: q.prompt.trim(),
        points: q.points,
        options: q.type === "MCQ" ? q.options.map((o) => o.trim()) : Prisma.DbNull,
        correctOption: q.type === "MCQ" ? q.correctOption : null,
        acceptedAnswers: q.type === "SHORT" ? q.acceptedAnswers : Prisma.DbNull,
      })),
    });
    await writeAudit({ actorId: actor.id, action: "ai.save_assignment", entity: "Assignment", entityId: a.id, detail: { sessionId: ctx.sessionId, kind: content.kind, questions: exam.questions.length, mock: isMock } }, tx);
    return a.id;
  });
}

const DOC_TITLES: Record<GenerateKind, string> = {
  lesson_plan: "Giáo án",
  slides: "Slide",
  curriculum: "Giáo trình",
  quiz: "Đề trắc nghiệm",
  exercises: "Bài tập",
  essay: "Đề tự luận",
};

/** Tài liệu Word/PowerPoint riêng tư của giáo viên (không chia sẻ cho HS/PH) — qua `createDocument` để dùng đúng luật tài liệu. */
async function saveAsDocument(actor: Actor, ctx: SessionContext, content: GeneratedContent): Promise<string> {
  const rendered = await render(content, metaOf(ctx));
  const label = DOC_TITLES[content.kind];
  const title = truncate(`${label} buổi ${ctx.sessionIndex} (${ctx.classCode}) — ${content.data.title}`, 200);
  const id = await createDocument(
    actor,
    {
      kind: content.kind === "lesson_plan" ? "LESSON_PLAN" : "MATERIAL", // giáo trình do quản lý quản lý; bản tóm tắt của GV lưu như tài liệu
      title,
      description: `${KIND_LABELS[content.kind]} tạo bằng trợ lý AI${aiStatus().mock ? " (bản mẫu, chưa phải AI thật)" : ""}. Giáo viên kiểm tra lại trước khi dùng.`,
      url: null,
      subjectId: ctx.subjectId,
      levelId: null,
      sessionId: ctx.sessionId,
      visibleToStudents: false,
      visibleToParents: false,
    },
    [{ fileName: sanitizeFileName(`${label}-${ctx.classCode}-buoi${ctx.sessionIndex}.${rendered.ext}`), mimeType: rendered.mimeType, size: rendered.data.byteLength, data: rendered.data }],
    [],
    { index: false },
  );
  await writeAudit({ actorId: actor.id, action: "ai.save_document", entity: "Document", entityId: id, detail: { sessionId: ctx.sessionId, kind: content.kind } });
  return id;
}

export async function saveGenerated(actor: Actor, input: { sessionId: string; kind: GenerateKind; data: unknown; mode: SaveMode }): Promise<{ mode: SaveMode; id: string }> {
  const ctx = await loadSessionContext(actor, input.sessionId);
  const content = normalizeContent(input.kind, input.data);
  if (input.mode === "assignment") {
    if (!EXAM_KINDS.includes(input.kind)) throw new DomainError("NOT_EXAM", "Chỉ đề trắc nghiệm, bài tập, đề tự luận mới lưu thành bài tập.");
    const id = await saveAsAssignment(actor, ctx, content);
    // Tự luận: đáp án mẫu/thang điểm không có chỗ lưu trong bài tập → giữ bản Word (đề + đáp án) riêng cho giáo viên.
    if (input.kind === "essay") await saveAsDocument(actor, ctx, content);
    return { mode: "assignment", id };
  }
  return { mode: "document", id: await saveAsDocument(actor, ctx, content) };
}
