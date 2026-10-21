"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { login } from "@/server/auth/actions";
import { initialActionState } from "@/server/errors";

export function LoginForm() {
  const [state, action] = useActionState(login, initialActionState);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      <TextField
        name="identifier"
        label="Email hoặc số điện thoại"
        autoComplete="username"
        inputMode="email"
        required
        maxLength={191}
        defaultValue={state.values?.identifier}
        error={state.fieldErrors?.identifier}
      />
      <TextField
        name="password"
        type="password"
        label="Mật khẩu"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton className="w-full" pendingLabel="Đang đăng nhập…">
        Đăng nhập
      </SubmitButton>
    </form>
  );
}
