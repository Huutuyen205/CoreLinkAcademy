// Đọc dữ liệu công khai: chỉ môn và khóa đã xuất bản (FR-001..FR-003). Không cần đăng nhập.
import type { Prisma } from "@prisma/client";
import { cached, CACHE_TAGS } from "@/server/cache";
import { db } from "@/server/db";

export type CatalogFilter = { subjectSlug?: string; grade?: number };

/** Đọc `?mon=&khoi=` một cách an toàn; giá trị sai bị bỏ qua. */
export function parseCatalogFilter(params: { mon?: string | string[]; khoi?: string | string[] }): CatalogFilter {
  const mon = typeof params.mon === "string" && /^[a-z0-9-]{1,80}$/.test(params.mon) ? params.mon : undefined;
  const k = typeof params.khoi === "string" ? Number(params.khoi) : NaN;
  const grade = Number.isInteger(k) && k >= 1 && k <= 12 ? k : undefined;
  return { subjectSlug: mon, grade };
}

/** FR-002: khóa của môn đó có `gradeFrom ≤ khối ≤ gradeTo`. */
export function publishedCourseWhere(filter: CatalogFilter): Prisma.CourseWhereInput {
  return {
    isPublished: true,
    ...(filter.subjectSlug ? { subject: { slug: filter.subjectSlug } } : {}),
    ...(filter.grade ? { gradeFrom: { lte: filter.grade }, gradeTo: { gte: filter.grade } } : {}),
  };
}

const courseCard = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  gradeFrom: true,
  gradeTo: true,
  level: true,
  totalSessions: true,
  sessionMinutes: true,
  tuitionVnd: true,
  subject: { select: { name: true, slug: true } },
} satisfies Prisma.CourseSelect;

export type CourseCardData = Prisma.CourseGetPayload<{ select: typeof courseCard }>;

export function querySubjects() {
  // Môn ngừng sử dụng (Admin §1) không hiện ở bộ lọc công khai và form học thử.
  return db.subject.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

/** Danh sách môn dùng ở bộ lọc công khai và quản lý — cache, vô hiệu khi lưu/xóa môn/khóa (CACHE_TAGS.subjects). */
export const listSubjects = cached(querySubjects, "subjects:list", { tags: [CACHE_TAGS.subjects], revalidate: 3600 });

/** Môn có ít nhất một khóa đã xuất bản. */
export function listSubjectsWithCourses() {
  return db.subject.findMany({
    where: { isActive: true, courses: { some: { isPublished: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { courses: { where: { isPublished: true } } } } },
  });
}

export function listPublishedCourses(filter: CatalogFilter = {}) {
  return db.course.findMany({
    where: publishedCourseWhere(filter),
    orderBy: [{ subject: { sortOrder: "asc" } }, { gradeFrom: "asc" }, { title: "asc" }],
    select: courseCard,
  });
}

export function listFeaturedCourses(take = 3) {
  return db.course.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { updatedAt: "desc" },
    take,
    select: courseCard,
  });
}

/** FR-003: khóa chưa xuất bản → null (trang trả 404). Kèm lớp đang tuyển (OPEN). */
export async function getPublishedCourse(slug: string) {
  const course = await db.course.findFirst({
    where: { slug, isPublished: true },
    include: {
      subject: { select: { name: true, slug: true } },
      classes: {
        where: { status: "OPEN" },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          code: true,
          startDate: true,
          weekdays: true,
          startTime: true,
          endTime: true,
          capacity: true,
          _count: { select: { enrollments: { where: { status: { in: ["ACTIVE", "PAUSED"] } } } } },
        },
      },
    },
  });
  if (!course) return null;
  return {
    ...course,
    outcomes: asStringArray(course.outcomes),
    syllabus: asSyllabus(course.syllabus),
  };
}

export function asStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function asSyllabus(value: Prisma.JsonValue): { title: string; detail: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object" && !Array.isArray(item) && typeof item.title === "string"
      ? [{ title: item.title, detail: typeof item.detail === "string" ? item.detail : "" }]
      : [],
  );
}
