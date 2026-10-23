import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { IntroForm } from "@/components/people/intro-form";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { ActionButton } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { addAvailabilityAction, removeAvailabilityAction } from "@/server/people/actions";
import { getMyIntro, listAvailability } from "@/server/people/teacher";
import { REQUEST_STATUS } from "@/lib/labels";

export const metadata: Metadata = { title: "Hồ sơ giới thiệu & lịch rảnh" };

const WEEKDAYS = ["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

// Giáo viên §11A (hồ sơ giới thiệu, gửi duyệt) + §2 (đăng ký lịch rảnh). Thông tin đăng nhập / liên hệ ở /tai-khoan.
export default async function TeacherProfilePage() {
  const actor = await requireRole("TEACHER");
  const [intro, slots] = await Promise.all([getMyIntro(actor), listAvailability(actor, actor.id)]);

  return (
    <>
      <PageHeader
        title="Hồ sơ giới thiệu & lịch rảnh"
        description="Giới thiệu bản thân cho học sinh, phụ huynh (trung tâm duyệt trước khi hiển thị) và đăng ký khung giờ rảnh để giáo vụ xếp lớp, dạy thay."
        action={
          <Link href="/tai-khoan" className="text-sm">
            Thông tin cá nhân &amp; mật khẩu →
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Hồ sơ giới thiệu" action={intro.introStatus && <Badge tone={REQUEST_STATUS[intro.introStatus].tone}>{REQUEST_STATUS[intro.introStatus].label}</Badge>}>
          {intro.introStatus === "REJECTED" && intro.introNote && <Alert tone="warning" className="mb-4">Trung tâm phản hồi: {intro.introNote}</Alert>}
          {intro.introStatus === "PENDING" && <Alert className="mb-4">Đang chờ trung tâm duyệt. Bạn vẫn sửa được; sửa xong bấm gửi duyệt lại.</Alert>}
          <IntroForm defaultValue={intro.introDraft ?? intro.introPublished ?? ""} />
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-semibold">Bản đang hiển thị cho học sinh, phụ huynh</h3>
            {intro.introPublished ? <p className="whitespace-pre-line text-sm">{intro.introPublished}</p> : <p className="text-sm text-muted">Chưa có bản được duyệt.</p>}
          </div>
        </Card>

        <Card title={`Lịch rảnh (${slots.length})`}>
          {slots.length === 0 ? (
            <EmptyState message="Chưa đăng ký khung giờ rảnh." />
          ) : (
            <ul className="mb-4 divide-y divide-line">
              {slots.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <strong>{WEEKDAYS[s.weekday]}</strong> {s.startTime}–{s.endTime}
                    {s.note && <span className="block text-sm text-muted">{s.note}</span>}
                  </span>
                  <ActionButton action={removeAvailabilityAction} hidden={{ slotId: s.id }} icon="delete" tone="danger" confirm="Xóa khung giờ này?">
                    Xóa
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
          <ConfigForm
            action={addAvailabilityAction}
            submitLabel="Thêm khung giờ"
            submitVariant="secondary"
            columns={2}
            fields={[
              { type: "select", name: "weekday", label: "Thứ", required: true, placeholder: "Chọn", options: WEEKDAYS.slice(1).map((w, i) => ({ value: String(i + 1), label: w })) },
              { type: "text", name: "note", label: "Ghi chú (tùy chọn)", maxLength: 200 },
              { type: "time", name: "startTime", label: "Từ", required: true, defaultValue: "18:00" },
              { type: "time", name: "endTime", label: "Đến", required: true, defaultValue: "21:00" },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
