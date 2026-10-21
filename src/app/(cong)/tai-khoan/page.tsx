import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { updateMyContactAction } from "@/server/account/actions";
import { getMyAccount } from "@/server/account/service";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { formatPhone } from "@/lib/phone";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Tài khoản" };

// FR-051: xem thông tin cá nhân, cập nhật thông tin liên hệ.
export default async function AccountPage() {
  const actor = await requireActor();
  const me = await getMyAccount(actor);
  const info: [string, string][] = [
    ["Họ tên", me.fullName],
    ["Vai trò", ROLE_LABELS[me.role]],
    ...(me.studentCode ? ([["Mã học sinh", me.studentCode]] as [string, string][]) : []),
    ...(me.gradeLevel !== null ? ([["Khối lớp", me.gradeLevel === 0 ? "Tiền tiểu học" : `Lớp ${me.gradeLevel}`]] as [string, string][]) : []),
    ...(me.expertise ? ([["Chuyên môn", me.expertise]] as [string, string][]) : []),
    ...(me.dateOfBirth ? ([["Ngày sinh", formatDate(me.dateOfBirth)]] as [string, string][]) : []),
    ["Tham gia từ", formatDate(me.createdAt)],
  ];

  return (
    <>
      <PageHeader title="Tài khoản của tôi" description="Họ tên, vai trò và mã học sinh do trung tâm quản lý. Bạn tự cập nhật được thông tin liên hệ." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Thông tin cá nhân">
          <dl className="grid gap-3 sm:grid-cols-2">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {me.childLinks.length > 0 && (
            <p className="mt-4 text-sm">
              Con được liên kết: {me.childLinks.map((l) => `${l.student.fullName}${l.student.studentCode ? ` (${l.student.studentCode})` : ""}`).join(", ")}
            </p>
          )}
          {me.parentLinks.length > 0 && (
            <p className="mt-4 text-sm">
              Phụ huynh: {me.parentLinks.map((l) => `${l.parent.fullName}${l.parent.phone ? ` · ${formatPhone(l.parent.phone)}` : ""}`).join("; ")}
            </p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/doi-mat-khau">Đổi mật khẩu</Link>
          </p>
        </Card>
        <Card title="Thông tin liên hệ">
          <ConfigForm
            action={updateMyContactAction}
            submitLabel="Lưu"
            fields={[
              { type: "email", name: "email", label: "Email (dùng để đăng nhập)", maxLength: 191, defaultValue: me.email ?? "" },
              { type: "tel", name: "phone", label: "Số điện thoại (dùng để đăng nhập)", maxLength: 20, defaultValue: me.phone ? formatPhone(me.phone) : "" },
              { type: "text", name: "address", label: "Địa chỉ", maxLength: 255, defaultValue: me.address ?? "" },
              { type: "password", name: "currentPassword", label: "Mật khẩu hiện tại", hint: "Bắt buộc khi đổi email hoặc số điện thoại." },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
