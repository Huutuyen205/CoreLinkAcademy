// Nhắc lịch học ngày mai (FEAT-B4, DECISION-D32): chạy hằng ngày bằng Vercel Cron, hoặc quản lý bấm gửi ngay.
// Mỗi người một thông báo gộp mọi buổi ngày mai; không gửi lại cho cùng một ngày.
import { db } from "@/server/db";
import { notifyUsers } from "@/server/notifications/service";
import { addDays } from "@/lib/schedule";
import { formatTime, formatVn, vnDateKey, vnToUtc } from "@/lib/time";

export const REMINDER_KIND = "schedule_reminder";

/** Tiêu đề cố định theo ngày → dùng để không gửi trùng. */
export function reminderTitle(dayKey: string): string {
  const [y, m, d] = dayKey.split("-");
  return `Lịch học ngày mai (${d}/${m}/${y})`;
}

/** Gom dòng nhắc theo người nhận: GV của buổi, HS đang học, PH của HS (kèm tên con). Hàm thuần. */
export function buildReminderLines(
  sessions: {
    startsAt: Date;
    endsAt: Date;
    teacherId: string;
    roomName: string | null;
    classCode: string;
    courseTitle: string;
    students: { id: string; fullName: string; parentIds: string[] }[];
  }[],
): Map<string, string[]> {
  const lines = new Map<string, string[]>();
  const push = (userId: string, line: string) => {
    const list = lines.get(userId) ?? [];
    if (!list.includes(line)) list.push(line);
    lines.set(userId, list);
  };
  for (const s of sessions) {
    const base = `${formatTime(s.startsAt)}–${formatTime(s.endsAt)} · ${s.classCode} (${s.courseTitle})${s.roomName ? ` · ${s.roomName}` : ""}`;
    push(s.teacherId, `${base} · ${s.students.length} học sinh`);
    for (const st of s.students) {
      push(st.id, base);
      for (const p of st.parentIds) push(p, `${st.fullName}: ${base}`);
    }
  }
  return lines;
}

/** Gửi nhắc cho các buổi chưa hủy của ngày mai (giờ VN). Trả số người nhận mới. */
export async function sendTomorrowReminders(now = new Date()): Promise<{ day: string; sessions: number; recipients: number }> {
  const day = addDays(vnDateKey(now), 1);
  const from = vnToUtc(day, "00:00");
  const to = vnToUtc(addDays(day, 1), "00:00");
  const sessions = await db.classSession.findMany({
    where: { startsAt: { gte: from, lt: to }, status: "SCHEDULED", class: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
    orderBy: { startsAt: "asc" },
    select: {
      startsAt: true,
      endsAt: true,
      teacherId: true,
      room: { select: { name: true } },
      class: {
        select: {
          code: true,
          course: { select: { title: true } },
          enrollments: {
            where: { status: "ACTIVE", student: { status: "ACTIVE" } },
            select: { student: { select: { id: true, fullName: true, parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
          },
        },
      },
    },
  });
  const lines = buildReminderLines(
    sessions.map((s) => ({
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      teacherId: s.teacherId,
      roomName: s.room?.name ?? null,
      classCode: s.class.code,
      courseTitle: s.class.course.title,
      students: s.class.enrollments.map((e) => ({ id: e.student.id, fullName: e.student.fullName, parentIds: e.student.parentLinks.map((l) => l.parentId) })),
    })),
  );
  const title = reminderTitle(day);
  const already = new Set(
    (await db.notification.findMany({ where: { kind: REMINDER_KIND, title, userId: { in: [...lines.keys()] } }, select: { userId: true } })).map((n) => n.userId),
  );
  // Gom người nhận có cùng nội dung để mỗi nhóm một lệnh ghi.
  const byBody = new Map<string, string[]>();
  for (const [userId, list] of lines) {
    if (already.has(userId)) continue;
    const body = `${formatVn(from, "EEEE dd/MM")}:\n${list.join("\n")}`;
    byBody.set(body, [...(byBody.get(body) ?? []), userId]);
  }
  let recipients = 0;
  await db.$transaction(async (tx) => {
    for (const [body, userIds] of byBody) {
      recipients += await notifyUsers(tx, userIds, { kind: REMINDER_KIND, title, body, link: "/lich" });
    }
  }, { timeout: 20_000 });
  return { day, sessions: sessions.length, recipients };
}

/**
 * Nhắc bài tập (HS §7): chạy cùng cron 19:00.
 * - "due_soon": bài đang giao, hạn trong 24 giờ tới, HS chưa nộp → báo HS.
 * - "overdue": bài đã quá hạn trong 48 giờ qua, HS chưa nộp → báo HS + PH.
 * Mỗi (người, bài, loại) chỉ báo một lần (so `kind` + `link`).
 */
export async function sendAssignmentReminders(now = new Date()): Promise<{ dueSoon: number; overdue: number }> {
  const soon = new Date(now.getTime() + 24 * 3600_000);
  const past = new Date(now.getTime() - 48 * 3600_000);
  const assignments = await db.assignment.findMany({
    where: { status: "PUBLISHED", dueAt: { gt: past, lte: soon }, class: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
    select: {
      id: true,
      title: true,
      dueAt: true,
      class: {
        select: {
          code: true,
          enrollments: {
            where: { status: "ACTIVE", student: { status: "ACTIVE" } },
            select: { studentId: true, student: { select: { parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
          },
        },
      },
      submissions: { where: { status: { not: "IN_PROGRESS" } }, select: { studentId: true } },
    },
  });
  let dueSoon = 0;
  let overdue = 0;
  await db.$transaction(async (tx) => {
    for (const a of assignments) {
      const done = new Set(a.submissions.map((s) => s.studentId));
      const pending = a.class.enrollments.filter((e) => !done.has(e.studentId));
      if (pending.length === 0) continue;
      const link = `/hoc-sinh/bai-tap/${a.id}`;
      const isOverdue = a.dueAt <= now;
      const kind = isOverdue ? "overdue" : "due_soon";
      const already = new Set(
        (await tx.notification.findMany({ where: { kind, link: { in: [link, `/phu-huynh/bai-tap#${a.id}`] } }, select: { userId: true } })).map((n) => n.userId),
      );
      const students = pending.map((p) => p.studentId).filter((id) => !already.has(id));
      const due = formatVn(a.dueAt, "HH:mm dd/MM");
      if (isOverdue) {
        overdue += await notifyUsers(tx, students, { kind, title: `Quá hạn chưa nộp: ${a.title}`, body: `Lớp ${a.class.code} · hạn ${due}. Em chưa nộp bài này.`, link });
        const parents = pending.flatMap((p) => p.student.parentLinks.map((l) => l.parentId)).filter((id) => !already.has(id));
        overdue += await notifyUsers(tx, parents, { kind, title: `Con chưa nộp bài quá hạn: ${a.title}`, body: `Lớp ${a.class.code} · hạn ${due}.`, link: `/phu-huynh/bai-tap#${a.id}` });
      } else {
        dueSoon += await notifyUsers(tx, students, { kind, title: `Sắp đến hạn nộp: ${a.title}`, body: `Lớp ${a.class.code} · hạn ${due}. Em chưa nộp bài.`, link });
      }
    }
  }, { timeout: 30_000 });
  return { dueSoon, overdue };
}

export const SESSION_SOON_KIND = "session_soon";
/** Nhắc trước giờ học/dạy bao nhiêu phút. */
export const SESSION_SOON_MINUTES = 60;

type SoonSession = {
  id: string;
  startsAt: Date;
  classCode: string;
  roomName: string | null;
  teacherId: string;
  students: { id: string; fullName: string; parentIds: string[]; onLeave: boolean }[];
};

/** Người nhận nhắc "sắp đến giờ": GV, HS, PH (gộp các con học cùng buổi). Em đã có đơn nghỉ được duyệt thì không nhắc. Hàm thuần. */
export function buildSoonRecipients(sessions: SoonSession[], now: Date): { userId: string; link: string; title: string; body: string }[] {
  const out: { userId: string; link: string; title: string; body: string }[] = [];
  for (const s of sessions) {
    const mins = Math.max(1, Math.round((s.startsAt.getTime() - now.getTime()) / 60_000));
    const when = `${formatTime(s.startsAt)} (còn khoảng ${mins} phút)`;
    const where = `Lớp ${s.classCode}${s.roomName ? ` · ${s.roomName}` : ""}`;
    const attending = s.students.filter((st) => !st.onLeave);
    out.push({ userId: s.teacherId, link: `/giao-vien/buoi/${s.id}`, title: `Sắp đến giờ dạy: lớp ${s.classCode}`, body: `${where}. Bắt đầu lúc ${when}. ${s.students.length} học sinh.` });
    for (const st of attending) {
      out.push({ userId: st.id, link: `/hoc-sinh/buoi/${s.id}`, title: `Sắp đến giờ học: lớp ${s.classCode}`, body: `${where}. Bắt đầu lúc ${when}.` });
    }
    const byParent = new Map<string, typeof attending>();
    for (const st of attending) for (const p of st.parentIds) byParent.set(p, [...(byParent.get(p) ?? []), st]);
    for (const [parentId, kids] of byParent) {
      const names = kids.map((k) => k.fullName).join(", ");
      out.push({ userId: parentId, link: `/phu-huynh/buoi/${s.id}?con=${kids[0]!.id}`, title: `Sắp đến giờ học của ${names}`, body: `${where}. Bắt đầu lúc ${when}.` });
    }
  }
  return out;
}

let lastSoonRun = 0;

/**
 * Nhắc "sắp đến giờ học / dạy" cho các buổi bắt đầu trong SESSION_SOON_MINUTES phút tới.
 * Chạy từ cron (nếu có) và từ lần máy khách hỏi thông báo mới (`throttleMs` để không quét quá dày) — nên không phụ thuộc cron.
 * Mỗi (người, buổi) chỉ một lần: khóa tư vấn Postgres chặn hai tiến trình cùng quét, rồi so `kind` + `link`.
 */
export async function sendUpcomingSessionReminders(now = new Date(), throttleMs = 0): Promise<{ sessions: number; recipients: number }> {
  if (throttleMs > 0 && now.getTime() - lastSoonRun < throttleMs) return { sessions: 0, recipients: 0 };
  lastSoonRun = now.getTime();
  const until = new Date(now.getTime() + SESSION_SOON_MINUTES * 60_000);
  const sessions = await db.classSession.findMany({
    where: { startsAt: { gt: now, lte: until }, status: "SCHEDULED", class: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
    select: {
      id: true,
      startsAt: true,
      teacherId: true,
      room: { select: { name: true } },
      leaveRequests: { where: { status: "APPROVED" }, select: { studentId: true } },
      class: {
        select: {
          code: true,
          enrollments: {
            where: { status: "ACTIVE", student: { status: "ACTIVE" } },
            select: { student: { select: { id: true, fullName: true, parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
          },
        },
      },
    },
  });
  if (sessions.length === 0) return { sessions: 0, recipients: 0 };
  const items = buildSoonRecipients(
    sessions.map((s) => {
      const leave = new Set(s.leaveRequests.map((l) => l.studentId));
      return {
        id: s.id,
        startsAt: s.startsAt,
        classCode: s.class.code,
        roomName: s.room?.name ?? null,
        teacherId: s.teacherId,
        students: s.class.enrollments.map((e) => ({ id: e.student.id, fullName: e.student.fullName, parentIds: e.student.parentLinks.map((l) => l.parentId), onLeave: leave.has(e.student.id) })),
      };
    }),
    now,
  );
  let recipients = 0;
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(48001)`;
      const done = await tx.notification.findMany({
        where: { kind: SESSION_SOON_KIND, link: { in: [...new Set(items.map((i) => i.link))] }, userId: { in: [...new Set(items.map((i) => i.userId))] } },
        select: { userId: true, link: true },
      });
      const sent = new Set(done.map((d) => `${d.userId}|${d.link}`));
      for (const i of items) {
        if (sent.has(`${i.userId}|${i.link}`)) continue;
        sent.add(`${i.userId}|${i.link}`);
        recipients += await notifyUsers(tx, [i.userId], { kind: SESSION_SOON_KIND, title: i.title, body: i.body, link: i.link });
      }
    },
    { timeout: 20_000 },
  );
  return { sessions: sessions.length, recipients };
}
