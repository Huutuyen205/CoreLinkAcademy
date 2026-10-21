"use client";

import { useActionState, useState } from "react";
import { SelectField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADE_OPTIONS } from "@/lib/labels";
import { createUserAction, type CreateUserState } from "@/server/users/actions";
import { FormMessage } from "./config-form";
import { CredentialsNotice } from "./credentials-notice";

/** Tạo tài khoản; mật khẩu tạm hiện một lần sau khi tạo. `roles` do server quyết định theo quyền. */
export function CreateUserForm({ roles }: { roles: { value: string; label: string }[] }) {
  const [state, action] = useActionState<CreateUserState, FormData>(createUserAction, { ok: false });
  const v = state.ok ? {} : (state.values ?? {});
  const [role, setRole] = useState(v.role ?? roles[0]?.value ?? "");
  const e = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      {state.ok && state.credential && (
        <CredentialsNotice
          credentials={[{ role, fullName: `${state.credential.fullName}${state.credential.studentCode ? ` (${state.credential.studentCode})` : ""}`, login: state.credential.login, password: state.credential.password }]}
        />
      )}
      <form action={action} noValidate className="space-y-4">
        {!state.ok && <FormMessage state={state} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="role" label="Vai trò" required options={roles} value={role} onChange={(ev) => setRole(ev.target.value)} error={e.role} />
          <TextField name="fullName" label="Họ tên" required maxLength={120} defaultValue={v.fullName} error={e.fullName} />
          <TextField name="email" type="email" label="Email" maxLength={191} defaultValue={v.email} error={e.email} hint="Cần email hoặc SĐT để đăng nhập." />
          <TextField name="phone" type="tel" label="Số điện thoại" maxLength={20} defaultValue={v.phone} error={e.phone} />
          {role === "STUDENT" && <SelectField name="gradeLevel" label="Khối lớp" required placeholder="Chọn" options={GRADE_OPTIONS} defaultValue={v.gradeLevel ?? ""} error={e.gradeLevel} />}
        </div>
        {role !== "STUDENT" && <input type="hidden" name="gradeLevel" value="" />}
        <SubmitButton>Tạo tài khoản</SubmitButton>
      </form>
    </div>
  );
}
