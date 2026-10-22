import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
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
  const initials = me.fullName.trim().split(" ").slice(-1)[0]?.[0] ?? "U";

  const info: [string, string][] = [
    ["Họ và tên", me.fullName],
    ["Vai trò hệ thống", ROLE_LABELS[me.role]],
    ...(me.studentCode ? ([["Mã học sinh", me.studentCode]] as [string, string][]) : []),
    ...(me.gradeLevel !== null ? ([["Khối lớp", me.gradeLevel === 0 ? "Tiền tiểu học" : `Lớp ${me.gradeLevel}`]] as [string, string][]) : []),
    ...(me.expertise ? ([["Chuyên môn", me.expertise]] as [string, string][]) : []),
    ...(me.dateOfBirth ? ([["Ngày sinh", formatDate(me.dateOfBirth)]] as [string, string][]) : []),
    ["Ngày tham gia", formatDate(me.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ &amp; Tài khoản"
        description="Thông tin cá nhân và tài khoản truy cập hệ thống CoreLink Academy. Bạn có thể tự cập nhật email, số điện thoại và địa chỉ liên lạc."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Hồ sơ cá nhân">
          {/* Avatar & Header */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-paper p-4 border border-line">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent font-heading text-xl font-bold text-white shadow-md">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">{me.fullName}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                  {ROLE_LABELS[me.role]}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                  <ShieldCheck className="size-3.5" />
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {info.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line/70 bg-paper/40 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
                <dd className="mt-1 font-bold text-ink text-sm sm:text-base">{v}</dd>
              </div>
            ))}
          </dl>

          {me.childLinks.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-paper p-3.5 text-xs text-muted">
              <span className="font-bold text-ink block mb-1">Học sinh được liên kết:</span>
              <span>
                {me.childLinks
                  .map((l) => `${l.student.fullName}${l.student.studentCode ? ` (${l.student.studentCode})` : ""}`)
                  .join(", ")}
              </span>
            </div>
          )}

          {me.parentLinks.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-paper p-3.5 text-xs text-muted">
              <span className="font-bold text-ink block mb-1">Phụ huynh liên kết:</span>
              <span>
                {me.parentLinks
                  .map((l) => `${l.parent.fullName}${l.parent.phone ? ` · ${formatPhone(l.parent.phone)}` : ""}`)
                  .join("; ")}
              </span>
            </div>
          )}

          <div className="mt-5 border-t border-line/70 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted">Bảo mật tài khoản:</span>
            <Link
              href="/doi-mat-khau"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <KeyRound className="size-3.5" />
              <span>Đổi mật khẩu</span>
            </Link>
          </div>
        </Card>

        <Card title="Cập nhật thông tin liên hệ">
          <ConfigForm
            action={updateMyContactAction}
            submitLabel="Lưu thông tin liên hệ"
            fields={[
              {
                type: "email",
                name: "email",
                label: "Email đăng nhập",
                maxLength: 191,
                defaultValue: me.email ?? "",
              },
              {
                type: "tel",
                name: "phone",
                label: "Số điện thoại liên hệ",
                maxLength: 20,
                defaultValue: me.phone ? formatPhone(me.phone) : "",
              },
              {
                type: "text",
                name: "address",
                label: "Địa chỉ cư trú",
                maxLength: 255,
                defaultValue: me.address ?? "",
              },
              {
                type: "password",
                name: "currentPassword",
                label: "Mật khẩu hiện tại",
                hint: "Bắt buộc nhập mật khẩu khi thay đổi email hoặc số điện thoại.",
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
