// Mỗi ý định = một hàm lấy dữ liệu bằng service CÓ SẴN (đã kiểm tra phiên + vai trò + phạm vi, DECISION-D11/D14).
// AI không bao giờ đọc DB: chỉ chọn ý định; sai phạm vi → service ném ForbiddenError (chuyển thành câu trả lời "không tìm thấy").
import type { Role } from "@prisma/client";
import { SITE } from "@/data/site";
import { CLASS_STATUS, REQUEST_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDate, formatDateTime, formatTime, vnDateKey } from "@/lib/time";
import { listClasses, listSessionsInRange } from "@/server/academic/service";
import { listStudentClasses } from "@/server/academic/learner";
import { countPendingGrading, listAssignmentsOfStudent, listPublishedResults } from "@/server/assessment/service";
import { formatRate } from "@/server/attendance/rules";
import { getStudentAttendance, listAbsenceAlerts } from "@/server/attendance/service";
import { assertCanViewStudent, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { documentVisibilityWhere } from "@/server/documents/access";
import { ForbiddenError } from "@/server/errors";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";
import { leadCounts } from "@/server/leads/service";
import { unreadNotificationCount } from "@/server/notifications/service";
import { countPendingLeaveRequests, listLeaveRequestsForParent } from "@/server/requests/leave";
import { countPendingScheduleRequests } from "@/server/requests/schedule";
import { listMyChildren } from "@/server/users/service";
import { dayRange, DAY_MS } from "./dates";
import { intentById, intentLabel, intentsForRole, suggestionsForRole } from "./intents";
import { dayLabel } from "./matcher";
import { matchClassCode, matchPeople } from "./names";
import { sessionPresenceText } from "./rules";
import type { ChatAnswer, ChatChoice } from "./types";
import { syllabusForSession } from "@/lib/syllabus";

export type Hints = { child?: string | null; classCode?: string | null; teacher?: string | null };

export type Ctx = {
  actor: Actor;
  now: Date;
  text: string;
  day: { offset: number; explicit: boolean };
  childId?: string;
  classCode?: string;
  hints: Hints;
};

type Reply = Omit<ChatAnswer, "via">;

const reply = (intent: string, text: string, extra: Partial<Reply> = {}): Reply => ({ intent, text, lines: [], links: [], choices: [], ...extra });

const NOT_FOUND = (intent: string) => reply(intent, "Mình không tìm thấy thông tin phù hợp trong phạm vi tài khoản của bạn.");

type Sess = { id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED"; cancelReason: string | null; room: { name: string } | null; teacher: { fullName: string }; class: { id: string; code: string; course: { title: string } } };

function sessionLink(actor: Actor, sessionId: string, childId?: string): string {
  if (actor.role === "PARENT") return `/phu-huynh/buoi/${sessionId}?con=${childId ?? ""}`;
  if (actor.role === "STUDENT") return `/hoc-sinh/buoi/${sessionId}`;
  if (actor.role === "TEACHER") return `/giao-vien/buoi/${sessionId}`;
  return `/quan-ly/buoi/${sessionId}`;
}

function sessionLine(s: Sess, opts: { teacher?: boolean; date?: boolean } = {}): string {
  const when = `${opts.date ? `${formatDate(s.startsAt)} ` : ""}${formatTime(s.startsAt)}–${formatTime(s.endsAt)}`;
  const parts = [when, `${s.class.code} (${s.class.course.title})`];
  if (s.room?.name) parts.push(s.room.name);
  if (opts.teacher) parts.push(`GV ${s.teacher.fullName}`);
  if (s.status === "CANCELLED") parts.push("ĐÃ HỦY");
  return parts.join(" · ");
}

/* ───────── Chọn học sinh (phụ huynh nhiều con) ───────── */

type Child = { id: string; fullName: string };

async function pickChild(ctx: Ctx, intent: string): Promise<{ child: Child } | { answer: Reply }> {
  const { actor } = ctx;
  if (actor.role === "STUDENT") return { child: { id: actor.id, fullName: actor.fullName } };
  const children = await listMyChildren(actor);
  if (children.length === 0) {
    return { answer: reply(intent, "Tài khoản của bạn chưa được liên kết với học sinh nào. Vui lòng liên hệ trung tâm để được ghép hồ sơ con.") };
  }
  if (ctx.childId) {
    const chosen = children.find((c) => c.id === ctx.childId);
    return chosen ? { child: chosen } : { answer: NOT_FOUND(intent) };
  }
  const named = matchPeople(children, ctx.text, ctx.hints.child);
  if (named.length === 1) return { child: named[0]! };
  if (children.length === 1) return { child: children[0]! };
  const pool = named.length > 1 ? named : children;
  const choices: ChatChoice[] = pool.map((c) => ({ label: c.fullName, intent, childId: c.id, ...(ctx.day.explicit ? { day: ctx.day.offset } : {}) }));
  return { answer: reply(intent, "Anh/chị hỏi về bé nào ạ?", { choices }) };
}

const whoOf = (actor: Actor, child: Child) => (actor.role === "STUDENT" ? "bạn" : `con ${child.fullName}`);

/* ───────── Học sinh & phụ huynh ───────── */

async function learnerToday(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_today");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const { actor, now } = ctx;
  await assertCanViewStudent(actor, child.id);
  const range = dayRange(now, ctx.day.offset);
  const sessions = await listSessionsInRange(actor, range.from, range.to, child.id);
  const dl = dayLabel(ctx.day.offset);
  const who = whoOf(actor, child);

  if (sessions.length === 0) {
    const next = (await listSessionsInRange(actor, range.to, new Date(range.to.getTime() + 14 * DAY_MS), child.id)).find((s) => s.status !== "CANCELLED");
    return reply("learner_today", `${dl} ${who} không có buổi học nào.`, {
      lines: next ? [`Buổi học tiếp theo: ${sessionLine(next, { date: true })}`] : [],
      links: next ? [{ label: "Xem buổi học tiếp theo", href: sessionLink(actor, next.id, child.id) }] : [],
    });
  }
  const attendances = await db.attendance.findMany({
    where: { studentId: child.id, sessionId: { in: sessions.map((s) => s.id) } },
    select: { sessionId: true, status: true, note: true },
  });
  const bySession = new Map(attendances.map((a) => [a.sessionId, a]));
  const active = sessions.filter((s) => s.status !== "CANCELLED").length;
  const lines = sessions.map(
    (s) => `${sessionLine(s)}\n→ ${sessionPresenceText({ sessionStatus: s.status, cancelReason: s.cancelReason, attendance: bySession.get(s.id) ?? null, startsAt: s.startsAt, endsAt: s.endsAt, now })}`,
  );
  const headline = active === 0 ? `${dl} ${who} có ${sessions.length} buổi nhưng đều đã hủy.` : `${dl} ${who} có ${active} buổi học.`;
  return reply("learner_today", headline, { lines, links: sessions.slice(0, 3).map((s) => ({ label: `Chi tiết buổi ${s.class.code}`, href: sessionLink(actor, s.id, child.id) })) });
}

async function learnerScore(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_score");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const { actor, now } = ctx;
  const results = await listPublishedResults(actor, child.id);
  const key = dayRange(now, ctx.day.offset).key;
  const onDay = results.filter((r) => vnDateKey(r.publishedAt) === key);
  const fmt = (r: (typeof results)[number]) => `${r.title} (${r.classCode}): ${r.score ?? "—"}/${r.maxScore} điểm${r.isLate ? " · nộp muộn" : ""}`;
  // Bài đã nộp nhưng chưa công bố/chưa chấm: chỉ ĐẾM, không lộ điểm hay đáp án (BR-046, BR-047).
  const waiting = await db.submission.count({
    where: { studentId: child.id, status: { not: "IN_PROGRESS" }, OR: [{ status: "SUBMITTED" }, { assignment: { resultsPublishedAt: null } }] },
  });
  const waitLine = waiting > 0 ? [`Có ${waiting} bài đã nộp đang chờ giáo viên chấm hoặc công bố điểm.`] : [];
  const who = whoOf(actor, child);
  const dl = dayLabel(ctx.day.offset).toLowerCase();
  const links = [{ label: actor.role === "STUDENT" ? "Xem kết quả" : "Xem tiến độ của con", href: actor.role === "STUDENT" ? "/hoc-sinh/ket-qua" : `/phu-huynh?con=${child.id}` }];

  if (onDay.length > 0) return reply("learner_score", `Điểm các bài của ${who} được công bố ${dl}:`, { lines: [...onDay.map(fmt), ...waitLine], links });
  if (results.length === 0) return reply("learner_score", `${who[0]!.toUpperCase()}${who.slice(1)} chưa có bài nào được công bố điểm.`, { lines: waitLine, links });
  return reply("learner_score", `Chưa có bài nào của ${who} được công bố điểm ${dl}. Các kết quả gần nhất:`, { lines: [...results.slice(0, 3).map(fmt), ...waitLine], links });
}

async function learnerProgress(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_progress");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const { actor, now } = ctx;
  const classes = await listStudentClasses(actor, child.id);
  const who = whoOf(actor, child);
  if (classes.length === 0) return reply("learner_progress", `${who[0]!.toUpperCase()}${who.slice(1)} hiện chưa học lớp nào.`);
  const sessions = await db.classSession.findMany({
    where: { classId: { in: classes.map((c) => c.class.id) }, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" },
    select: { id: true, classId: true, index: true, startsAt: true, endsAt: true, lessonContent: true, homework: true },
  });
  const lines = classes.map(({ class: c }) => {
    const mine = sessions.filter((s) => s.classId === c.id);
    const held = mine.filter((s) => s.endsAt <= now);
    const logged = [...held].reverse().find((s) => s.lessonContent || s.homework);
    const next = mine.find((s) => s.startsAt > now);
    const out = [`${c.code} · ${c.course.title}: đã học ${held.length}/${mine.length} buổi`];
    if (logged?.lessonContent) out.push(`Nội dung buổi ${logged.index} (${formatDate(logged.startsAt)}): ${logged.lessonContent}`);
    if (logged?.homework) out.push(`Bài về nhà: ${logged.homework}`);
    if (!logged) out.push("Giáo viên chưa ghi nhật ký nội dung buổi học nào.");
    if (next) out.push(`Buổi tiếp theo: ${formatDateTime(next.startsAt)}`);
    return out.join("\n");
  });
  return reply("learner_progress", `Tiến độ học của ${who}:`, { lines, links: actor.role === "STUDENT" ? [{ label: "Xem lịch học", href: "/hoc-sinh/lich" }] : [{ label: "Xem tiến độ chi tiết", href: `/phu-huynh?con=${child.id}` }] });
}

async function learnerHomework(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_homework");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const { actor, now } = ctx;
  const rows = await listAssignmentsOfStudent(actor, child.id);
  const who = whoOf(actor, child);
  const todo = rows.filter((a) => a.status === "PUBLISHED" && (a.submissionStatus === null || a.submissionStatus === "IN_PROGRESS"));
  const waiting = rows.filter((a) => a.submissionStatus === "SUBMITTED" || (a.submissionStatus === "GRADED" && !a.resultsPublished));
  const fmt = (a: (typeof rows)[number]) => `${a.title} (${a.classCode}) — hạn ${formatDateTime(a.dueAt)}${a.dueAt < now ? " · ĐÃ QUÁ HẠN" : ""}`;
  const lines = [...todo.slice(0, 6).map((a) => `Chưa nộp: ${fmt(a)}`), ...waiting.slice(0, 3).map((a) => `Đã nộp, chờ chấm/công bố: ${a.title} (${a.classCode})`)];
  const href = actor.role === "STUDENT" ? "/hoc-sinh/bai-tap" : `/phu-huynh/bai-tap?con=${child.id}`;
  return reply("learner_homework", todo.length === 0 ? `${who[0]!.toUpperCase()}${who.slice(1)} không còn bài tập nào chưa nộp.` : `${who[0]!.toUpperCase()}${who.slice(1)} còn ${todo.length} bài chưa nộp:`, {
    lines,
    links: [{ label: "Xem bài tập", href }],
  });
}

async function learnerSchedule(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_schedule");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const { actor, now } = ctx;
  const list = (await listSessionsInRange(actor, now, new Date(now.getTime() + 14 * DAY_MS), child.id)).filter((s) => s.status !== "CANCELLED");
  const who = whoOf(actor, child);
  if (list.length === 0) return reply("learner_schedule", `${who[0]!.toUpperCase()}${who.slice(1)} chưa có buổi học nào trong 14 ngày tới.`);
  return reply("learner_schedule", `Các buổi học sắp tới của ${who}:`, {
    lines: list.slice(0, 6).map((s) => sessionLine(s, { date: true, teacher: true })),
    links: [{ label: "Xem lịch cả tuần", href: actor.role === "STUDENT" ? "/hoc-sinh/lich" : `/phu-huynh?con=${child.id}` }],
  });
}

async function learnerAttendanceRate(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_attendance_rate");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const data = await getStudentAttendance(ctx.actor, child.id);
  const who = whoOf(ctx.actor, child);
  const counted = data.records.filter((r) => !r.sessionCancelled);
  if (counted.length === 0) return reply("learner_attendance_rate", `Chưa có dữ liệu điểm danh của ${who}.`);
  const count = (s: string) => counted.filter((r) => r.status === s).length;
  return reply("learner_attendance_rate", `Chuyên cần của ${who}: ${formatRate(data.rate)} (${counted.length} buổi đã điểm danh).`, {
    lines: [`Có mặt: ${count("PRESENT")} · Muộn: ${count("LATE")} · Vắng: ${count("ABSENT")} · Vắng có phép: ${count("EXCUSED")}`],
  });
}

async function learnerTeacher(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_teacher");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const classes = await listStudentClasses(ctx.actor, child.id);
  const who = whoOf(ctx.actor, child);
  if (classes.length === 0) return reply("learner_teacher", `${who[0]!.toUpperCase()}${who.slice(1)} hiện chưa học lớp nào.`);
  return reply("learner_teacher", `Giáo viên các lớp của ${who}:`, {
    lines: classes.map(({ class: c }) => `${c.code} · ${c.course.title}: GV ${c.teacher.fullName} · ${formatSchedule(c.weekdays, c.startTime, c.endTime)}${c.room?.name ? ` · ${c.room.name}` : ""}`),
  });
}

async function learnerLeave(ctx: Ctx): Promise<Reply> {
  if (ctx.actor.role !== "PARENT") return reply("learner_leave", "Đơn xin nghỉ do phụ huynh gửi. Bạn nhờ phụ huynh vào mục \"Đơn xin nghỉ\" nhé.");
  const requests = await listLeaveRequestsForParent(ctx.actor);
  if (requests.length === 0) return reply("learner_leave", "Anh/chị chưa gửi đơn xin nghỉ nào.", { links: [{ label: "Gửi đơn xin nghỉ", href: "/phu-huynh/don-nghi" }] });
  return reply("learner_leave", "Các đơn xin nghỉ gần đây:", {
    lines: requests.slice(0, 5).map((r) => `${r.student.fullName} · buổi ${formatDateTime(r.session.startsAt)} (${r.session.class.code}): ${REQUEST_STATUS[r.status].label}${r.responseNote ? ` — ${r.responseNote}` : ""}`),
    links: [{ label: "Mở trang đơn xin nghỉ", href: "/phu-huynh/don-nghi" }],
  });
}

async function learnerEvaluation(ctx: Ctx): Promise<Reply> {
  const picked = await pickChild(ctx, "learner_evaluation");
  if ("answer" in picked) return picked.answer;
  const { child } = picked;
  const list = await listEvaluationsOfStudent(ctx.actor, child.id);
  const who = whoOf(ctx.actor, child);
  const latest = list[0];
  if (!latest) return reply("learner_evaluation", `Giáo viên chưa gửi nhận xét định kỳ nào cho ${who}.`);
  const lines = [`${latest.period} · ${latest.class.code} · GV ${latest.teacher.fullName}`, latest.content];
  if (latest.strengths) lines.push(`Điểm mạnh: ${latest.strengths}`);
  if (latest.improvements) lines.push(`Cần cải thiện: ${latest.improvements}`);
  return reply("learner_evaluation", `Nhận xét gần nhất về ${who}:`, { lines: [lines.join("\n")] });
}

async function learnerNotifications(ctx: Ctx): Promise<Reply> {
  const n = await unreadNotificationCount(ctx.actor.id);
  return reply("learner_notifications", n === 0 ? "Bạn không có thông báo mới." : `Bạn có ${n} thông báo chưa đọc.`, { links: [{ label: "Mở thông báo", href: "/thong-bao" }] });
}

/* ───────── Giáo viên ───────── */

async function teacherToday(ctx: Ctx): Promise<Reply> {
  const { actor, now } = ctx;
  const range = dayRange(now, ctx.day.offset);
  const sessions = await listSessionsInRange(actor, range.from, range.to);
  const dl = dayLabel(ctx.day.offset);
  if (sessions.length === 0) {
    const next = (await listSessionsInRange(actor, range.to, new Date(range.to.getTime() + 14 * DAY_MS))).find((s) => s.status !== "CANCELLED");
    return reply("teacher_today", `${dl} bạn không có buổi dạy nào.`, { lines: next ? [`Buổi dạy tiếp theo: ${sessionLine(next, { date: true })}`] : [] });
  }
  const active = sessions.filter((s) => s.status !== "CANCELLED");
  const classes = new Set(active.map((s) => s.class.id)).size;
  return reply("teacher_today", `${dl} bạn có ${active.length} buổi dạy (${classes} lớp).`, {
    lines: sessions.map((s) => sessionLine(s)),
    links: active.slice(0, 3).map((s) => ({ label: `Mở buổi ${s.class.code}`, href: sessionLink(actor, s.id) })),
  });
}

async function teacherLesson(ctx: Ctx): Promise<Reply> {
  const { actor, now } = ctx;
  const range = dayRange(now, ctx.day.offset);
  const sessions = (await listSessionsInRange(actor, range.from, range.to)).filter((s) => s.status !== "CANCELLED");
  const dl = dayLabel(ctx.day.offset);
  if (sessions.length === 0) return reply("teacher_lesson", `${dl} bạn không có buổi dạy nào nên chưa có bài giảng.`);
  const ids = sessions.map((s) => s.id);
  const [details, docs] = await Promise.all([
    db.classSession.findMany({
      where: { id: { in: ids } },
      select: { id: true, index: true, lessonContent: true, homework: true, note: true, class: { select: { totalSessions: true, course: { select: { syllabus: true } } } } },
    }),
    db.document.findMany({
      where: { AND: [documentVisibilityWhere(actor), { sessionId: { in: ids } }] },
      select: { id: true, title: true, sessionId: true },
    }),
  ]);
  const byId = new Map(details.map((d) => [d.id, d]));
  const links: { label: string; href: string }[] = [];
  const lines = sessions.map((s) => {
    const d = byId.get(s.id);
    const out = [`${sessionLine(s)}${d ? ` · buổi ${d.index}/${d.class.totalSessions}` : ""}`];
    const item = d ? syllabusForSession(d.class.course.syllabus, d.index, d.class.totalSessions) : null;
    if (item?.title)out.push(`Theo khung khóa học: ${item.title}${item.detail ? ` — ${item.detail}` : ""}`);
    if (d?.lessonContent) out.push(`Nội dung đã ghi: ${d.lessonContent}`);
    if (d?.homework) out.push(`Bài về nhà: ${d.homework}`);
    if (d?.note) out.push(`Ghi chú: ${d.note}`);
    const mine = docs.filter((x) => x.sessionId === s.id);
    for (const doc of mine) links.push({ label: `Giáo án/tài liệu: ${doc.title}`, href: `/tai-lieu/${doc.id}` });
    if (!item?.title && !d?.lessonContent && mine.length === 0) out.push("Buổi này chưa có giáo án hoặc nội dung được ghi. Bạn có thể nhờ trợ lý soạn giáo án, slide, đề bên dưới.");
    return out.join("\n");
  });
  links.push({ label: "Nhờ AI soạn giáo án / slide / đề", href: `/giao-vien/soan-bai?buoi=${sessions[0]!.id}` });
  return reply("teacher_lesson", `${dl} bài giảng của bạn:`, { lines, links: links.slice(0, 6) });
}

async function teacherNext(ctx: Ctx): Promise<Reply> {
  const { actor, now } = ctx;
  const list = (await listSessionsInRange(actor, now, new Date(now.getTime() + 30 * DAY_MS))).filter((s) => s.status !== "CANCELLED");
  const next = list[0];
  if (!next) return reply("teacher_next", "Bạn chưa có buổi dạy nào trong 30 ngày tới.");
  return reply("teacher_next", "Buổi dạy tiếp theo của bạn:", {
    lines: [sessionLine(next, { date: true })],
    links: [{ label: "Mở buổi học", href: sessionLink(actor, next.id) }],
  });
}

/** Buổi đã kết thúc trong `days` ngày qua mà chưa có bản ghi điểm danh. */
async function sessionsWithoutAttendance(actor: Actor, now: Date, days: number) {
  const sessions = (await listSessionsInRange(actor, new Date(now.getTime() - days * DAY_MS), now)).filter((s) => s.status !== "CANCELLED" && s.endsAt <= now);
  if (sessions.length === 0) return [];
  const marked = await db.attendance.groupBy({ by: ["sessionId"], where: { sessionId: { in: sessions.map((s) => s.id) } } });
  const done = new Set(marked.map((m) => m.sessionId));
  return sessions.filter((s) => !done.has(s.id));
}

async function teacherAttendanceTodo(ctx: Ctx): Promise<Reply> {
  const missing = await sessionsWithoutAttendance(ctx.actor, ctx.now, 7);
  if (missing.length === 0) return reply("teacher_attendance_todo", "Bạn đã điểm danh đầy đủ các buổi 7 ngày qua.");
  return reply("teacher_attendance_todo", `Bạn còn ${missing.length} buổi chưa điểm danh:`, {
    lines: missing.slice(0, 8).map((s) => sessionLine(s, { date: true })),
    links: missing.slice(0, 3).map((s) => ({ label: `Điểm danh ${s.class.code}`, href: sessionLink(ctx.actor, s.id) })),
  });
}

async function teacherGrading(ctx: Ctx): Promise<Reply> {
  const { total, items } = await countPendingGrading(ctx.actor);
  if (total === 0) return reply("teacher_grading", "Không có bài nộp nào đang chờ chấm.");
  return reply("teacher_grading", `Có ${total} bài nộp đang chờ bạn chấm:`, {
    lines: items.slice(0, 6).map((i) => `${i.student.fullName} · ${i.assignment.title} (${i.assignment.class.code})${i.submittedAt ? ` · nộp ${formatDateTime(i.submittedAt)}` : ""}`),
    links: [{ label: "Mở danh sách chấm bài", href: "/giao-vien/bai-tap" }],
  });
}

async function absenceAlerts(ctx: Ctx, intent: string): Promise<Reply> {
  const alerts = await listAbsenceAlerts(ctx.actor);
  if (alerts.length === 0) return reply(intent, "Không có học sinh nào vắng 2 buổi liên tiếp.");
  return reply(intent, `Có ${alerts.length} học sinh vắng 2 buổi liên tiếp:`, { lines: alerts.slice(0, 10).map((a) => `${a.studentName} · lớp ${a.classCode}`) });
}

async function teacherRequests(ctx: Ctx): Promise<Reply> {
  const n = await countPendingLeaveRequests(ctx.actor);
  return reply("teacher_requests", n === 0 ? "Không có đơn xin nghỉ nào chờ duyệt." : `Có ${n} đơn xin nghỉ của học sinh đang chờ bạn duyệt.`, { links: [{ label: "Mở đơn xin nghỉ", href: "/giao-vien/don" }] });
}

/* ───────── Quản lý ───────── */

async function mgrToday(ctx: Ctx): Promise<Reply> {
  const { actor, now } = ctx;
  const range = dayRange(now, ctx.day.offset);
  const sessions = await listSessionsInRange(actor, range.from, range.to);
  const dl = dayLabel(ctx.day.offset);
  if (sessions.length === 0) return reply("mgr_today", `${dl} không có buổi học nào.`);
  const active = sessions.filter((s) => s.status !== "CANCELLED");
  const cancelled = sessions.length - active.length;
  const classes = new Set(active.map((s) => s.class.id)).size;
  return reply("mgr_today", `${dl} có ${classes} lớp, ${active.length} buổi học${cancelled > 0 ? ` (${cancelled} buổi đã hủy)` : ""}:`, {
    lines: sessions.slice(0, 20).map((s) => sessionLine(s, { teacher: true })),
    links: [{ label: "Mở lịch tổng", href: "/quan-ly/lich" }],
  });
}

async function mgrClassTeacher(ctx: Ctx): Promise<Reply> {
  const { actor, now } = ctx;
  if (!isManager(actor)) throw new ForbiddenError();
  const classes = await listClasses(actor);
  const klass = matchClassCode(classes, ctx.classCode, ctx.text, ctx.hints.classCode);
  if (klass) {
    const todayRange = dayRange(now, 0);
    const today = (await listSessionsInRange(actor, todayRange.from, todayRange.to)).filter((s) => s.class.id === klass.id);
    const lines = [
      `Giáo viên phụ trách: ${klass.teacher.fullName}`,
      `Lịch: ${formatSchedule(klass.weekdays, klass.startTime, klass.endTime)}${klass.room?.name ? ` · ${klass.room.name}` : ""}`,
      `Sĩ số: ${klass._count.enrollments}/${klass.capacity} · Trạng thái: ${CLASS_STATUS[klass.status].label}`,
      ...today.map((s) => `Hôm nay: ${formatTime(s.startsAt)}–${formatTime(s.endsAt)}, GV ${s.teacher.fullName}${s.teacher.fullName !== klass.teacher.fullName ? " (dạy thay)" : ""}${s.status === "CANCELLED" ? " — ĐÃ HỦY" : ""}`),
    ];
    return reply("mgr_class_teacher", `Lớp ${klass.code} (${klass.course.title}):`, { lines, links: [{ label: "Mở lớp", href: `/quan-ly/lop/${klass.id}` }] });
  }
  const teachers = await db.user.findMany({ where: { role: "TEACHER", status: "ACTIVE" }, select: { id: true, fullName: true } });
  const named = matchPeople(teachers, ctx.text, ctx.hints.teacher);
  if (named.length > 0) {
    const owned = await db.class.findMany({
      where: { teacherId: { in: named.map((t) => t.id) }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, teacherId: true, weekdays: true, startTime: true, endTime: true, room: { select: { name: true } }, course: { select: { title: true } } },
    });
    const lines = named.flatMap((t) => {
      const mine = owned.filter((c) => c.teacherId === t.id);
      return mine.length === 0 ? [`GV ${t.fullName}: chưa phụ trách lớp nào đang mở/đang học.`] : mine.map((c) => `GV ${t.fullName} · ${c.code} (${c.course.title}) · ${formatSchedule(c.weekdays, c.startTime, c.endTime)}${c.room?.name ? ` · ${c.room.name}` : ""}`);
    });
    return reply("mgr_class_teacher", "Các lớp của giáo viên được hỏi:", { lines });
  }
  // Không nêu lớp/giáo viên cụ thể: liệt kê lớp hôm nay kèm giáo viên.
  const range = dayRange(now, ctx.day.offset);
  const sessions = await listSessionsInRange(actor, range.from, range.to);
  if (sessions.length === 0) return reply("mgr_class_teacher", `${dayLabel(ctx.day.offset)} không có lớp nào. Bạn có thể nêu mã lớp (vd. ${classes[0]?.code ?? "TOAN9-K1"}) để biết giáo viên phụ trách.`);
  return reply("mgr_class_teacher", `Bạn chưa nêu mã lớp. ${dayLabel(ctx.day.offset)} có các lớp sau:`, { lines: sessions.slice(0, 20).map((s) => sessionLine(s, { teacher: true })) });
}

async function mgrClassSize(ctx: Ctx): Promise<Reply> {
  if (!isManager(ctx.actor)) throw new ForbiddenError();
  const classes = await listClasses(ctx.actor);
  const klass = matchClassCode(classes, ctx.classCode, ctx.text, ctx.hints.classCode);
  if (klass) {
    const free = Math.max(0, klass.capacity - klass._count.enrollments);
    return reply("mgr_class_size", `Lớp ${klass.code}: ${klass._count.enrollments}/${klass.capacity} học viên, còn ${free} chỗ.`, { links: [{ label: "Mở lớp", href: `/quan-ly/lop/${klass.id}` }] });
  }
  const open = classes.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS").sort((a, b) => b.capacity - b._count.enrollments - (a.capacity - a._count.enrollments));
  if (open.length === 0) return reply("mgr_class_size", "Hiện không có lớp nào đang mở.");
  return reply("mgr_class_size", "Bạn chưa nêu mã lớp. Các lớp còn nhiều chỗ nhất:", { lines: open.slice(0, 10).map((c) => `${c.code} (${c.course.title}): ${c._count.enrollments}/${c.capacity} — còn ${Math.max(0, c.capacity - c._count.enrollments)} chỗ`) });
}

async function mgrRooms(ctx: Ctx): Promise<Reply> {
  if (!isManager(ctx.actor)) throw new ForbiddenError();
  const { now } = ctx;
  const [rooms, busy] = await Promise.all([
    db.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true } }),
    db.classSession.findMany({
      where: { status: { not: "CANCELLED" }, startsAt: { lte: now }, endsAt: { gt: now }, roomId: { not: null } },
      select: { roomId: true, endsAt: true, class: { select: { code: true } } },
    }),
  ]);
  const busyBy = new Map(busy.map((b) => [b.roomId, b]));
  const free = rooms.filter((r) => !busyBy.has(r.id));
  const lines = [
    ...free.map((r) => `Trống: ${r.name} (${r.capacity} chỗ)`),
    ...rooms.filter((r) => busyBy.has(r.id)).map((r) => `Đang dùng: ${r.name} — lớp ${busyBy.get(r.id)!.class.code}, đến ${formatTime(busyBy.get(r.id)!.endsAt)}`),
  ];
  return reply("mgr_rooms", free.length === 0 ? "Lúc này không còn phòng nào trống." : `Lúc này có ${free.length}/${rooms.length} phòng đang trống:`, { lines, links: [{ label: "Mở lịch tổng", href: "/quan-ly/lich" }] });
}

async function mgrLeads(ctx: Ctx): Promise<Reply> {
  const { newCount, overdueCount } = await leadCounts(ctx.actor);
  return reply("mgr_leads", `Có ${newCount} lead mới chưa xử lý${overdueCount > 0 ? `, trong đó ${overdueCount} lead quá 24 giờ chưa liên hệ` : ""}.`, { links: [{ label: "Mở danh sách lead", href: "/quan-ly/lead" }] });
}

async function mgrRequests(ctx: Ctx): Promise<Reply> {
  const [leave, schedule] = await Promise.all([countPendingLeaveRequests(ctx.actor), countPendingScheduleRequests(ctx.actor)]);
  return reply("mgr_requests", leave + schedule === 0 ? "Không có đơn nào đang chờ duyệt." : `Đang chờ duyệt: ${leave} đơn xin nghỉ của học sinh, ${schedule} đề xuất của giáo viên.`, {
    links: [{ label: "Mở đề xuất & đơn nghỉ", href: "/quan-ly/de-xuat" }],
  });
}

async function mgrAttendanceMissing(ctx: Ctx): Promise<Reply> {
  const missing = await sessionsWithoutAttendance(ctx.actor, ctx.now, 3);
  if (missing.length === 0) return reply("mgr_attendance_missing", "Mọi buổi học 3 ngày qua đều đã được điểm danh.");
  return reply("mgr_attendance_missing", `Có ${missing.length} buổi đã diễn ra nhưng chưa điểm danh:`, { lines: missing.slice(0, 15).map((s) => sessionLine(s, { date: true, teacher: true })) });
}

/* ───────── Chung ───────── */

async function contactCenter(ctx: Ctx): Promise<Reply> {
  void ctx;
  return reply("contact_center", "Về học phí, đăng ký khóa học và tư vấn, anh/chị vui lòng liên hệ trung tâm để được báo giá chính xác:", {
    lines: [`Hotline/Zalo: ${SITE.hotline}`, `Email: ${SITE.email}`, `Địa chỉ: ${SITE.address}`],
    links: [
      { label: "Xem các khóa học", href: "/khoa-hoc" },
      { label: "Đăng ký học thử", href: "/dang-ky-hoc-thu" },
    ],
  });
}

function chipChoices(role: Role): ChatChoice[] {
  return suggestionsForRole(role, 6).map((s) => ({ label: s.label, intent: s.intent }));
}

async function help(ctx: Ctx): Promise<Reply> {
  const lines = intentsForRole(ctx.actor.role)
    .filter((i) => !["help", "greeting"].includes(i.id))
    .map((i) => intentLabel(i, ctx.actor.role));
  return reply("help", "Mình trả lời nhanh bằng dữ liệu thật của hệ thống, trong phạm vi tài khoản của bạn. Bạn có thể hỏi:", { lines, choices: chipChoices(ctx.actor.role) });
}

async function greeting(ctx: Ctx): Promise<Reply> {
  return reply("greeting", `Xin chào ${ctx.actor.fullName}! Mình là trợ lý của Core Link Academy. Bạn muốn hỏi gì?`, { choices: chipChoices(ctx.actor.role) });
}

export function unknownAnswer(role: Role): Reply {
  return reply("unknown", "Mình chưa hiểu câu hỏi này. Bạn thử bấm một câu gợi ý bên dưới, hoặc hỏi ngắn gọn hơn nhé.", {
    choices: chipChoices(role),
    links: [{ label: "Nhắn tin với trung tâm", href: "/tin-nhan" }],
  });
}

type Handler = (ctx: Ctx) => Promise<Reply>;

const HANDLERS: Record<string, Handler> = {
  learner_today: learnerToday,
  learner_score: learnerScore,
  learner_progress: learnerProgress,
  learner_homework: learnerHomework,
  learner_schedule: learnerSchedule,
  learner_attendance_rate: learnerAttendanceRate,
  learner_teacher: learnerTeacher,
  learner_leave: learnerLeave,
  learner_evaluation: learnerEvaluation,
  learner_notifications: learnerNotifications,
  teacher_today: teacherToday,
  teacher_lesson: teacherLesson,
  teacher_next: teacherNext,
  teacher_attendance_todo: teacherAttendanceTodo,
  teacher_grading: teacherGrading,
  teacher_absence: (ctx) => absenceAlerts(ctx, "teacher_absence"),
  teacher_requests: teacherRequests,
  mgr_today: mgrToday,
  mgr_class_teacher: mgrClassTeacher,
  mgr_class_size: mgrClassSize,
  mgr_rooms: mgrRooms,
  mgr_leads: mgrLeads,
  mgr_requests: mgrRequests,
  mgr_attendance_missing: mgrAttendanceMissing,
  mgr_absence: (ctx) => absenceAlerts(ctx, "mgr_absence"),
  contact_center: contactCenter,
  help,
  greeting,
};

/** Chạy ý định (đã kiểm tra thuộc vai trò). Sai phạm vi → câu trả lời "không tìm thấy" (không lộ sự tồn tại dữ liệu). */
export async function runIntent(intentId: string, ctx: Ctx): Promise<Reply> {
  const def = intentById(intentId);
  const handler = HANDLERS[intentId];
  if (!def || !handler || !def.roles.includes(ctx.actor.role)) return unknownAnswer(ctx.actor.role);
  try {
    return await handler(ctx);
  } catch (error) {
    if (error instanceof ForbiddenError) return NOT_FOUND(intentId);
    throw error;
  }
}
