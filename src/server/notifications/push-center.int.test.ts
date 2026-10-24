import { afterAll, describe, expect, it } from "vitest";
import { saveAttendance } from "@/server/attendance/service";
import { db } from "@/server/db";
import { sendUpcomingSessionReminders } from "@/server/notifications/reminders";
import { submitTrialRequest } from "@/server/leads/service";
import { cleanup, createCatalog, createUser, makeTag, randomPhone } from "@/test/fixtures";

const tag = makeTag();

describe.skipIf(!process.env.TEST_DATABASE_URL)("thông báo đẩy: sắp đến giờ, điểm danh, lead mới — integration", () => {
  afterAll(() => cleanup(tag));

  it("nhắc sắp đến giờ: GV/HS/PH một lần, em có đơn nghỉ được duyệt thì không nhắc, chạy lại không trùng", async () => {
    const teacher = await createUser(tag, "TEACHER");
    const s1 = await createUser(tag, "STUDENT");
    const s2 = await createUser(tag, "STUDENT");
    const p1 = await createUser(tag, "PARENT");
    const p2 = await createUser(tag, "PARENT");
    const { course } = await createCatalog(tag);
    await db.guardianship.createMany({ data: [{ parentId: p1.id, studentId: s1.id }, { parentId: p2.id, studentId: s2.id }] });
    const klass = await db.class.create({
      data: { code: `${tag.toUpperCase()}-N`, courseId: course.id, teacherId: teacher.id, startDate: new Date(), weekdays: "1", startTime: "10:00", endTime: "11:00", totalSessions: 2, capacity: 10, status: "IN_PROGRESS" },
    });
    await db.enrollment.createMany({ data: [{ classId: klass.id, studentId: s1.id }, { classId: klass.id, studentId: s2.id }] });
    const now = new Date();
    const soon = await db.classSession.create({ data: { classId: klass.id, index: 1, startsAt: new Date(now.getTime() + 30 * 60_000), endsAt: new Date(now.getTime() + 90 * 60_000), teacherId: teacher.id } });
    await db.classSession.create({ data: { classId: klass.id, index: 2, startsAt: new Date(now.getTime() + 5 * 3600_000), endsAt: new Date(now.getTime() + 6 * 3600_000), teacherId: teacher.id } });
    await db.leaveRequest.create({ data: { sessionId: soon.id, studentId: s2.id, requestedById: p2.id, reason: "Ốm", status: "APPROVED" } });

    const first = await sendUpcomingSessionReminders(now);
    expect(first.sessions).toBe(1);
    const got = async (id: string) => db.notification.findMany({ where: { userId: id, kind: "session_soon" } });
    expect(await got(teacher.id)).toHaveLength(1);
    expect(await got(s1.id)).toHaveLength(1);
    expect(await got(p1.id)).toHaveLength(1);
    expect(await got(s2.id)).toHaveLength(0);
    expect(await got(p2.id)).toHaveLength(0);

    await sendUpcomingSessionReminders(now);
    expect(await got(s1.id)).toHaveLength(1);
    expect(await got(teacher.id)).toHaveLength(1);
  });

  it("điểm danh: HS + PH được báo khi mới ghi hoặc đổi trạng thái, lưu lại y nguyên không báo lặp", async () => {
    const teacher = await createUser(tag, "TEACHER");
    const st = await createUser(tag, "STUDENT");
    const par = await createUser(tag, "PARENT");
    const { course } = await createCatalog(`${tag}b`);
    await db.guardianship.create({ data: { parentId: par.id, studentId: st.id } });
    const klass = await db.class.create({
      data: { code: `${tag.toUpperCase()}-D`, courseId: course.id, teacherId: teacher.id, startDate: new Date(), weekdays: "1", startTime: "10:00", endTime: "11:00", totalSessions: 1, capacity: 10, status: "IN_PROGRESS" },
    });
    await db.enrollment.create({ data: { classId: klass.id, studentId: st.id } });
    const now = new Date();
    const session = await db.classSession.create({ data: { classId: klass.id, index: 1, startsAt: new Date(now.getTime() - 10 * 60_000), endsAt: new Date(now.getTime() + 50 * 60_000), teacherId: teacher.id } });

    const att = (status: "PRESENT" | "ABSENT") => [{ studentId: st.id, status, note: null }];
    const count = (userId: string) => db.notification.count({ where: { userId, kind: "attendance" } });
    await saveAttendance(teacher, session.id, att("PRESENT"), null);
    expect(await count(st.id)).toBe(1);
    expect(await count(par.id)).toBe(1);
    await saveAttendance(teacher, session.id, att("PRESENT"), null);
    expect(await count(par.id)).toBe(1);
    await saveAttendance(teacher, session.id, att("ABSENT"), null);
    expect(await count(par.id)).toBe(2);
    const last = await db.notification.findFirst({ where: { userId: par.id, kind: "attendance" }, orderBy: { createdAt: "desc" }, select: { title: true } });
    expect(last?.title).toContain("vắng mặt");
  });

  it("đăng ký học thử mới → quản lý nhận thông báo; gửi lại cùng SĐT không báo thêm", async () => {
    const admin = await createUser(tag, "ADMIN");
    const staff = await createUser(tag, "STAFF");
    const { subject } = await createCatalog(`${tag}c`);
    const phone = randomPhone();
    const input = { parentName: `Phụ huynh ${tag}`, phone, email: null, studentName: "Bé An", gradeLevel: 7, subjectId: subject.id, courseSlug: null, note: null };
    await submitTrialRequest(input as Parameters<typeof submitTrialRequest>[0]);
    const n = (id: string) => db.notification.count({ where: { userId: id, kind: "lead_new", title: { contains: tag } } });
    expect(await n(admin.id)).toBe(1);
    expect(await n(staff.id)).toBe(1);
    await submitTrialRequest(input as Parameters<typeof submitTrialRequest>[0]);
    expect(await n(admin.id)).toBe(1);
  });
});
