import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { cleanup, createCatalog, createUser, makeTag } from "@/test/fixtures";
import { createPracticeSet, getPracticeSetForAuthor, listClassSupplementalSets, listPracticeSets, openPracticeSet, setPracticeActive } from "./service";

const tag = makeTag();
const input = { title: `Đề bổ sung ${tag}`, description: null, topic: "Hệ phương trình", format: "Trắc nghiệm", difficulty: "MEDIUM" as const, subjectId: null, levelId: null };

let owner: Actor, other: Actor, s1: Actor, s2: Actor, outsider: Actor;
let classId: string;

describe.skipIf(!process.env.TEST_DATABASE_URL)("Đề luyện tập bổ sung cho học sinh của lớp (integration)", () => {
  beforeAll(async () => {
    [owner, other, s1, s2, outsider] = await Promise.all([createUser(tag, "TEACHER"), createUser(tag, "TEACHER"), createUser(tag, "STUDENT"), createUser(tag, "STUDENT"), createUser(tag, "STUDENT")]);
    const cat = await createCatalog(tag);
    classId = (
      await db.class.create({
        data: { code: `${tag.toUpperCase()}-A`, courseId: cat.course.id, teacherId: owner.id, startDate: new Date(), weekdays: "1,3,5", startTime: "14:00", endTime: "15:30", totalSessions: 4, capacity: 12 },
        select: { id: true },
      })
    ).id;
    await db.enrollment.createMany({
      data: [
        { classId, studentId: s1.id },
        { classId, studentId: s2.id },
      ],
    });
  });

  afterAll(async () => {
    await db.practiceSet.deleteMany({ where: { createdById: { in: [owner.id, other.id] } } });
    await cleanup(tag);
  });

  it("chỉ GV phụ trách lớp mới tạo được đề bổ sung, và chỉ cho học sinh đang học lớp đó", async () => {
    await expect(createPracticeSet(other, { ...input, classId, forStudentId: s1.id })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createPracticeSet(owner, { ...input, classId, forStudentId: outsider.id })).rejects.toBeInstanceOf(DomainError);
    await expect(createPracticeSet(owner, { ...input, forStudentId: s1.id })).rejects.toBeInstanceOf(DomainError);
  });

  it("đề bổ sung chỉ hiện và làm được với đúng học sinh, sau khi mở; báo riêng học sinh đó", async () => {
    const id = await createPracticeSet(owner, { ...input, classId, forStudentId: s1.id });
    await db.practiceQuestion.create({ data: { setId: id, order: 1, type: "MCQ", prompt: "1+1?", options: ["1", "2"], correctOption: 1, points: 10 } });

    // Nháp: học sinh chưa thấy.
    await expect(openPracticeSet(s1, id)).rejects.toBeInstanceOf(ForbiddenError);

    await setPracticeActive(owner, id, true);
    expect((await openPracticeSet(s1, id)).set.id).toBe(id);
    await expect(openPracticeSet(s2, id)).rejects.toBeInstanceOf(ForbiddenError);

    expect((await listPracticeSets(s1, {})).some((s) => s.id === id)).toBe(true);
    expect((await listPracticeSets(s2, {})).some((s) => s.id === id)).toBe(false);
    // GV khác không thấy đề dành riêng của đồng nghiệp trong kho đề chung.
    expect((await listPracticeSets(other, {})).some((s) => s.id === id)).toBe(false);
    await expect(getPracticeSetForAuthor(other, id)).rejects.toBeInstanceOf(ForbiddenError);

    expect(await db.notification.count({ where: { userId: s1.id, link: `/on-luyen/${id}` } })).toBe(1);
    expect(await db.notification.count({ where: { userId: s2.id, link: `/on-luyen/${id}` } })).toBe(0);

    // Về nháp rồi mở lại: báo lại học sinh (đề được mở lại).
    await setPracticeActive(owner, id, false);
    await setPracticeActive(owner, id, true);
    expect(await db.notification.count({ where: { userId: s1.id, link: `/on-luyen/${id}` } })).toBe(2);
  });

  it("danh sách đề bổ sung của lớp chỉ dành cho GV phụ trách", async () => {
    expect((await listClassSupplementalSets(owner, classId)).length).toBeGreaterThan(0);
    await expect(listClassSupplementalSets(other, classId)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
