import type { Role } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { orNotFound } from "@/server/page";
import { setUserStatusAction, updateUserAction, unlinkGuardianAction } from "@/server/users/actions";
import { getUser } from "@/server/users/service";
import { GRADE_OPTIONS, USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Người dùng" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN");
  const user = await orNotFound(getUser(actor, (await params).id));
  const isSelf = user.id === actor.id;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/nguoi-dung">← Người dùng</Link>
      </p>
      <PageHeader
        title={user.fullName}
        description={`${ROLE_LABELS[user.role]}${user.studentCode ? ` · ${user.studentCode}` : ""} · tạo ${formatDateTime(user.createdAt)}`}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone={USER_STATUS[user.status].tone}>{USER_STATUS[user.status].label}</Badge>
            {user.mustChangePassword && <Badge tone="warning">Chưa đổi mật khẩu tạm</Badge>}
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Thông tin">
            <ConfigForm
              action={updateUserAction}
              hidden={{ userId: user.id }}
              submitLabel="Lưu"
              columns={2}
              fields={[
                { type: "text", name: "fullName", label: "Họ tên", required: true, maxLength: 120, defaultValue: user.fullName },
                {
                  type: "select",
                  name: "role",
                  label: "Vai trò",
                  required: true,
                  hint: isSelf ? "Bạn không thể tự đổi vai trò của mình." : "Đổi vai trò được ghi nhật ký và đăng xuất người dùng.",
                  options: (isSelf ? [user.role] : (Object.keys(ROLE_LABELS) as Role[])).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
                  defaultValue: user.role,
                },
                { type: "email", name: "email", label: "Email", maxLength: 191, defaultValue: user.email ?? "" },
                { type: "tel", name: "phone", label: "Số điện thoại", maxLength: 20, defaultValue: user.phone ? formatPhone(user.phone) : "" },
                { type: "select", name: "gradeLevel", label: "Khối lớp (học sinh)", placeholder: "—", options: GRADE_OPTIONS, defaultValue: user.gradeLevel ? String(user.gradeLevel) : "" },
              ]}
            />
          </Card>

          {user.role === "STUDENT" && (
            <Card title="Phụ huynh đã liên kết">
              {user.parentLinks.length === 0 ? (
                <p className="text-muted">Chưa liên kết phụ huynh. Liên kết trong mục <Link href={`/quan-ly/hoc-vien?q=${user.studentCode ?? ""}`}>Học viên</Link>.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {user.parentLinks.map(({ parent }) => (
                    <li key={parent.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link href={`/quan-ly/nguoi-dung/${parent.id}`}>
                        {parent.fullName}
                        {parent.phone ? ` · ${formatPhone(parent.phone)}` : ""}
                      </Link>
                      <ConfigForm action={unlinkGuardianAction} hidden={{ parentId: parent.id, studentId: user.id }} submitLabel="Bỏ liên kết" submitVariant="secondary" confirm="Bỏ liên kết phụ huynh này?" fields={[]} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {user.role === "PARENT" && (
            <Card title="Con đã liên kết">
              {user.childLinks.length === 0 ? (
                <p className="text-muted">Chưa liên kết học sinh nào.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {user.childLinks.map(({ student }) => (
                    <li key={student.id} className="py-2">
                      <Link href={`/quan-ly/nguoi-dung/${student.id}`}>
                        {student.fullName} {student.studentCode ? `(${student.studentCode})` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Mật khẩu">
            <ResetPasswordForm userId={user.id} fullName={user.fullName} />
          </Card>
          {!isSelf && (
            <Card title="Khóa tài khoản">
              {user.status === "ACTIVE" ? (
                <ConfigForm
                  action={setUserStatusAction}
                  hidden={{ userId: user.id, status: "DISABLED" }}
                  submitLabel="Khóa tài khoản"
                  submitVariant="danger"
                  confirm="Khóa tài khoản này? Người dùng bị đăng xuất ngay."
                  fields={[]}
                />
              ) : (
                <ConfigForm action={setUserStatusAction} hidden={{ userId: user.id, status: "ACTIVE" }} submitLabel="Mở khóa" fields={[]} />
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
