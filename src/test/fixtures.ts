// Dữ liệu cho integration test: mọi bản ghi gắn `tag` ngẫu nhiên để dọn đúng phần mình tạo.
import { randomBytes, randomInt } from "node:crypto";
import type { Role } from "@prisma/client";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";

export function makeTag(): string {
  return `it${randomBytes(4).toString("hex")}`;
}

/** SĐT di động hợp lệ (BR-001), ngẫu nhiên để không đụng dữ liệu khác. */
export function randomPhone(): string {
  return `+849${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
}

export async function createUser(tag: string, role: Role, extra: { status?: "ACTIVE" | "DISABLED" } = {}): Promise<Actor> {
  const u = await db.user.create({
    data: {
      email: `${role.toLowerCase()}.${randomBytes(3).toString("hex")}@${tag}.int.test`,
      phone: randomPhone(),
      fullName: `${role} ${tag}`,
      passwordHash: "x",
      role,
      status: extra.status ?? "ACTIVE",
      gradeLevel: role === "STUDENT" ? 9 : null,
    },
  });
  return { id: u.id, role: u.role, fullName: u.fullName, mustChangePassword: false, avatarFileId: null };
}

export async function createCatalog(tag: string) {
  const subject = await db.subject.create({ data: { name: `Môn ${tag}`, slug: `mon-${tag}`, description: "test" } });
  const course = await db.course.create({
    data: {
      subjectId: subject.id,
      title: `Khóa ${tag}`,
      slug: `khoa-${tag}`,
      summary: "Khóa dùng cho integration test.",
      description: "Khóa dùng cho integration test.",
      gradeFrom: 6,
      gradeTo: 9,
      level: "Cơ bản",
      totalSessions: 4,
      sessionMinutes: 90,
      outcomes: [],
      syllabus: [],
      isPublished: true,
    },
  });
  const room = await db.room.create({ data: { name: `P-${tag}`, capacity: 20 } });
  return { subject, course, room };
}

/** Xóa mọi dữ liệu gắn `tag` theo thứ tự khóa ngoại. */
export async function cleanup(tag: string): Promise<void> {
  const users = await db.user.findMany({ where: { OR: [{ email: { endsWith: `@${tag}.int.test` } }, { fullName: { contains: tag } }] }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const classes = await db.class.findMany({ where: { code: { startsWith: tag.toUpperCase() } }, select: { id: true } });
  const classIds = classes.map((c) => c.id);
  const leads = await db.lead.findMany({ where: { OR: [{ parentName: { contains: tag } }, { convertedStudentId: { in: userIds } }] }, select: { id: true } });
  const sessionIds = (await db.classSession.findMany({ where: { classId: { in: classIds } }, select: { id: true } })).map((s) => s.id);

  await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { entityId: { in: [...leads.map((l) => l.id), ...sessionIds, ...userIds] } }] } });
  await db.enrollment.deleteMany({ where: { OR: [{ classId: { in: classIds } }, { studentId: { in: userIds } }] } });
  await db.practiceSet.deleteMany({ where: { OR: [{ createdById: { in: userIds } }, { classId: { in: classIds } }] } });
  await db.class.deleteMany({ where: { id: { in: classIds } } });
  await db.lead.deleteMany({ where: { id: { in: leads.map((l) => l.id) } } });
  await db.course.deleteMany({ where: { slug: { contains: tag } } });
  await db.subject.deleteMany({ where: { slug: { contains: tag } } });
  await db.room.deleteMany({ where: { name: { contains: tag } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
}
