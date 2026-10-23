// Tuyển sinh: form học thử (UC-001), xử lý lead (UC-002), chuyển học viên (UC-003).
import { Prisma, type LeadStatus } from "@prisma/client";
import { enrollInTx } from "@/server/academic/enrollment";
import { writeAudit } from "@/server/audit/log";
import { hashPassword } from "@/server/auth/password";
import { assertCan } from "@/server/auth/policy";
import { cached, CACHE_TAGS } from "@/server/cache";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { LEAD_SOURCE_LABELS } from "@/lib/labels";
import { normalizePhone, phoneFragment } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";
import { generateTempPassword, isRecordNotFound, nextStudentCode, withStudentCodeRetry } from "@/server/users/credentials";
import { checkLeadTransition, CONVERTIBLE_STATUSES, overdueCutoff } from "./rules";
import type { ConvertLeadInput, ManualLeadInput, TrialRequestInput } from "./schemas";

const OPEN_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "TRIAL_SCHEDULED", "TRIAL_DONE"];

function describeRequest(input: TrialRequestInput, subjectName: string, courseTitle?: string | null): string {
  return [
    `Phụ huynh: ${input.parentName}`,
    `Học sinh: ${input.studentName}, lớp ${input.gradeLevel}`,
    `Môn quan tâm: ${subjectName}${courseTitle ? ` — khóa ${courseTitle}` : ""}`,
    input.email ? `Email: ${input.email}` : null,
    input.note ? `Ghi chú: ${input.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Môn theo slug, theo đúng thứ tự `slugs` — dùng cho form học thử trên trang chủ (chọn nhiều môn). */
export async function findSubjectsBySlugs(slugs: string[]): Promise<{ id: string; slug: string; name: string }[]> {
  if (slugs.length === 0) return [];
  const rows = await db.subject.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true } });
  return slugs.flatMap((slug) => rows.filter((r) => r.slug === slug));
}

/** UC-001: tạo lead mới hoặc thêm hoạt động vào lead đang mở trùng SĐT (FR-004). */
export async function submitTrialRequest(input: TrialRequestInput): Promise<{ leadId: string; resubmitted: boolean }> {
  const subject = await db.subject.findUnique({ where: { id: input.subjectId }, select: { id: true, name: true } });
  if (!subject) throw new DomainError("INVALID_SUBJECT", "Môn học không hợp lệ.", { subjectId: "Chọn môn quan tâm." });
  const course = input.courseSlug
    ? await db.course.findFirst({ where: { slug: input.courseSlug, isPublished: true }, select: { id: true, title: true } })
    : null;

  const content = describeRequest(input, subject.name, course?.title);
  const now = new Date();

  return db.$transaction(async (tx) => {
    const open = await tx.lead.findFirst({
      where: { phone: input.phone, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (open) {
      // Một lệnh lồng (thêm hoạt động + chạm updatedAt) thay cho hai lệnh tuần tự.
      await tx.lead.update({
        where: { id: open.id },
        data: { updatedAt: now, activities: { create: { type: "RESUBMITTED", content: `Gửi lại form học thử.\n${content}` } } },
        select: { id: true },
      });
      return { leadId: open.id, resubmitted: true };
    }

    const lead = await tx.lead.create({
      data: {
        parentName: input.parentName,
        phone: input.phone,
        email: input.email,
        studentName: input.studentName,
        gradeLevel: input.gradeLevel,
        subjectId: subject.id,
        courseId: course?.id ?? null,
        note: input.note,
        source: "web_form",
      },
    });
    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "CREATED",
        content: `Đăng ký học thử qua website. Đồng ý liên hệ lúc ${formatDateTime(now)}.\n${content}`,
      },
    });
    return { leadId: lead.id, resubmitted: false };
  });
}

export class DuplicateOpenLeadError extends DomainError {
  constructor(readonly existingLeadId: string) {
    super("DUPLICATE_OPEN_LEAD", "SĐT này đang có lead chưa xử lý xong.", { phone: "SĐT này đang có lead chưa xử lý xong." });
  }
}

/**
 * API-021 — FR-006: Staff nhập lead tay (gọi điện, đến trực tiếp…).
 * BR-011: trùng SĐT với lead đang mở → từ chối, chỉ tới lead cũ (khác form công khai).
 */
export async function createManualLead(actor: Actor, input: ManualLeadInput): Promise<string> {
  assertCan(actor, "lead.manage");
  const course = input.courseSlug
    ? await db.course.findUnique({ where: { slug: input.courseSlug }, select: { id: true, title: true, subjectId: true } })
    : null;
  // Khóa đã chọn quyết định môn (UC-020 A1).
  const subjectId = course?.subjectId ?? input.subjectId;
  const subject = subjectId ? await db.subject.findUnique({ where: { id: subjectId }, select: { id: true, name: true } }) : null;
  if (subjectId && !subject) throw new DomainError("INVALID_SUBJECT", "Môn học không hợp lệ.", { subjectId: "Chọn môn quan tâm." });

  return db.$transaction(async (tx) => {
    const open = await tx.lead.findFirst({
      where: { phone: input.phone, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (open) throw new DuplicateOpenLeadError(open.id);

    const lead = await tx.lead.create({
      data: {
        parentName: input.parentName,
        phone: input.phone,
        email: input.email,
        studentName: input.studentName,
        gradeLevel: input.gradeLevel,
        subjectId: subject?.id ?? null,
        courseId: course?.id ?? null,
        note: input.note,
        source: input.source,
      },
    });
    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        actorId: actor.id,
        type: "CREATED",
        content: [
          `Nhập tay bởi ${actor.fullName} (nguồn: ${LEAD_SOURCE_LABELS[input.source]}).`,
          subject ? `Môn quan tâm: ${subject.name}${course ? ` — khóa ${course.title}` : ""}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
    return lead.id;
  });
}

export type LeadListFilter ={ status?: LeadStatus; subjectId?: string; q?: string; overdue?: boolean; page: number };

export const LEAD_PAGE_SIZE = 20;

/** FR-006. */
function leadWhere(filter: Omit<LeadListFilter, "page">): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.subjectId) where.subjectId = filter.subjectId;
  if (filter.overdue) {
    where.status = "NEW";
    where.createdAt = { lt: overdueCutoff(new Date()) };
  }
  const q = filter.q?.trim();
  if (q) {
    const phone = normalizePhone(q);
    where.OR = phone
      ? [{ phone }]
      : [
          { parentName: { contains: q, mode: "insensitive" as const } },
          { studentName: { contains: q, mode: "insensitive" as const } },
          // Chỉ tìm SĐT gần đúng khi từ khóa là số (trước đây "Lớp 9" khớp mọi SĐT có chữ số 9).
          ...(phoneFragment(q) ? [{ phone: { contains: phoneFragment(q)! } }] : []),
        ];
  }
  return where;
}

export async function listLeads(actor: Actor, filter: LeadListFilter) {
  assertCan(actor, "lead.manage");
  const where = leadWhere(filter);
  const [total, rows] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * LEAD_PAGE_SIZE,
      take: LEAD_PAGE_SIZE,
      include: { subject: { select: { name: true } }, course: { select: { title: true } } },
    }),
  ]);
  return { total, rows };
}

export const BOARD_COLUMN_SIZE = 30;
const BOARD_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "TRIAL_SCHEDULED", "TRIAL_DONE", "ENROLLED", "LOST"];

/** FEAT-B1 (DECISION-D32): bảng Kanban — mỗi trạng thái một cột, tối đa 30 lead mới nhất + tổng số của cột. */
export async function listLeadBoard(actor: Actor, filter: { subjectId?: string; q?: string }) {
  assertCan(actor, "lead.manage");
  const base = leadWhere(filter);
  const [counts, ...columns] = await Promise.all([
    db.lead.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
    ...BOARD_ORDER.map((status) =>
      db.lead.findMany({
        where: { ...base, status },
        orderBy: { createdAt: "desc" },
        take: BOARD_COLUMN_SIZE,
        select: { id: true, parentName: true, studentName: true, phone: true, gradeLevel: true, status: true, createdAt: true, updatedAt: true, subject: { select: { name: true } }, course: { select: { title: true } } },
      }),
    ),
  ]);
  return BOARD_ORDER.map((status, i) => ({ status, total: counts.find((c) => c.status === status)?._count._all ?? 0, leads: columns[i]! }));
}

export async function getLead(actor: Actor, id: string) {
  assertCan(actor, "lead.manage");
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      course: { select: { title: true, slug: true } },
      convertedStudent: { select: { id: true, fullName: true, studentCode: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { fullName: true } } } },
    },
  });
  if (!lead) throw new ForbiddenError();
  return lead;
}

/** Hai số liệu lead trong MỘT query (trước: 2 query). */
export async function leadCountsQuery(): Promise<{ newCount: number; overdueCount: number }> {
  const [row] = await db.$queryRaw<{ newCount: bigint; overdueCount: bigint }[]>(Prisma.sql`
    SELECT count(*) AS "newCount", count(*) FILTER (WHERE "createdAt" < ${overdueCutoff(new Date())}) AS "overdueCount"
    FROM "leads" WHERE "status" = 'NEW'`);
  return { newCount: Number(row?.newCount ?? 0), overdueCount: Number(row?.overdueCount ?? 0) };
}

// TTL 60 giây: "quá 24 giờ" đổi theo thời gian dù không có thao tác ghi; ghi lead thì vô hiệu ngay (CACHE_TAGS.dashboard).
const cachedLeadCounts = cached(leadCountsQuery, "dashboard:lead-counts", { tags: [CACHE_TAGS.dashboard], revalidate: 60 });

export async function leadCounts(actor: Actor) {
  assertCan(actor, "lead.manage");
  return cachedLeadCounts();
}

const TRANSITION_MESSAGES = {
  INVALID_TRANSITION: "Không thể chuyển lead sang trạng thái này.",
  LOST_REASON_REQUIRED: "Cần nhập lý do khi đánh dấu không theo học.",
} as const;

/** API-002 — FR-007. */
export async function changeLeadStatus(actor: Actor, leadId: string, to: LeadStatus, lostReason: string | null) {
  assertCan(actor, "lead.manage");
  await db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId }, select: { status: true } });
    if (!lead) throw new ForbiddenError();
    const error = checkLeadTransition(lead.status, to, lostReason);
    if (error) {
      throw new DomainError(error, TRANSITION_MESSAGES[error], error === "LOST_REASON_REQUIRED" ? { lostReason: TRANSITION_MESSAGES[error] } : undefined);
    }
    // updateMany theo trạng thái cũ: nếu người khác vừa đổi thì thao tác này không ghi đè.
    const { count } = await tx.lead.updateMany({
      where: { id: leadId, status: lead.status },
      data: { status: to, lostReason: to === "LOST" ? lostReason!.trim() : null },
    });
    if (count === 0) throw new DomainError("STALE", "Lead vừa được người khác cập nhật. Vui lòng tải lại trang.");
    await tx.leadActivity.create({
      data: {
        leadId,
        actorId: actor.id,
        type: "STATUS_CHANGE",
        content: `${lead.status} → ${to}${to === "LOST" ? `. Lý do: ${lostReason!.trim()}` : ""}`,
      },
    });
  });
}

/** API-003 — FR-008. */
export async function addLeadNote(actor: Actor, leadId: string, content: string) {
  assertCan(actor, "lead.manage");
  // Một lệnh lồng, nguyên tử (trước: kiểm tra + tạo + cập nhật = 3 query không cùng transaction).
  try {
    await db.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date(), activities: { create: { actorId: actor.id, type: "NOTE", content } } },
      select: { id: true },
    });
  } catch (error) {
    if (isRecordNotFound(error)) throw new ForbiddenError();
    throw error;
  }
}

export type IssuedCredential = { role: "STUDENT" | "PARENT"; fullName: string; login: string; password: string };

/**
 * API-004 — FR-009. Một transaction: học sinh + phụ huynh (tạo hoặc dùng lại theo SĐT) + liên kết
 * + ghi danh (tùy chọn) + lead ENROLLED + hoạt động + audit. Lỗi ở bất kỳ bước nào thì không lưu gì.
 */
export async function convertLead(actor: Actor, input: ConvertLeadInput & { classId: string | null }) {
  assertCan(actor, "lead.manage");

  const studentPassword = generateTempPassword();
  const parentPassword = generateTempPassword();
  const [studentHash, parentHash] = await Promise.all([hashPassword(studentPassword), hashPassword(parentPassword)]);

  return withStudentCodeRetry(() =>
    db.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: input.leadId }, select: { id: true, status: true } });
      if (!lead) throw new ForbiddenError();
      if (!CONVERTIBLE_STATUSES.includes(lead.status)) {
        throw new DomainError("INVALID_TRANSITION", "Lead đã nhập học hoặc đã đóng, không chuyển được.");
      }

      const credentials: IssuedCredential[] = [];

      // Một query cho mọi kiểm tra trùng SĐT/email (trước: tối đa 4 query tuần tự trong transaction).
      const taken = await tx.user.findMany({
        where: {
          OR: [
            { phone: input.parentPhone },
            ...(input.parentEmail ? [{ email: input.parentEmail }] : []),
            ...(input.studentPhone ? [{ phone: input.studentPhone }] : []),
            ...(input.studentEmail ? [{ email: input.studentEmail }] : []),
          ],
        },
        select: { id: true, role: true, fullName: true, phone: true, email: true },
      });
      const phoneTaken = (phone: string) => taken.some((u) => u.phone === phone);
      const emailTaken = (email: string) => taken.some((u) => u.email === email);

      // Phụ huynh: dùng lại theo SĐT nếu là tài khoản PARENT.
      const byPhone = taken.find((u) => u.phone === input.parentPhone) ?? null;
      let parentId: string;
      if (byPhone) {
        if (byPhone.role !== "PARENT") {
          throw new DomainError("PHONE_TAKEN_BY_OTHER_ROLE", "SĐT phụ huynh đã thuộc một tài khoản không phải phụ huynh.", {
            parentPhone: "SĐT này đã được dùng cho tài khoản khác.",
          });
        }
        parentId = byPhone.id;
      } else {
        if (input.parentEmail && emailTaken(input.parentEmail)) {
          throw new DomainError("DUPLICATE_EMAIL", "Email phụ huynh đã được dùng.", { parentEmail: "Email này đã được dùng." });
        }
        const parent = await tx.user.create({
          data: {
            fullName: input.parentName,
            phone: input.parentPhone,
            email: input.parentEmail,
            role: "PARENT",
            passwordHash: parentHash,
            mustChangePassword: true,
          },
        });
        parentId = parent.id;
        credentials.push({ role: "PARENT", fullName: parent.fullName, login: input.parentPhone, password: parentPassword });
      }

      // SĐT/email trùng với phụ huynh vừa tạo/dùng lại trong chính giao dịch này cũng tính là đã dùng.
      if (input.studentPhone && (phoneTaken(input.studentPhone) || input.studentPhone === input.parentPhone)) {
        throw new DomainError("DUPLICATE_PHONE", "SĐT học sinh đã được dùng.", { studentPhone: "SĐT này đã được dùng." });
      }
      if (input.studentEmail && (emailTaken(input.studentEmail) || (!byPhone && input.studentEmail === input.parentEmail))) {
        throw new DomainError("DUPLICATE_EMAIL", "Email học sinh đã được dùng.", { studentEmail: "Email này đã được dùng." });
      }

      const student = await tx.user.create({
        data: {
          fullName: input.studentName,
          gradeLevel: input.gradeLevel,
          email: input.studentEmail,
          phone: input.studentPhone,
          studentCode: await nextStudentCode(tx),
          role: "STUDENT",
          passwordHash: studentHash,
          mustChangePassword: true,
        },
      });
      const studentLogin = input.studentEmail ?? input.studentPhone;
      if (studentLogin) credentials.push({ role: "STUDENT", fullName: student.fullName, login: studentLogin, password: studentPassword });

      await tx.guardianship.create({ data: { parentId, studentId: student.id } });
      if (input.classId) await enrollInTx(tx, input.classId, student.id);

      await tx.lead.update({ where: { id: lead.id }, data: { status: "ENROLLED", convertedStudentId: student.id } });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          actorId: actor.id,
          type: "CONVERTED",
          content: `Chuyển thành học viên ${student.fullName} (${student.studentCode})${byPhone ? `, liên kết phụ huynh có sẵn ${byPhone.fullName}` : ""}.`,
        },
      });
      await writeAudit(
        {
          actorId: actor.id,
          action: "lead.convert",
          entity: "Lead",
          entityId: lead.id,
          detail: { from: lead.status, studentId: student.id, parentId, parentReused: Boolean(byPhone), classId: input.classId },
        },
        tx,
      );

      return { studentId: student.id, studentCode: student.studentCode!, credentials };
    }),
  );
}
