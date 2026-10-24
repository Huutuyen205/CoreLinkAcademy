// Tự ôn luyện (Học sinh §5 — checklist v4, DECISION-D33): đề luyện tập chấm tự động, kèm lời giải.
// GV/quản lý soạn đề (nháp → mở cho HS). HS lọc đề theo chuyên đề, dạng bài, mức độ; mỗi lần làm là một lượt (lịch sử luyện tập).
// Đáp án và lời giải chỉ trả về sau khi HS nộp lượt làm (giống T-06 của bài tập).
import { Prisma, type PracticeDifficulty, type QuestionType } from "@prisma/client";
import { assertCan } from "@/server/auth/policy";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { figureView } from "@/server/figures/render";
import { notifyUsers } from "@/server/notifications/service";
import { autoGrade, jsonStrings, round2, validateQuestion, type QuestionData } from "@/lib/grading";

export type PracticeSetInput = {
  title: string;
  description: string | null;
  topic: string;
  format: string;
  difficulty: PracticeDifficulty;
  subjectId: string | null;
  levelId: string | null;
  /** Đề bổ sung cho một học sinh của lớp (chỉ người tạo đề mới đặt, không đổi khi sửa). */
  classId?: string | null;
  forStudentId?: string | null;
};

export type PracticeFilter = { q?: string; subjectId?: string; topic?: string; format?: string; difficulty?: PracticeDifficulty };

function filterWhere(f: PracticeFilter): Prisma.PracticeSetWhereInput {
  return {
    ...(f.subjectId ? { subjectId: f.subjectId } : {}),
    ...(f.topic ? { topic: f.topic } : {}),
    ...(f.format ? { format: f.format } : {}),
    ...(f.difficulty ? { difficulty: f.difficulty } : {}),
    ...(f.q ? { OR: [{ title: { contains: f.q, mode: "insensitive" as const } }, { topic: { contains: f.q, mode: "insensitive" as const } }] } : {}),
  };
}

/** Đề HS được thấy: đang mở và là đề chung hoặc đề bổ sung dành riêng cho em. */
function visibleToStudent(studentId: string): Prisma.PracticeSetWhereInput {
  return { isActive: true, OR: [{ forStudentId: null }, { forStudentId: studentId }] };
}

/** Đề người soạn được sửa: quản lý mọi đề; GV đề của mình. */
async function editableSet(actor: Actor, setId: string) {
  assertCan(actor, "practice.author");
  const set = await db.practiceSet.findUnique({ where: { id: setId }, select: { id: true, createdById: true, isActive: true, forStudentId: true, title: true } });
  if (!set || (!isManager(actor) && set.createdById !== actor.id)) throw new ForbiddenError();
  return set;
}

/** Giá trị có sẵn cho bộ lọc (chuyên đề, dạng bài) — chỉ từ đề đang mở với HS, hoặc mọi đề với người soạn. */
export async function practiceFilterOptions(actor: Actor) {
  const where: Prisma.PracticeSetWhereInput = actor.role === "STUDENT" ? visibleToStudent(actor.id) : { forStudentId: null };
  const [topics, formats, subjects, levels] = await Promise.all([
    db.practiceSet.findMany({ where, distinct: ["topic"], orderBy: { topic: "asc" }, select: { topic: true } }),
    db.practiceSet.findMany({ where, distinct: ["format"], orderBy: { format: "asc" }, select: { format: true } }),
    db.subject.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.educationLevel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return { topics: topics.map((t) => t.topic), formats: formats.map((f) => f.format), subjects, levels };
}

/** HS: đề đang mở + kết quả tốt nhất / số lượt của em. Người soạn: mọi đề (GV chỉ thấy đề đang mở của người khác + đề của mình). */
export async function listPracticeSets(actor: Actor, filter: PracticeFilter) {
  const base = filterWhere(filter);
  const scope: Prisma.PracticeSetWhereInput =
    actor.role === "STUDENT"
      ? visibleToStudent(actor.id)
      : isManager(actor)
        ? {}
        : actor.role === "TEACHER"
          ? { OR: [{ isActive: true, forStudentId: null }, { createdById: actor.id }] }
          : { id: "__none__" };
  const rows = await db.practiceSet.findMany({
    where: { AND: [scope, base] },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      topic: true,
      format: true,
      difficulty: true,
      isActive: true,
      createdById: true,
      subject: { select: { name: true } },
      level: { select: { name: true } },
      createdBy: { select: { fullName: true } },
      forStudent: { select: { fullName: true } },
      class: { select: { code: true } },
      _count: { select: { questions: true, attempts: true } },
      ...(actor.role === "STUDENT"
        ? { attempts: { where: { studentId: actor.id }, orderBy: { submittedAt: "desc" as const }, select: { score: true, maxScore: true, submittedAt: true } } }
        : {}),
    },
  });
  return rows.map((r) => {
    const mine = (r as { attempts?: { score: number; maxScore: number; submittedAt: Date }[] }).attempts ?? [];
    const best = mine.reduce<number | null>((b, a) => (a.maxScore > 0 ? Math.max(b ?? 0, a.score / a.maxScore) : b), null);
    return { ...r, canEdit: actor.role !== "STUDENT" && (isManager(actor) || r.createdById === actor.id), myAttempts: mine.length, myBest: best };
  });
}

export async function createPracticeSet(actor: Actor, input: PracticeSetInput): Promise<string> {
  assertCan(actor, "practice.author");
  const { classId = null, forStudentId = null, ...rest } = input;
  if (forStudentId) {
    if (!classId) throw new DomainError("INVALID", "Đề bổ sung cần chọn lớp.");
    const klass = await db.class.findUnique({ where: { id: classId }, select: { teacherId: true } });
    if (!klass || (!isManager(actor) && klass.teacherId !== actor.id)) throw new ForbiddenError();
    const enrolled = await db.enrollment.count({ where: { classId, studentId: forStudentId, status: "ACTIVE" } });
    if (enrolled === 0) throw new DomainError("NOT_ENROLLED", "Học sinh không còn học lớp này.");
  }
  const s = await db.practiceSet.create({ data: { ...rest, classId: forStudentId ? classId : null, forStudentId, createdById: actor.id }, select: { id: true } });
  return s.id;
}

export async function updatePracticeSet(actor: Actor, setId: string, input: PracticeSetInput): Promise<void> {
  await editableSet(actor, setId);
  await db.practiceSet.update({
    where: { id: setId },
    data: { title: input.title, description: input.description, topic: input.topic, format: input.format, difficulty: input.difficulty, subjectId: input.subjectId, levelId: input.levelId },
  });
}

/** Mở cho HS (cần ít nhất một câu) / chuyển về nháp. */
export async function setPracticeActive(actor: Actor, setId: string, active: boolean): Promise<void> {
  await editableSet(actor, setId);
  const set = await editableSet(actor, setId);
  if (active && (await db.practiceQuestion.count({ where: { setId } })) === 0) throw new DomainError("NO_QUESTIONS", "Đề cần ít nhất một câu hỏi trước khi mở cho học sinh.");
  await db.$transaction(async (tx) => {
    await tx.practiceSet.update({ where: { id: setId }, data: { isActive: active } });
    // Đề bổ sung: báo riêng học sinh được giao khi mở lần đầu sau nháp.
    if (active && !set.isActive && set.forStudentId) {
      await notifyUsers(tx, [set.forStudentId], { kind: "assignment", title: "Đề luyện tập bổ sung", body: set.title, link: `/on-luyen/${setId}` });
    }
  });
}

export async function deletePracticeSet(actor: Actor, setId: string): Promise<void> {
  await editableSet(actor, setId);
  await db.practiceSet.delete({ where: { id: setId } });
}

export type PracticeQuestionInput = {
  type: QuestionType;
  prompt: string;
  points: number;
  options: string[] | null;
  correctOption: number | null;
  acceptedAnswers: string[] | null;
  explanation: string | null;
};

/** Thêm/sửa câu: chỉ trắc nghiệm và trả lời ngắn (chấm tự động). Sửa được cả khi đề đang mở (lượt cũ giữ điểm đã chấm). */
export async function savePracticeQuestion(actor: Actor, setId: string, questionId: string | null, input: PracticeQuestionInput, opts: { removeFigure?: boolean } = {}): Promise<void> {
  await editableSet(actor, setId);
  if (input.type === "ESSAY") throw new DomainError("INVALID_TYPE", "Đề luyện tập chỉ gồm câu trắc nghiệm hoặc trả lời ngắn (chấm tự động).", { type: "Chọn trắc nghiệm hoặc trả lời ngắn." });
  const errors = validateQuestion(input);
  if (errors) throw new DomainError("INVALID_QUESTION", "Câu hỏi chưa hợp lệ.", errors);
  const data = {
    type: input.type,
    prompt: input.prompt.trim(),
    points: input.points,
    explanation: input.explanation,
    options: input.type === "MCQ" ? (input.options ?? []).map((o) => o.trim()) : Prisma.DbNull,
    correctOption: input.type === "MCQ" ? input.correctOption : null,
    acceptedAnswers: input.type === "SHORT" ? (input.acceptedAnswers ?? []).map((a) => a.trim()).filter(Boolean) : Prisma.DbNull,
  };
  if (questionId) {
    const { count } = await db.practiceQuestion.updateMany({ where: { id: questionId, setId }, data: opts.removeFigure ? { ...data, figure: Prisma.DbNull } : data });
    if (count === 0) throw new ForbiddenError();
  } else {
    const count = await db.practiceQuestion.count({ where: { setId } });
    await db.practiceQuestion.create({ data: { ...data, setId, order: count + 1 } });
  }
}

export async function deletePracticeQuestion(actor: Actor, setId: string, questionId: string): Promise<void> {
  await editableSet(actor, setId);
  await db.$transaction(async (tx) => {
    const { count } = await tx.practiceQuestion.deleteMany({ where: { id: questionId, setId } });
    if (count === 0) throw new ForbiddenError();
    const rest = await tx.practiceQuestion.findMany({ where: { setId }, orderBy: { order: "asc" }, select: { id: true } });
    for (const [i, q] of rest.entries()) await tx.practiceQuestion.update({ where: { id: q.id }, data: { order: i + 1 } });
  });
}

function toData(q: { id: string; order: number; type: QuestionType; prompt: string; options: Prisma.JsonValue; correctOption: number | null; acceptedAnswers: Prisma.JsonValue; points: number }): QuestionData {
  return { id: q.id, order: q.order, type: q.type, prompt: q.prompt, options: jsonStrings(q.options), correctOption: q.correctOption, acceptedAnswers: jsonStrings(q.acceptedAnswers), points: q.points };
}

/** Người soạn: đề + câu hỏi đầy đủ (có đáp án, lời giải) + thống kê lượt làm. */
export async function getPracticeSetForAuthor(actor: Actor, setId: string) {
  assertCan(actor, "practice.author");
  const set = await db.practiceSet.findUnique({
    where: { id: setId },
    include: {
      subject: { select: { name: true } },
      level: { select: { name: true } },
      createdBy: { select: { fullName: true } },
      forStudent: { select: { fullName: true } },
      class: { select: { code: true } },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
  if (!set) throw new ForbiddenError();
  const canEdit = isManager(actor) || set.createdById === actor.id;
  if (!canEdit && (!set.isActive || set.forStudentId)) throw new ForbiddenError();
  const avg = await db.practiceAttempt.aggregate({ where: { setId }, _avg: { score: true, maxScore: true } });
  return {
    ...set,
    canEdit,
    questions: set.questions.map((q) => ({ ...toData(q), explanation: q.explanation, figure: figureView(q.figure) })),
    avgPercent: avg._avg.maxScore ? round2(((avg._avg.score ?? 0) / avg._avg.maxScore) * 100) : null,
  };
}

/** HS mở đề để làm: câu hỏi KHÔNG kèm đáp án/lời giải. */
export async function openPracticeSet(actor: Actor, setId: string) {
  assertCan(actor, "practice.take");
  const set = await db.practiceSet.findFirst({
    where: { id: setId, ...visibleToStudent(actor.id) },
    include: { subject: { select: { name: true } }, level: { select: { name: true } }, questions: { orderBy: { order: "asc" } } },
  });
  if (!set) throw new ForbiddenError();
  const attempts = await db.practiceAttempt.findMany({ where: { setId, studentId: actor.id }, orderBy: { submittedAt: "desc" }, take: 20, select: { id: true, score: true, maxScore: true, correctCount: true, total: true, submittedAt: true } });
  return {
    set: { id: set.id, title: set.title, description: set.description, topic: set.topic, format: set.format, difficulty: set.difficulty, subject: set.subject, level: set.level },
    questions: set.questions.map((q) => ({ id: q.id, order: q.order, type: q.type, prompt: q.prompt, options: jsonStrings(q.options), points: q.points, figure: figureView(q.figure) })),
    attempts,
  };
}

/** HS nộp lượt làm: chấm ngay, lưu câu trả lời. Trả id lượt làm. */
export async function submitPracticeAttempt(actor: Actor, setId: string, raw: Record<string, string>): Promise<string> {
  assertCan(actor, "practice.take");
  const set = await db.practiceSet.findFirst({ where: { id: setId, ...visibleToStudent(actor.id) }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!set || set.questions.length === 0) throw new ForbiddenError();
  const answers: Record<string, string> = {};
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  for (const q of set.questions.map(toData)) {
    let value = (raw[q.id] ?? "").slice(0, 500).trim();
    if (q.type === "MCQ" && value !== "") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n >= (q.options?.length ?? 0)) value = "";
    }
    answers[q.id] = value;
    const pts = autoGrade(q, value || null) ?? 0;
    score += pts;
    maxScore += q.points;
    if (pts > 0 && pts >= q.points) correct += 1;
  }
  const a = await db.practiceAttempt.create({
    data: { setId, studentId: actor.id, answers, score: round2(score), maxScore: round2(maxScore), correctCount: correct, total: set.questions.length },
    select: { id: true },
  });
  return a.id;
}

/** Kết quả một lượt: câu trả lời của em, đáp án đúng, lời giải. Chỉ chủ lượt làm. */
export async function getPracticeAttempt(actor: Actor, attemptId: string) {
  assertCan(actor, "practice.take");
  const a = await db.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: { set: { include: { subject: { select: { name: true } }, questions: { orderBy: { order: "asc" } } } } },
  });
  if (!a || a.studentId !== actor.id) throw new ForbiddenError();
  const given = (a.answers ?? {}) as Record<string, string>;
  return {
    attempt: { id: a.id, score: a.score, maxScore: a.maxScore, correctCount: a.correctCount, total: a.total, submittedAt: a.submittedAt },
    set: { id: a.set.id, title: a.set.title, topic: a.set.topic, isActive: a.set.isActive, subject: a.set.subject },
    items: a.set.questions.map((q) => {
      const data = toData(q);
      const response = given[q.id] ?? "";
      const points = autoGrade(data, response || null) ?? 0;
      return { question: data, figure: figureView(q.figure), explanation: q.explanation, response, correct: points >= data.points && points > 0 };
    }),
  };
}

/** Lịch sử luyện tập của HS (HS §5). */
export async function listMyPracticeHistory(actor: Actor) {
  assertCan(actor, "practice.take");
  return db.practiceAttempt.findMany({
    where: { studentId: actor.id },
    orderBy: { submittedAt: "desc" },
    take: 200,
    select: { id: true, score: true, maxScore: true, correctCount: true, total: true, submittedAt: true, set: { select: { id: true, title: true, topic: true, difficulty: true } } },
  });
}

/** Đề bổ sung đã giao cho học sinh của một lớp (GV phụ trách lớp hoặc quản lý). */
export async function listClassSupplementalSets(actor: Actor, classId: string) {
  assertCan(actor, "practice.author");
  const klass = await db.class.findUnique({ where: { id: classId }, select: { teacherId: true } });
  if (!klass || (!isManager(actor) && klass.teacherId !== actor.id)) throw new ForbiddenError();
  return db.practiceSet.findMany({
    where: { classId, forStudentId: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, title: true, topic: true, difficulty: true, isActive: true, forStudent: { select: { id: true, fullName: true } }, _count: { select: { questions: true, attempts: true } } },
  });
}
