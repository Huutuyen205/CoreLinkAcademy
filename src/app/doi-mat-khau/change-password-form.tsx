"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword } from "@/server/auth/actions";
import { initialActionState } from "@/server/errors";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, initialActionState);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      <TextField
        name="currentPassword"
        type="password"
        label="Mật khẩu hiện tại"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <TextField
        name="newPassword"
        type="password"
        label="Mật khẩu mới"
        autoComplete="new-password"
        hint="Ít nhất 8 ký tự, có cả chữ và số."
        required
        error={state.fieldErrors?.newPassword}
      />
      <TextField
        name="confirm"
        type="password"
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />
      <SubmitButton className="w-full">Lưu mật khẩu mới</SubmitButton>
    </form>
  );
}
