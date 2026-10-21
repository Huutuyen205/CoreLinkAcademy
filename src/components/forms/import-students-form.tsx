"use client";

import { useActionState } from "react";
import { TextareaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { importStudentsAction, type ImportState } from "@/server/users/actions";
import { FormMessage } from "./config-form";
import { CredentialsNotice } from "./credentials-notice";

const SAMPLE = "Họ tên\tKhối\tSĐT\tEmail\nNguyễn Văn An\t9\t0912345678\t\nTrần Thị Bình\t6\t\tbinh@example.com";

/** Admin §2: dán bảng từ Excel (Họ tên | Khối | SĐT | Email). */
export function ImportStudentsForm() {
  const [state, action] = useActionState<ImportState, FormData>(importStudentsAction, { ok: false });
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <div className="space-y-4">
      {state.ok && state.credentials && (
        <>
          <FormMessage state={state} />
          <CredentialsNotice
            credentials={state.credentials.map((c) => ({ role: "STUDENT", fullName: `${c.fullName} (${c.studentCode})`, login: c.login, password: c.password }))}
            note="Học sinh chưa có email/SĐT sẽ đăng nhập được sau khi bổ sung thông tin ở hồ sơ."
          />
        </>
      )}
      <form action={action} className="space-y-4">
        {!state.ok && <FormMessage state={state} />}
        <TextareaField
          name="data"
          label="Dán danh sách (mỗi dòng một học sinh)"
          rows={8}
          required
          maxLength={50_000}
          hint="Cột: Họ tên, Khối (0 = tiền tiểu học, 1–12), SĐT, Email — copy thẳng từ Excel/Google Sheets hoặc phân tách bằng dấu phẩy. Tối đa 50 dòng mỗi lần."
          placeholder={SAMPLE}
          defaultValue={v.data}
          className="[&_textarea]:font-mono [&_textarea]:text-sm"
        />
        <SubmitButton pendingLabel="Đang tạo tài khoản…">Nhập danh sách</SubmitButton>
      </form>
    </div>
  );
}
