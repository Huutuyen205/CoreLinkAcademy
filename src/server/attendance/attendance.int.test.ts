import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/session";
import { getSessionForLearner } from "@/server/academic/learner";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { cleanup, createCatalog, createUser, makeTag } from "@/test/fixtures";
import { getSessionForAttendance, getStudentAttendance, saveAttendance, saveEvaluations } from "./service";

const tag = makeTag();

let teacher: Actor, student: Actor, absent: Actor;
let sessionId: string, futureSessionId: string;

describe.skipIf(!process.env.TEST_DATABASE_URL)("Điểm danh đầu giờ và đánh giá cuối buổi (integration)", () => {
  beforeAll(async () => {
    [teacher, student, absent] = await Promise.all([createUser(tag, "TEACHER"), createUser(tag, "STUDENT"), createUser(tag, "STUDENT")]);
    const cat = await createCatalog(tag);
    const klass = await db.class.create({
      data: { code: `${tag.toUpperCase()}-A`, courseId: cat.course.id, teacherId: teacher.id, startDate: new Date(), weekdays: "1,3,5", startTime: "14:00", endTime: "15:30", totalSessions: 4, capacity: 12 },
      select: { id: true },
    });
    await db.enrollment.createMany({
      data: [
        { classId: klass.id, studentId: student.id },
        { classId: klass.id, studentId: absent.id },
      ],
    });
    const now = Date.now();
    const mk = async (index: number, start: number, end: number) =>
      (await db.classSession.create({ data: { classId: klass.id, index, startsAt: new Date(start), endsAt: new Date(end), teacherId: teacher.id }, select: { id: true } })).id;
    sessionId = await mk(1, now - 3_600_000, now + 1_800_000);
    futureSessionId = await mk(2, now + 10 * 60_000, now + 100 * 60_000); // trong khung điểm danh (30 phút trước giờ) nhưng chưa bắt đầu
  });

  afterAll(() => cleanup(tag));

  it("đầu giờ chỉ điểm danh; cuối buổi đánh giá riêng, HS xem lại; điểm danh lại không xóa đánh giá", async () => {
    await saveAttendance(
      teacher,
      sessionId,
      [
        { studentId: student.id, status: "PRESENT", note: null },
        { studentId: absent.id, status: "ABSENT", note: "ốm" },
      ],
      null,
    );
    // Chưa đánh giá: thái độ/nhận xét trống.
    expect((await getSessionForAttendance(teacher, sessionId)).roster.find((r) => r.id === student.id)?.record).toMatchObject({ attitude: null, comment: null });

    // Cuối buổi: đánh giá cả hai, nhưng em vắng bị bỏ qua.
    const saved = await saveEvaluations(teacher, sessionId, [
      { studentId: student.id, attitude: "GOOD", comment: "Làm bài tập rất tốt" },
      { studentId: absent.id, attitude: "GOOD", comment: "không được lưu" },
    ]);
    expect(saved.count).toBe(1);
    const roster = (await getSessionForAttendance(teacher, sessionId)).roster;
    expect(roster.find((r) => r.id === student.id)?.record).toMatchObject({ status: "PRESENT", attitude: "GOOD", comment: "Làm bài tập rất tốt" });
    expect(roster.find((r) => r.id === absent.id)?.record).toMatchObject({ status: "ABSENT", comment: null });

    const seen = await getSessionForLearner(student, sessionId, student.id);
    expect(seen.attendance).toMatchObject({ attitude: "GOOD", comment: "Làm bài tập rất tốt" });
    expect((await getStudentAttendance(student, student.id)).records.find((r) => r.comment)?.comment).toBe("Làm bài tập rất tốt");

    // Sửa điểm danh (đổi muộn): đánh giá đã có không bị xóa.
    await saveAttendance(teacher, sessionId, [{ studentId: student.id, status: "LATE", note: "kẹt xe" }], null);
    expect((await getSessionForAttendance(teacher, sessionId)).roster.find((r) => r.id === student.id)?.record).toMatchObject({ status: "LATE", attitude: "GOOD", comment: "Làm bài tập rất tốt" });

    // Sửa đánh giá: để trống thì xóa.
    await saveEvaluations(teacher, sessionId, [{ studentId: student.id, attitude: "NORMAL", comment: null }]);
    expect((await getSessionForAttendance(teacher, sessionId)).roster.find((r) => r.id === student.id)?.record).toMatchObject({ attitude: "NORMAL", comment: null });
  });

  it("buổi chưa bắt đầu: điểm danh được nhưng chưa đánh giá được", async () => {
    await saveAttendance(teacher, futureSessionId, [{ studentId: student.id, status: "PRESENT", note: null }], null);
    await expect(saveEvaluations(teacher, futureSessionId, [{ studentId: student.id, attitude: "GOOD", comment: "x" }])).rejects.toMatchObject({ code: "NOT_STARTED" });
    await expect(saveEvaluations(teacher, futureSessionId, [])).rejects.toBeInstanceOf(DomainError);
  });
});
