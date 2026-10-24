import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { LearnerSessionView } from "@/components/schedule/learner-session";
import { Card } from "@/components/ui/feedback";
import { getSessionForLearner } from "@/server/academic/learner";
import { requireLearner } from "@/server/auth/learner";
import { orNotFound } from "@/server/page";
import { createLeaveRequestAction } from "@/server/requests/actions";

// FR-039, FR-044: chi tiết buổi học; phụ huynh còn gửi được đơn xin nghỉ trước giờ học.
// `?con=` có trong liên kết thông báo cũ → đổi sang đúng con rồi quay lại buổi này.
export async function LearnerSessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ con?: string; thongbao?: string }> }) {
  const { id } = await params;
  const { con, thongbao } = await searchParams;
  const { viewer, student, base, isParent } = await requireLearner({ con, den: `/phu-huynh/buoi/${id}${thongbao ? `?thongbao=${encodeURIComponent(thongbao)}` : ""}` });
  const s = await orNotFound(getSessionForLearner(student, id, student.id, viewer));
  const canRequest = isParent && s.status === "SCHEDULED" && s.startsAt > new Date() && !s.leaveRequests.some((r) => r.status === "PENDING" || r.status === "APPROVED");

  return (
    <>
      <Flash code={thongbao} />
      <LearnerSessionView
        s={s}
        backHref={`${base}/lich`}
        backLabel="Lịch học"
        extra={
          canRequest ? (
            <Card title="Xin nghỉ buổi này">
              <ConfigForm
                action={createLeaveRequestAction}
                hidden={{ studentId: student.id, sessionId: s.id }}
                submitLabel="Gửi đơn xin nghỉ"
                fields={[{ type: "textarea", name: "reason", label: "Lý do", required: true, maxLength: 500, rows: 3 }]}
              />
              <p className="mt-3 text-sm text-muted">Giáo viên lớp hoặc trung tâm sẽ duyệt. Khi được duyệt, buổi học được ghi &ldquo;Có phép&rdquo;.</p>
            </Card>
          ) : undefined
        }
      />
    </>
  );
}
