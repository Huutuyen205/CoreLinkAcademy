import type { Metadata } from "next";
import { SessionAttendance } from "@/components/attendance/session-attendance";
import { ConfigForm } from "@/components/forms/config-form";
import { Card } from "@/components/ui/feedback";
import { cancelSessionAction, rescheduleSessionAction } from "@/server/academic/actions";
import { assignSessionTeacherAction, setSessionRoomAction } from "@/server/academic/operations-actions";
import { classFormOptions } from "@/server/academic/service";
import { getSessionForAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { formatTime, vnDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "Buổi học" };

// FR-024: Staff/Admin sửa điểm danh, ngoài khung bắt buộc lý do + audit.
// Admin §7: quản lý buổi ngay tại đây (mở từ Lịch tổng) — đổi giáo viên, đổi phòng, dời giờ, ghi nhận nghỉ/hủy.
export default async function ManageSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN");
  const [data, options] = await Promise.all([orNotFound(getSessionForAttendance(actor, (await params).id)), classFormOptions(actor)]);
  const s = data.session;
  const editable = s.status === "SCHEDULED" && s.startsAt > new Date();

  return (
    <>
      <SessionAttendance data={data} backHref={`/quan-ly/lop/${s.classId}`} backLabel="Về lớp" />
      {editable && (
        <Card title="Quản lý buổi học" className="mt-6" id="quan-ly-buoi">
          <p className="mb-4 text-sm text-muted">Mọi thay đổi đều kiểm tra trùng lịch giáo viên/phòng và gửi thông báo cho giáo viên, học sinh, phụ huynh của lớp.</p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ConfigForm
              action={assignSessionTeacherAction}
              hidden={{ sessionId: s.id }}
              submitLabel="Đổi giáo viên"
              submitVariant="secondary"
              fields={[
                { type: "select", name: "teacherId", label: "Giáo viên dạy buổi này", required: true, options: options.teachers.map((t) => ({ value: t.id, label: t.fullName })), defaultValue: s.teacherId },
                { type: "text", name: "note", label: "Ghi chú (tùy chọn)", maxLength: 255 },
              ]}
            />
            <ConfigForm
              action={setSessionRoomAction}
              hidden={{ sessionId: s.id }}
              submitLabel="Đổi phòng"
              submitVariant="secondary"
              fields={[
                {
                  type: "select",
                  name: "roomId",
                  label: "Phòng",
                  placeholder: "Chưa xếp phòng",
                  options: options.rooms.map((r) => ({ value: r.id, label: `${r.name} (${r.capacity} chỗ)` })),
                  defaultValue: s.roomId ?? "",
                },
              ]}
            />
            <ConfigForm
              action={rescheduleSessionAction}
              hidden={{ sessionId: s.id }}
              submitLabel="Dời buổi"
              submitVariant="secondary"
              fields={[
                { type: "date", name: "date", label: "Ngày mới", required: true, defaultValue: vnDateKey(s.startsAt) },
                { type: "time", name: "startTime", label: "Bắt đầu", required: true, defaultValue: formatTime(s.startsAt) },
                { type: "time", name: "endTime", label: "Kết thúc", required: true, defaultValue: formatTime(s.endsAt) },
                { type: "text", name: "reason", label: "Lý do", required: true, maxLength: 255 },
              ]}
            />
            <ConfigForm
              action={cancelSessionAction}
              hidden={{ sessionId: s.id }}
              submitLabel="Hủy buổi (nghỉ)"
              submitVariant="danger"
              confirm="Ghi nhận buổi này nghỉ/hủy? Lớp sẽ nhận thông báo."
              fields={[{ type: "text", name: "reason", label: "Lý do nghỉ / hủy", required: true, maxLength: 255 }]}
            />
          </div>
          <p className="mt-4 text-sm text-muted">Cần học bù? Mở trang lớp → &ldquo;Xếp buổi học bù&rdquo;.</p>
        </Card>
      )}
    </>
  );
}
