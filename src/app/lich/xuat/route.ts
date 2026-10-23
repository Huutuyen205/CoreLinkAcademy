// Xuất lịch học/dạy 60 ngày tới ra tệp .ics (FEAT-B5) — mở bằng Google Calendar, Lịch iPhone, Outlook.
// Kiểm tra phiên + phạm vi như trang lịch (`listSessionsInRange`): PH phải chọn con đã liên kết.
import { listSessionsInRange } from "@/server/academic/service";
import { linkedStudentIds } from "@/server/auth/scope";
import { getCurrentActor } from "@/server/auth/session";
import { ForbiddenError } from "@/server/errors";
import { buildIcs } from "@/lib/ical";

const DAYS = 60;

export async function GET(request: Request) {
  const actor = await getCurrentActor();
  if (!actor || actor.mustChangePassword) return Response.redirect(new URL("/dang-nhap", request.url), 303);
  if (actor.role !== "TEACHER" && actor.role !== "STUDENT" && actor.role !== "PARENT") return new Response("Không tìm thấy.", { status: 404 });

  let studentId: string | undefined;
  if (actor.role === "PARENT") {
    const children = await linkedStudentIds(actor.id);
    studentId = new URL(request.url).searchParams.get("con") ?? children[0];
    if (!studentId) return new Response("Chưa liên kết học sinh.", { status: 404 });
  }
  const from = new Date(Date.now() - 24 * 3600_000);
  const to = new Date(Date.now() + DAYS * 24 * 3600_000);
  try {
    const sessions = await listSessionsInRange(actor, from, to, studentId);
    const ics = buildIcs(
      "CoreLink Academy — lịch học",
      sessions.map((s) => ({
        uid: s.id,
        start: s.startsAt,
        end: s.endsAt,
        summary: `${s.class.code} · ${s.class.course.title}`,
        location: s.room?.name ? `CoreLink Academy — ${s.room.name}` : "CoreLink Academy",
        description: `Giáo viên: ${s.teacher.fullName}${s.cancelReason ? `\nĐã hủy: ${s.cancelReason}` : ""}`,
        cancelled: s.status === "CANCELLED",
      })),
    );
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lich-hoc-corelink.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) return new Response("Không tìm thấy.", { status: 404 });
    throw error;
  }
}
