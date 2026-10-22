// Quản trị danh mục (FR-015, FR-016) — chỉ ADMIN.
import { writeAudit } from "@/server/audit/log";
import { assertCan } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { isForeignKeyViolation, isUniqueViolation } from "@/server/users/credentials";

export type SubjectInput = { name: string; slug: string; description: string; sortOrder: number; isActive: boolean; levelIds: string[] };

export type CourseInput = {
  subjectId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  gradeFrom: number;
  gradeTo: number;
  level: string;
  totalSessions: number;
  sessionMinutes: number;
  tuitionVnd: number | null;
  outcomes: string[];
  syllabus: { title: string; detail: string }[];
  isPublished: boolean;
  isFeatured: boolean;
};

const duplicateSlug = () => new DomainError("DUPLICATE_SLUG", "Đường dẫn (slug) đã được dùng.", { slug: "Slug đã tồn tại." });

export async function listSubjectsAdmin(actor: Actor, q?: string) {
  assertCan(actor, "catalog.manage");
  const query = q?.trim();
  return db.subject.findMany({
    where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] } : {},
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { courses: true } }, levels: { select: { levelId: true, level: { select: { name: true, sortOrder: true } } } } },
  });
}

/** API-010 + Admin §1: thông tin môn, ngừng sử dụng, liên kết cấp học (thay toàn bộ liên kết trong một transaction). */
export async function saveSubject(actor: Actor, id: string | null, input: SubjectInput): Promise<void> {
  assertCan(actor, "catalog.manage");
  const { levelIds, ...data } = input;
  try {
    await db.$transaction(async (tx) => {
      const subject = id ? await tx.subject.update({ where: { id }, data, select: { id: true } }) : await tx.subject.create({ data, select: { id: true } });
      const levels = levelIds.length ? await tx.educationLevel.findMany({ where: { id: { in: levelIds } }, select: { id: true } }) : [];
      await tx.subjectLevel.deleteMany({ where: { subjectId: subject.id } });
      if (levels.length) await tx.subjectLevel.createMany({ data: levels.map((l) => ({ subjectId: subject.id, levelId: l.id })) });
    });
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw duplicateSlug();
    throw error;
  }
}

/** API-022 — FR-015, BR-050: môn đang có khóa không xóa được; lead tham chiếu → null (FK SET NULL). */
export async function deleteSubject(actor: Actor, id: string): Promise<void> {
  assertCan(actor, "catalog.manage");
  const subject = await db.subject.findUnique({ where: { id }, select: { _count: { select: { courses: true } } } });
  if (!subject) throw new ForbiddenError();
  const hasCourses = () => new DomainError("HAS_COURSES", "Môn đang có khóa học nên không xóa được.");
  if (subject._count.courses > 0) throw hasCourses();
  try {
    await db.$transaction(async (tx) => {
      const deleted = await tx.subject.delete({ where: { id }, select: { slug: true } });
      await writeAudit({ actorId: actor.id, action: "subject.delete", entity: "Subject", entityId: id, detail: { slug: deleted.slug } }, tx);
    });
  } catch (error) {
    // Vừa có khóa học được thêm vào môn giữa lúc kiểm tra và xóa (FK RESTRICT).
    if (isForeignKeyViolation(error)) throw hasCourses();
    throw error;
  }
}

export async function listCoursesAdmin(actor: Actor) {
  assertCan(actor, "catalog.manage");
  return db.course.findMany({
    orderBy: [{ subject: { sortOrder: "asc" } }, { title: "asc" }],
    select: { id: true, title: true, slug: true, isPublished: true, isFeatured: true, gradeFrom: true, gradeTo: true, subject: { select: { name: true } }, _count: { select: { classes: true } } },
  });
}

export async function getCourseAdmin(actor: Actor, id: string) {
  assertCan(actor, "catalog.manage");
  const course = await db.course.findUnique({ where: { id }, include: { _count: { select: { classes: true } } } });
  if (!course) throw new ForbiddenError();
  return course;
}

/** API-010 — FR-015: slug duy nhất. */
export async function saveCourse(actor: Actor, id: string | null, input: CourseInput): Promise<string> {
  assertCan(actor, "catalog.manage");
  const subject = await db.subject.findUnique({ where: { id: input.subjectId }, select: { id: true } });
  if (!subject) throw new DomainError("INVALID", "Môn học không hợp lệ.", { subjectId: "Chọn môn." });
  try {
    if (id) {
      await db.course.update({ where: { id }, data: input });
      return id;
    }
    return (await db.course.create({ data: input })).id;
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw duplicateSlug();
    throw error;
  }
}

/** FR-015: khóa đang có lớp không xóa được (chỉ ẩn). */
export async function deleteCourse(actor: Actor, id: string): Promise<void> {
  assertCan(actor, "catalog.manage");
  const course = await db.course.findUnique({ where: { id }, select: { _count: { select: { classes: true } } } });
  if (!course) throw new ForbiddenError();
  const hasClasses = () => new DomainError("HAS_CLASSES", "Khóa đã có lớp nên không xóa được. Hãy tắt xuất bản để ẩn khóa.");
  if (course._count.classes > 0) throw hasClasses();
  try {
    await db.$transaction([
      db.lead.updateMany({ where: { courseId: id }, data: { courseId: null } }),
      db.course.delete({ where: { id } }),
      db.auditLog.create({ data: { actorId: actor.id, action: "course.delete", entity: "Course", entityId: id } }),
    ]);
  } catch (error) {
    if (isForeignKeyViolation(error)) throw hasClasses();
    throw error;
  }
}

export async function listRoomsAdmin(actor: Actor) {
  assertCan(actor, "room.manage");
  return db.room.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { classes: true, sessions: true } } } });
}

/** API-010 — FR-016: tên phòng duy nhất. */
export async function saveRoom(actor: Actor, id: string | null, input: { name: string; capacity: number; isActive: boolean; note: string | null }): Promise<void> {
  assertCan(actor, "room.manage");
  try {
    if (id) await db.room.update({ where: { id }, data: input });
    else await db.room.create({ data: input });
  } catch (error) {
    if (isUniqueViolation(error, "name")) throw new DomainError("DUPLICATE_NAME", "Tên phòng đã tồn tại.", { name: "Tên phòng đã tồn tại." });
    throw error;
  }
}

export async function deleteRoom(actor: Actor, id: string): Promise<void> {
  assertCan(actor, "room.manage");
  const room = await db.room.findUnique({ where: { id }, select: { _count: { select: { classes: true, sessions: true } } } });
  if (!room) throw new ForbiddenError();
  const inUse = () => new DomainError("IN_USE", "Phòng đang được dùng cho lớp/buổi học nên không xóa được.");
  if (room._count.classes + room._count.sessions > 0) throw inUse();
  try {
    await db.$transaction([
      db.room.delete({ where: { id } }),
      db.auditLog.create({ data: { actorId: actor.id, action: "room.delete", entity: "Room", entityId: id } }),
    ]);
  } catch (error) {
    if (isForeignKeyViolation(error)) throw inUse();
    throw error;
  }
}

/* ───────────── Cấp học (Admin §1 — FR-036) ───────────── */

export type LevelInput = { name: string; gradeFrom: number; gradeTo: number; description: string | null; sortOrder: number; isActive: boolean };

export async function listLevelsAdmin(actor: Actor) {
  assertCan(actor, "level.manage");
  return db.educationLevel.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { subjects: { select: { subject: { select: { name: true } } } }, _count: { select: { documents: true } } },
  });
}

export async function saveLevel(actor: Actor, id: string | null, input: LevelInput): Promise<void> {
  assertCan(actor, "level.manage");
  if (input.gradeTo < input.gradeFrom) throw new DomainError("INVALID_RANGE", "Khối kết thúc phải lớn hơn hoặc bằng khối bắt đầu.", { gradeTo: "Phải lớn hơn hoặc bằng khối bắt đầu." });
  try {
    if (id) await db.educationLevel.update({ where: { id }, data: input });
    else await db.educationLevel.create({ data: input });
  } catch (error) {
    if (isUniqueViolation(error, "name")) throw new DomainError("DUPLICATE_NAME", "Tên cấp học đã tồn tại.", { name: "Tên cấp học đã tồn tại." });
    throw error;
  }
}

/** Xóa cấp học khi chưa có môn và tài liệu gắn vào (còn dùng → "ngừng sử dụng"). */
export async function deleteLevel(actor: Actor, id: string): Promise<void> {
  assertCan(actor, "level.manage");
  const level = await db.educationLevel.findUnique({ where: { id }, select: { name: true, _count: { select: { subjects: true, documents: true } } } });
  if (!level) throw new ForbiddenError();
  if (level._count.subjects + level._count.documents > 0) throw new DomainError("IN_USE", "Cấp học đang có môn/tài liệu gắn vào — hãy bỏ chọn ở các môn hoặc dùng \"Ngừng\".");
  await db.$transaction(async (tx) => {
    await tx.educationLevel.delete({ where: { id } });
    await writeAudit({ actorId: actor.id, action: "level.delete", entity: "EducationLevel", entityId: id, detail: { name: level.name } }, tx);
  });
}

export type CatalogToggleKind = "subject" | "level" | "room" | "course";

/** Nút nhanh "Ngừng / Dùng lại" (môn, cấp học, phòng) và "Ẩn / Xuất bản" (khóa học). */
export async function setCatalogActive(actor: Actor, kind: CatalogToggleKind, id: string, active: boolean): Promise<void> {
  assertCan(actor, kind === "room" ? "room.manage" : kind === "level" ? "level.manage" : "catalog.manage");
  const where = { id };
  const { count } =
    kind === "subject"
      ? await db.subject.updateMany({ where, data: { isActive: active } })
      : kind === "level"
        ? await db.educationLevel.updateMany({ where, data: { isActive: active } })
        : kind === "room"
          ? await db.room.updateMany({ where, data: { isActive: active } })
          : await db.course.updateMany({ where, data: { isPublished: active } });
  if (count === 0) throw new ForbiddenError();
}
