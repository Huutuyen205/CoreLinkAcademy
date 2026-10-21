// Phạm vi xem giáo trình / tài liệu / giáo án (FR-042, docs/03 §3). Một điều kiện Prisma dùng chung cho danh sách và tải xuống.
import type { Prisma } from "@prisma/client";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";

const LEARNING_ENROLLMENTS = ["ACTIVE", "PAUSED", "COMPLETED"] as const;

/**
 * - Quản lý: mọi tài liệu.
 * - Giáo viên: của mình; giáo trình chung hoặc đúng môn mình dạy; tài liệu chia sẻ cho lớp mình dạy / đúng môn mình dạy. Giáo án người khác: không.
 * - Học sinh: tài liệu đang dùng, cho phép HS xem, được chia sẻ cho lớp mình đang/đã học. Không bao giờ thấy giáo án.
 * - Phụ huynh: như học sinh nhưng theo lớp của con và cờ cho phép PH xem.
 */
export function documentVisibilityWhere(actor: Actor): Prisma.DocumentWhereInput {
  if (isManager(actor)) return {};
  if (actor.role === "TEACHER") {
    const teachesSubject: Prisma.SubjectWhereInput = { courses: { some: { classes: { some: { teacherId: actor.id } } } } };
    const sharedToMyClass: Prisma.DocumentShareListRelationFilter = { some: { class: { teacherId: actor.id } } };
    return {
      OR: [
        { ownerId: actor.id },
        {
          isActive: true,
          OR: [
            { kind: "CURRICULUM", OR: [{ subjectId: null }, { subject: teachesSubject }, { shares: sharedToMyClass }] },
            { kind: "MATERIAL", OR: [{ shares: sharedToMyClass }, { subject: teachesSubject }] },
          ],
        },
      ],
    };
  }
  if (actor.role === "STUDENT") {
    return {
      isActive: true,
      kind: { not: "LESSON_PLAN" },
      visibleToStudents: true,
      shares: { some: { class: { enrollments: { some: { studentId: actor.id, status: { in: [...LEARNING_ENROLLMENTS] } } } } } },
    };
  }
  return {
    isActive: true,
    kind: { not: "LESSON_PLAN" },
    visibleToParents: true,
    shares: {
      some: { class: { enrollments: { some: { status: { in: [...LEARNING_ENROLLMENTS] }, student: { parentLinks: { some: { parentId: actor.id } } } } } } },
    },
  };
}

/** Ai được sửa/xóa/chia sẻ tài liệu: quản lý, hoặc giáo viên là chủ (giáo trình chỉ quản lý). */
export function canManageDocument(actor: Actor, doc: { ownerId: string; kind: string }): boolean {
  if (isManager(actor)) return true;
  return actor.role === "TEACHER" && doc.ownerId === actor.id && doc.kind !== "CURRICULUM";
}
