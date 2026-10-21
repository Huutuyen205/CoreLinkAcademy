import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/session";
import { deleteSubject } from "@/server/catalog/admin";
import { db } from "@/server/db";
import { cleanup, createCatalog, createUser, makeTag, randomPhone } from "@/test/fixtures";
import { addDays } from "@/lib/schedule";
import { vnDateKey } from "@/lib/time";
import { cancelSession, createClass, enrollStudent } from "./service";

const tag = makeTag();
let admin: Actor;
let teacher: Actor;
let catalog: Awaited<ReturnType<typeof createCatalog>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)("đào tạo + danh mục — integration", () => {
  beforeAll(async () => {
    admin = await createUser(tag, "ADMIN");
    teacher = await createUser(tag, "TEACHER");
    catalog = await createCatalog(tag);
  });
  afterAll(() => cleanup(tag));

  const base = () => ({
    courseId: catalog.course.id,
    teacherId: teacher.id,
    roomId: null,
    startDate: addDays(vnDateKey(new Date()), 30),
    weekdays: [1],
    startTime: "18:00",
    endTime: "19:30",
    totalSessions: 3,
    capacity: 10,
  });

  it("TC-015 mở lớp trùng giáo viên → SCHEDULE_CONFLICT kèm danh sách, không tạo lớp", async () => {
    await createClass(admin, { ...base(), code: `${tag.toUpperCase()}-1` });
    const code = `${tag.toUpperCase()}-2`;
    await expect(createClass(admin, { ...base(), code, startTime: "18:30", endTime: "20:00" })).rejects.toMatchObject({
      code: "SCHEDULE_CONFLICT",
      details: expect.arrayContaining([expect.stringContaining("Giáo viên đã có lớp")]),
    });
    expect(await db.class.count({ where: { code } })).toBe(0);
  });

  it("TC-047 hủy buổi → CANCELLED + lý do + audit session.cancel", async () => {
    const classId = await createClass(admin, { ...base(), code: `${tag.toUpperCase()}-3`, weekdays: [3] });
    const session = await db.classSession.findFirstOrThrow({ where: { classId }, orderBy: { index: "asc" } });
    await cancelSession(admin, session.id, "Giáo viên ốm");
    expect(await db.classSession.findUniqueOrThrow({ where: { id: session.id } })).toMatchObject({ status: "CANCELLED", cancelReason: "Giáo viên ốm" });
    expect(await db.auditLog.count({ where: { action: "session.cancel", entityId: session.id } })).toBe(1);
    await expect(cancelSession(admin, session.id, "Lần hai")).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("TC-044 ghi danh học sinh bị khóa → STUDENT_DISABLED", async () => {
    const classId = await createClass(admin, { ...base(), code: `${tag.toUpperCase()}-4`, weekdays: [5] });
    const disabled = await createUser(tag, "STUDENT", { status: "DISABLED" });
    await expect(enrollStudent(admin, classId, disabled.id)).rejects.toMatchObject({ code: "STUDENT_DISABLED" });
  });

  it("TC-041 xóa môn có khóa → HAS_COURSES; môn trống → xóa, lead bỏ tham chiếu", async () => {
    await expect(deleteSubject(admin, catalog.subject.id)).rejects.toMatchObject({ code: "HAS_COURSES" });

    const empty = await db.subject.create({ data: { name: `Trống ${tag}`, slug: `trong-${tag}`, description: "" } });
    const lead = await db.lead.create({ data: { parentName: `PH ${tag}`, phone: randomPhone(), studentName: "HS", subjectId: empty.id } });
    await deleteSubject(admin, empty.id);
    expect(await db.subject.findUnique({ where: { id: empty.id } })).toBeNull();
    expect((await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).subjectId).toBeNull();
  });
});
