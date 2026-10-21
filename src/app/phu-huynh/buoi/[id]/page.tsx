import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { LearnerSessionView } from "@/components/schedule/learner-session";
import { Card } from "@/components/ui/feedback";
import { getSessionForLearner } from "@/server/academic/learner";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { createLeaveRequestAction } from "@/server/requests/actions";

export const metadata: Metadata = { title: "Buổi học của con" };

// FR-039, FR-044: phụ huynh xem chi tiết buổi học của con và gửi đơn xin nghỉ trước giờ học.
export default async function ParentSessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ con?: string; thongbao?: string }> }) {
  const actor = await requireRole("PARENT");
  const { con, thongbao } = await searchParams;
  if (typeof con !== "string" || con.length > 40) notFound();
  const s = await orNotFound(getSessionForLearner(actor, (await params).id, con));
  const canRequest = s.status === "SCHEDULED" && s.startsAt > new Date() && !s.leaveRequests.some((r) => r.status === "PENDING" || r.status === "APPROVED");

  return (
    <>
      <Flash code={thongbao} />
      <LearnerSessionView
        s={s}
        backHref={`/phu-huynh?con=${con}`}
        backLabel="Theo dõi con"
        extra={
          canRequest ? (
            <Card title="Xin nghỉ buổi này">
              <ConfigForm
                action={createLeaveRequestAction}
                hidden={{ studentId: con, sessionId: s.id }}
                submitLabel="Gửi đơn xin nghỉ"
                fields={[{ type: "textarea", name: "reason", label: "Lý do", required: true, maxLength: 500, rows: 3 }]}
              />
              <p className="mt-3 text-sm text-muted">Giáo viên lớp hoặc giáo vụ sẽ duyệt. Khi được duyệt, buổi học được ghi &ldquo;Có phép&rdquo;.</p>
            </Card>
          ) : undefined
        }
      />
    </>
  );
}
