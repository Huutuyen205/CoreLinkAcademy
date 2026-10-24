import type { Role } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { InlinePickForm } from "@/components/forms/inline-pick-form";
import { ActionLink } from "@/components/ui/row-actions";
import { linkableStudents } from "@/server/people/service";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { ACTIVE_ROLES, ROLE_CAPABILITIES, ROLE_LABELS } from "@/server/auth/policy";
import { orNotFound } from "@/server/page";
import { linkGuardianAction, setUserStatusAction, updateUserAction, unlinkGuardianAction } from "@/server/users/actions";
import { getUser, listParents } from "@/server/users/service";
import { GRADE_OPTIONS, USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Người dùng" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN");
  const user = await orNotFound(getUser(actor, (await params).id));
  const isSelf = user.id === actor.id;
  // "Liên kết tài khoản với hồ sơ người dùng": tài khoản và hồ sơ là một bản ghi; trang hồ sơ theo vai trò + liên kết PH–HS.
  const profileHref = { TEACHER: `/quan-ly/giao-vien/${user.id}`, STUDENT: `/quan-ly/hoc-vien/${user.id}`, PARENT: `/quan-ly/phu-huynh/${user.id}` }[user.role as string];
  const [parents, students] = await Promise.all([
    user.role === "STUDENT" ? listParents(actor) : Promise.resolve([]),
    user.role === "PARENT" ? linkableStudents(actor, user.id) : Promise.resolve([]),
  ]);
  const notActivated = user.mustChangePassword;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/nguoi-dung">← Người dùng</Link>
      </p>
      <PageHeader
        title={user.fullName}
        description={`${ROLE_LABELS[user.role]}${user.studentCode ? ` · ${user.studentCode}` : ""} · tạo ${formatDateTime(user.createdAt)}`}
        action={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={USER_STATUS[user.status].tone}>{USER_STATUS[user.status].label}</Badge>
            {notActivated && <Badge tone="warning">Chưa kích hoạt (chưa đổi mật khẩu tạm)</Badge>}
            {profileHref && (
              <ActionLink href={profileHref} icon="profile" tone="primary">
                Hồ sơ {ROLE_LABELS[user.role].toLowerCase()}
              </ActionLink>
            )}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
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
                  options: (isSelf ? [user.role] : [...ACTIVE_ROLES, ...(user.role === "STAFF" ? (["STAFF"] as Role[]) : [])]).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
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
              {parents.length > 0 && (
                <InlinePickForm
                  className="mb-4"
                  action={linkGuardianAction}
                  hidden={{ studentId: user.id }}
                  name="parentId"
                  label="Liên kết tài khoản phụ huynh"
                  placeholder="Gõ tên hoặc SĐT phụ huynh…"
                  options={parents.filter((p) => !user.parentLinks.some((l) => l.parent.id === p.id)).map((p) => ({ value: p.id, label: `${p.fullName}${p.phone ? ` · ${formatPhone(p.phone)}` : ""}` }))}
                />
              )}
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
              {students.length > 0 && (
                <InlinePickForm
                  className="mb-4"
                  action={linkGuardianAction}
                  hidden={{ parentId: user.id }}
                  name="studentId"
                  label="Liên kết tài khoản học sinh"
                  placeholder="Gõ tên hoặc mã học sinh…"
                  options={students.map((s) => ({ value: s.id, label: `${s.fullName}${s.studentCode ? ` (${s.studentCode})` : ""}` }))}
                />
              )}
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
          <div id="mat-khau" className="scroll-mt-24">
            <Card title="Mật khẩu">
              <ResetPasswordForm userId={user.id} fullName={user.fullName} />
            </Card>
          </div>
          <Card title={`Thao tác của vai trò ${ROLE_LABELS[user.role]}`}>
            <dl className="space-y-2 text-sm">
              {ROLE_CAPABILITIES[user.role].map((c) => (
                <div key={c.area}>
                  <dt className="font-medium">{c.area}</dt>
                  <dd className="text-muted">{c.actions}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {!isSelf && (
            <Card title="Kích hoạt / khóa tài khoản">
              <ul className="mb-3 space-y-1 text-sm text-muted">
                <li>
                  <strong className="text-ink">Kích hoạt:</strong>{" "}
                  {notActivated ? "chưa — người dùng cần đăng nhập bằng mật khẩu tạm và đổi mật khẩu. Quên mật khẩu tạm? Bấm \"Đặt lại mật khẩu\" để cấp mật khẩu kích hoạt mới." : "đã kích hoạt (đã đổi mật khẩu tạm)."}
                </li>
                <li>
                  <strong className="text-ink">Đăng nhập:</strong> {user.status === "ACTIVE" ? "đang mở." : "đang khóa — bấm \"Kích hoạt lại\" để mở."}
                </li>
              </ul>
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
                <ConfigForm action={setUserStatusAction} hidden={{ userId: user.id, status: "ACTIVE" }} submitLabel="Kích hoạt lại (mở khóa)" fields={[]} />
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
