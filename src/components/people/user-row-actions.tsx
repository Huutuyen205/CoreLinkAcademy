import type { Role, UserStatus } from "@prisma/client";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { setUserStatusAction } from "@/server/users/actions";

/** Hồ sơ nghiệp vụ theo vai trò (khác trang tài khoản `/quan-ly/nguoi-dung/<id>`). */
const PROFILE_BY_ROLE: Partial<Record<Role, string>> = {
  STUDENT: "/quan-ly/hoc-vien",
  PARENT: "/quan-ly/phu-huynh",
  TEACHER: "/quan-ly/giao-vien",
};

/** Câu xác nhận nói rõ khóa/mở dây chuyền HS ↔ PH (DECISION-D31). */
function lockMessage(user: { fullName: string; role: Role }, lock: boolean): string {
  const verb = lock ? "Khóa" : "Mở khóa";
  const linked = user.role === "STUDENT" ? " Phụ huynh đã liên kết của em cũng bị " : user.role === "PARENT" ? " Các con đã liên kết cũng bị " : "";
  return `${verb} tài khoản ${user.fullName}?${linked ? `${linked}${lock ? "khóa" : "mở khóa"} theo.` : ""}${lock ? " Người bị khóa bị đăng xuất ngay." : ""}`;
}

type Props = {
  user: { id: string; fullName: string; role: Role; status: UserStatus };
  actor: { id: string; role: Role };
  /** Ẩn nút "Hồ sơ" khi đang ở chính trang hồ sơ đó. */
  hideProfile?: boolean;
};

/**
 * Bộ nút thao tác cho một tài khoản, dùng chung ở Người dùng / Học viên / Phụ huynh / Giáo viên.
 * Sửa tài khoản, đặt lại mật khẩu, khóa: chỉ Admin (`user.manage`) — server vẫn kiểm tra lại.
 */
export function UserRowActions({ user, actor, hideProfile }: Props) {
  const profile = PROFILE_BY_ROLE[user.role];
  const isAdmin = actor.role === "ADMIN";
  return (
    <RowActions>
      {profile && !hideProfile && (
        <ActionLink href={`${profile}/${user.id}`} icon="profile">
          Hồ sơ
        </ActionLink>
      )}
      {isAdmin && (
        <>
          <ActionLink href={`/quan-ly/nguoi-dung/${user.id}`} icon="edit">
            Sửa
          </ActionLink>
          <ActionLink href={`/quan-ly/nguoi-dung/${user.id}#mat-khau`} icon="password">
            Đặt lại MK
          </ActionLink>
          {user.id !== actor.id &&
            (user.status === "ACTIVE" ? (
              <ActionButton action={setUserStatusAction} hidden={{ userId: user.id, status: "DISABLED" }} icon="lock" tone="danger" confirm={lockMessage(user, true)}>
                Khóa
              </ActionButton>
            ) : (
              <ActionButton action={setUserStatusAction} hidden={{ userId: user.id, status: "ACTIVE" }} icon="unlock" tone="success" confirm={lockMessage(user, false)}>
                Mở khóa
              </ActionButton>
            ))}
        </>
      )}
    </RowActions>
  );
}
