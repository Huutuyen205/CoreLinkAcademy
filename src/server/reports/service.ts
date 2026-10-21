// Báo cáo – thống kê (Admin §13A — FR-052). Mỗi bảng là MỘT câu SQL gom nhóm theo lớp (DB ở xa, xem docs/21 §10.1).
import { Prisma } from "@prisma/client";
import { assertCan } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";

export type ReportFilter = { from: Date; to: Date; classId?: string; subjectId?: string };

function classFilter(f: ReportFilter) {
  return Prisma.sql`${f.classId ? Prisma.sql`AND c."id" = ${f.classId}` : Prisma.empty} ${f.subjectId ? Prisma.sql`AND co."subjectId" = ${f.subjectId}` : Prisma.empty}`;
}

export type AttendanceRow = { classId: string; code: string; sessions: number; marked: number; present: number; late: number; absent: number; excused: number };
export type ResultRow = { classId: string; code: string; graded: number; avgPct: number | null; minPct: number | null; maxPct: number | null };
export type CompletionRow = { classId: string; code: string; assignments: number; expected: number; submitted: number; late: number };

/** Số liệu tổng quan: học sinh/giáo viên theo trạng thái, lớp theo trạng thái, lead mới trong kỳ. */
export async function summaryCounts(actor: Actor, f: ReportFilter) {
  assertCan(actor, "report.view");
  const [rows] = await db.$queryRaw<
    { students: number; studentsOnLeave: number; studentsInactive: number; teachers: number; classesOpen: number; classesRunning: number; classesDone: number; leads: number; enrolledLeads: number }[]
  >`
    SELECT
      (SELECT count(*)::int FROM "users" WHERE "role" = 'STUDENT' AND "memberStatus" = 'ACTIVE') AS "students",
      (SELECT count(*)::int FROM "users" WHERE "role" = 'STUDENT' AND "memberStatus" = 'ON_LEAVE') AS "studentsOnLeave",
      (SELECT count(*)::int FROM "users" WHERE "role" = 'STUDENT' AND "memberStatus" = 'INACTIVE') AS "studentsInactive",
      (SELECT count(*)::int FROM "users" WHERE "role" = 'TEACHER' AND "memberStatus" = 'ACTIVE' AND "status" = 'ACTIVE') AS "teachers",
      (SELECT count(*)::int FROM "classes" WHERE "status" = 'OPEN') AS "classesOpen",
      (SELECT count(*)::int FROM "classes" WHERE "status" = 'IN_PROGRESS') AS "classesRunning",
      (SELECT count(*)::int FROM "classes" WHERE "status" = 'COMPLETED') AS "classesDone",
      (SELECT count(*)::int FROM "leads" WHERE "createdAt" >= ${f.from} AND "createdAt" < ${f.to}) AS "leads",
      (SELECT count(*)::int FROM "leads" WHERE "createdAt" >= ${f.from} AND "createdAt" < ${f.to} AND "status" = 'ENROLLED') AS "enrolledLeads"`;
  return rows!;
}

/** Chuyên cần theo lớp trong kỳ (buổi không hủy). Tỷ lệ = (có mặt + muộn) / đã điểm danh (BR-032). */
export async function attendanceByClass(actor: Actor, f: ReportFilter): Promise<AttendanceRow[]> {
  assertCan(actor, "report.view");
  return db.$queryRaw<AttendanceRow[]>`
    SELECT c."id" AS "classId", c."code",
      count(DISTINCT s."id")::int AS "sessions",
      count(a."id")::int AS "marked",
      count(a."id") FILTER (WHERE a."status" = 'PRESENT')::int AS "present",
      count(a."id") FILTER (WHERE a."status" = 'LATE')::int AS "late",
      count(a."id") FILTER (WHERE a."status" = 'ABSENT')::int AS "absent",
      count(a."id") FILTER (WHERE a."status" = 'EXCUSED')::int AS "excused"
    FROM "class_sessions" s
    JOIN "classes" c ON c."id" = s."classId"
    JOIN "courses" co ON co."id" = c."courseId"
    LEFT JOIN "attendances" a ON a."sessionId" = s."id"
    WHERE s."status" <> 'CANCELLED' AND s."startsAt" >= ${f.from} AND s."startsAt" < ${f.to} ${classFilter(f)}
    GROUP BY c."id", c."code"
    ORDER BY c."code"`;
}

/** Kết quả học tập: điểm % các bài đã chấm có hạn nộp trong kỳ (tối đa = tổng điểm câu, hoặc điểm tối đa của bài nộp tệp). */
export async function resultsByClass(actor: Actor, f: ReportFilter): Promise<ResultRow[]> {
  assertCan(actor, "report.view");
  const rows = await db.$queryRaw<{ classId: string; code: string; graded: number; avgPct: number | null; minPct: number | null; maxPct: number | null }[]>`
    WITH scored AS (
      SELECT c."id" AS "classId", c."code", sub."score" * 100.0 / NULLIF(COALESCE(NULLIF(q."total", 0), a."manualMaxScore"), 0) AS pct
      FROM "submissions" sub
      JOIN "assignments" a ON a."id" = sub."assignmentId"
      JOIN "classes" c ON c."id" = a."classId"
      JOIN "courses" co ON co."id" = c."courseId"
      LEFT JOIN LATERAL (SELECT sum("points") AS "total" FROM "questions" WHERE "assignmentId" = a."id") q ON true
      WHERE sub."status" = 'GRADED' AND a."dueAt" >= ${f.from} AND a."dueAt" < ${f.to} ${classFilter(f)}
    )
    SELECT "classId", "code", count(pct)::int AS "graded", round(avg(pct))::float AS "avgPct", round(min(pct))::float AS "minPct", round(max(pct))::float AS "maxPct"
    FROM scored GROUP BY "classId", "code" ORDER BY "code"`;
  return rows;
}

/** Tình trạng hoàn thành bài tập: bài đã giao có hạn trong kỳ × học sinh đang/đã học lớp, số đã nộp và nộp muộn. */
export async function completionByClass(actor: Actor, f: ReportFilter): Promise<CompletionRow[]> {
  assertCan(actor, "report.view");
  return db.$queryRaw<CompletionRow[]>`
    SELECT c."id" AS "classId", c."code",
      count(DISTINCT a."id")::int AS "assignments",
      (count(DISTINCT a."id") * (SELECT count(*) FROM "enrollments" e WHERE e."classId" = c."id" AND e."status" IN ('ACTIVE', 'COMPLETED')))::int AS "expected",
      count(sub."id") FILTER (WHERE sub."status" IN ('SUBMITTED', 'GRADED'))::int AS "submitted",
      count(sub."id") FILTER (WHERE sub."isLate")::int AS "late"
    FROM "assignments" a
    JOIN "classes" c ON c."id" = a."classId"
    JOIN "courses" co ON co."id" = c."courseId"
    LEFT JOIN "submissions" sub ON sub."assignmentId" = a."id"
    WHERE a."status" IN ('PUBLISHED', 'CLOSED') AND a."dueAt" >= ${f.from} AND a."dueAt" < ${f.to} ${classFilter(f)}
    GROUP BY c."id", c."code"
    ORDER BY c."code"`;
}

export async function reportFilterOptions(actor: Actor) {
  assertCan(actor, "report.view");
  const [classes, subjects] = await Promise.all([
    db.class.findMany({ orderBy: [{ status: "asc" }, { code: "asc" }], select: { id: true, code: true } }),
    db.subject.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return { classes, subjects };
}
