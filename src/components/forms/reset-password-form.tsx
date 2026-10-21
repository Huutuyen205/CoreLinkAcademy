"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { resetPasswordAction, type ResetState } from "@/server/users/actions";
import { FormMessage } from "./config-form";
import { CredentialsNotice } from "./credentials-notice";

export function ResetPasswordForm({ userId, fullName }: { userId: string; fullName: string }) {
  const [state, action] = useActionState<ResetState, FormData>(resetPasswordAction, { ok: false });
  if (state.ok && state.password && state.login) {
    return <CredentialsNotice credentials={[{ role: "", fullName, login: state.login, password: state.password }]} />;
  }
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        if (!window.confirm("Đặt lại mật khẩu? Người dùng sẽ bị đăng xuất khỏi mọi thiết bị.")) e.preventDefault();
      }}
    >
      <FormMessage state={state} />
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm text-muted">Tạo mật khẩu tạm mới; người dùng phải đổi ở lần đăng nhập tiếp theo.</p>
      <SubmitButton variant="secondary">Đặt lại mật khẩu</SubmitButton>
    </form>
  );
}
