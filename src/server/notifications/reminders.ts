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
