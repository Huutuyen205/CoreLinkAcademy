// Ghi danh trong transaction: dùng cho UC-003 (chuyển lead) và UC-006 (ghi danh).
import type { Tx } from "@/server/db";
import { DomainError } from "@/server/errors";
import { findConflicts } from "@/lib/schedule";
import { formatDateTime } from "@/lib/time";
import { checkEnrollment, ENROLL_ERROR_MESSAGES, SEAT_STATUSES } from "./rules";

/** FR-019. Phải gọi bên trong `db.$transaction`. Khóa dòng lớp để hai Staff không cùng lấy chỗ cuối. */
export async function enrollInTx(tx: Tx, classId: string, studentId: string): Promise<void> {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM classes WHERE id = ${classId} FOR UPDATE`;
  if (locked.length === 0) throw new DomainError("NOT_FOUND", "Không tìm thấy lớp.");

  const klass = await tx.class.findUniqueOrThrow({
    where: { id: classId },
    select: {
      status: true,
      capacity: true,
      code: true,
      _count: { select: { enrollments: { where: { status: { in: SEAT_STATUSES } } } } },
    },
  });
  const existing = await tx.enrollment.findUnique({
    where: { classId_studentId: { classId, studentId } },
    select: { id: true, status: true },
  });

  const error = checkEnrollment({
    classStatus: klass.status,
    seatCount: klass._count.enrollments,
    capacity: klass.capacity,
    existingStatus: existing?.status ?? null,
  });
  if (error) throw new DomainError(error, ENROLL_ERROR_MESSAGES[error]);

  const now = new Date();
  const [newSessions, studentSessions] = await Promise.all([
    tx.classSession.findMany({
      where: { classId, status: { not: "CANCELLED" }, endsAt: { gt: now } },
      select: { startsAt: true, endsAt: true },
    }),
    tx.classSession.findMany({
      where: {
        classId: { not: classId },
        status: { not: "CANCELLED" },
        endsAt: { gt: now },
        class: { enrollments: { some: { studentId, status: "ACTIVE" } } },
      },
      select: { startsAt: true, endsAt: true, status: true, class: { select: { code: true } } },
    }),
  ]);
  const conflicts = findConflicts(newSessions, studentSessions);
  if (conflicts.length > 0) {
    const first = conflicts[0]!.existing;
    throw new DomainError(
      "SCHEDULE_CONFLICT",
      `${ENROLL_ERROR_MESSAGES.SCHEDULE_CONFLICT} Ví dụ: lớp ${first.class.code} lúc ${formatDateTime(first.startsAt)} (${conflicts.length} buổi trùng).`,
    );
  }

  if (existing) {
    await tx.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE", enrolledAt: now } });
  } else {
    await tx.enrollment.create({ data: { classId, studentId } });
  }
}
