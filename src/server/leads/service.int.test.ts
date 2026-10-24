import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClass } from "@/server/academic/service";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { cleanup, createCatalog, createUser, makeTag, randomPhone } from "@/test/fixtures";
import { vnDateKey } from "@/lib/time";
import { addDays } from "@/lib/schedule";
import { convertLead, createManualLead, submitTrialRequest } from "./service";

const tag = makeTag();
let staff: Actor;
let teacher: Actor;
let catalog: Awaited<ReturnType<typeof createCatalog>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)("tuyển sinh — integration", () => {
  beforeAll(async () => {
    staff = await createUser(tag, "ADMIN"); // giáo vụ đã bỏ (DECISION-D35) — Admin quản lý lead
    teacher = await createUser(tag, "TEACHER");
    catalog = await createCatalog(tag);
  });
  afterAll(() => cleanup(tag));

  const trial = (phone: string) => ({
    parentName: `PH ${tag}`,
    phone,
    email: null,
    studentName: `HS ${tag}`,
    gradeLevel: 9,
    subjectId: catalog.subject.id,
    courseSlug: null,
    note: null,
    consent: "on" as const,
  });

  it("TC-003 trùng SĐT lead đang mở → thêm RESUBMITTED, không tạo lead mới", async () => {
    const phone = randomPhone();
    const first = await submitTrialRequest(trial(phone));
    const second = await submitTrialRequest(trial(phone));
    expect(first.resubmitted).toBe(false);
    expect(second).toEqual({ leadId: first.leadId, resubmitted: true });
    expect(await db.lead.count({ where: { phone } })).toBe(1);
    const types = (await db.leadActivity.findMany({ where: { leadId: first.leadId } })).map((a) => a.type).sort();
    expect(types).toEqual(["CREATED", "RESUBMITTED"]);

    await db.lead.update({ where: { id: first.leadId }, data: { status: "LOST", lostReason: "test" } });
    const third = await submitTrialRequest(trial(phone));
    expect(third.resubmitted).toBe(false);
    expect(await db.lead.count({ where: { phone } })).toBe(2);
  });

  it("TC-040 nhập tay trùng lead đang mở → DUPLICATE_OPEN_LEAD, không tạo lead", async () => {
    const phone = randomPhone();
    const { leadId } = await submitTrialRequest(trial(phone));
    const input = { source: "phone" as const, parentName: `PH ${tag}`, phone, email: null, studentName: `HS ${tag}`, gradeLevel: null, subjectId: null, courseSlug: null, note: null };
    await expect(createManualLead(staff, input)).rejects.toMatchObject({ code: "DUPLICATE_OPEN_LEAD", existingLeadId: leadId });
    expect(await db.lead.count({ where: { phone } })).toBe(1);

    const other = await createManualLead(staff, { ...input, phone: randomPhone(), courseSlug: catalog.course.slug });
    const created = await db.lead.findUniqueOrThrow({ where: { id: other } });
    expect(created).toMatchObject({ status: "NEW", source: "phone", subjectId: catalog.subject.id, courseId: catalog.course.id });
  });

  async function openClass(code: string, capacity: number) {
    const start = addDays(vnDateKey(new Date()), 30);
    const id = await createClass(staff, {
      courseId: catalog.course.id,
      code,
      teacherId: teacher.id,
      roomId: null,
      startDate: start,
      weekdays: [7],
      startTime: code.endsWith("A") ? "07:00" : "13:00",
      endTime: code.endsWith("A") ? "08:30" : "14:30",
      totalSessions: 2,
      capacity,
    });
    return id;
  }

  const convertInput = (leadId: string, classId: string | null) => ({
    leadId,
    studentName: `HS ${tag}`,
    gradeLevel: 9,
    studentEmail: `hs.${leadId.slice(-6)}@${tag}.int.test`,
    studentPhone: null,
    parentName: `PH ${tag}`,
    parentPhone: randomPhone(),
    parentEmail: null,
    classId,
  });

  it("TC-007 chuyển lead → HS + PH + liên kết + ghi danh + lead ENROLLED + audit", async () => {
    const classId = await openClass(`${tag.toUpperCase()}-A`, 5);
    const { leadId } = await submitTrialRequest(trial(randomPhone()));
    const result = await convertLead(staff, convertInput(leadId, classId));

    expect(result.studentCode).toMatch(/^HS\d{6}$/);
    expect(result.credentials.map((c) => c.role).sort()).toEqual(["PARENT", "STUDENT"]);
    const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
    expect(lead.status).toBe("ENROLLED");
    expect(lead.convertedStudentId).toBe(result.studentId);
    expect(await db.guardianship.count({ where: { studentId: result.studentId } })).toBe(1);
    expect(await db.enrollment.count({ where: { classId, studentId: result.studentId, status: "ACTIVE" } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "lead.convert", entityId: leadId } })).toBe(1);
  });

  it("TC-008 lớp đầy → lỗi CLASS_FULL và không lưu bản ghi nào", async () => {
    const classId = await openClass(`${tag.toUpperCase()}-B`, 1);
    const filler = await createUser(tag, "STUDENT");
    await db.enrollment.create({ data: { classId, studentId: filler.id } });
    const { leadId } = await submitTrialRequest(trial(randomPhone()));
    const before = { users: await db.user.count(), links: await db.guardianship.count(), enrollments: await db.enrollment.count() };

    await expect(convertLead(staff, convertInput(leadId, classId))).rejects.toMatchObject({ code: "CLASS_FULL" });

    expect({ users: await db.user.count(), links: await db.guardianship.count(), enrollments: await db.enrollment.count() }).toEqual(before);
    expect((await db.lead.findUniqueOrThrow({ where: { id: leadId } })).status).toBe("NEW");
  });
});
