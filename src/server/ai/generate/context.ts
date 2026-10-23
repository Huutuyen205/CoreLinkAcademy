// Bối cảnh một buổi học để đưa cho AI: CHỈ dữ liệu giảng dạy (khóa, khung chương trình, nhật ký, tài liệu), không có dữ liệu học sinh.
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { documentVisibilityWhere } from "@/server/documents/access";
import { ForbiddenError } from "@/server/errors";
import { subjectGroupOf, type SubjectGroup } from "./samples";

export type SessionContext = {
  sessionId: string;
  classId: string;
  classCode: string;
  isClassOwner: boolean;
  courseTitle: string;
  subjectId: string;
  subjectName: string;
  group: SubjectGroup;
  gradeFrom: number;
  gradeTo: number;
  level: string;
  sessionIndex: number;
  totalSessions: number;
  sessionMinutes: number;
  startsAt: Date;
  endsAt: Date;
  /** Mục khung chương trình ứng với buổi (chỉ khi khung có đúng `totalSessions` mục). */
  syllabusItem: { title: string; detail: string } | null;
  outcomes: string[];
  lessonContent: string | null;
  homework: string | null;
  note: string | null;
  documents: { kind: string; title: string; description: string | null }[];
};

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Giáo viên dạy buổi này (phụ trách lớp hoặc dạy thay). Sai phạm vi → ForbiddenError (→ 404). */
export async function loadSessionContext(actor: Actor, sessionId: string): Promise<SessionContext> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const s = await db.classSession.findFirst({
    where: { id: sessionId, status: { not: "CANCELLED" }, OR: [{ teacherId: actor.id }, { class: { teacherId: actor.id } }] },
    select: {
      id: true,
      index: true,
      startsAt: true,
      endsAt: true,
      lessonContent: true,
      homework: true,
      note: true,
      classId: true,
      class: {
        select: {
          code: true,
          teacherId: true,
          totalSessions: true,
          course: { select: { title: true, subjectId: true, gradeFrom: true, gradeTo: true, level: true, sessionMinutes: true, outcomes: true, syllabus: true, subject: { select: { name: true } } } },
        },
      },
    },
  });
  if (!s) throw new ForbiddenError();

  const docs = await db.document.findMany({
    where: { AND: [documentVisibilityWhere(actor), { OR: [{ sessionId }, { shares: { some: { classId: s.classId } } }] }] },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { kind: true, title: true, description: true },
  });

  const c = s.class.course;
  const syllabus = Array.isArray(c.syllabus) ? (c.syllabus as { title?: unknown; detail?: unknown }[]) : [];
  const item = syllabus.length === s.class.totalSessions ? syllabus[s.index - 1] : undefined;
  return {
    sessionId: s.id,
    classId: s.classId,
    classCode: s.class.code,
    isClassOwner: s.class.teacherId === actor.id,
    courseTitle: c.title,
    subjectId: c.subjectId,
    subjectName: c.subject.name,
    group: subjectGroupOf(c.subject.name),
    gradeFrom: c.gradeFrom,
    gradeTo: c.gradeTo,
    level: c.level,
    sessionIndex: s.index,
    totalSessions: s.class.totalSessions,
    sessionMinutes: c.sessionMinutes,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    syllabusItem: item && typeof item.title === "string" ? { title: item.title, detail: typeof item.detail === "string" ? item.detail : "" } : null,
    outcomes: asStrings(c.outcomes),
    lessonContent: s.lessonContent,
    homework: s.homework,
    note: s.note,
    documents: docs.map((d) => ({ kind: d.kind, title: d.title, description: d.description })),
  };
}

/** Buổi dạy gần đây/sắp tới của giáo viên để chọn trong form (14 ngày qua, 45 ngày tới). */
export async function listTeachableSessions(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const day = 86_400_000;
  return db.classSession.findMany({
    where: {
      OR: [{ teacherId: actor.id }, { class: { teacherId: actor.id } }],
      status: { not: "CANCELLED" },
      startsAt: { gte: new Date(Date.now() - 14 * day), lte: new Date(Date.now() + 45 * day) },
    },
    orderBy: { startsAt: "asc" },
    take: 200,
    select: { id: true, index: true, startsAt: true, class: { select: { code: true, course: { select: { title: true } } } } },
  });
}
