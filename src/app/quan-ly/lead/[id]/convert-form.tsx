"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { CredentialsNotice } from "@/components/forms/credentials-notice";
import { SelectField, TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADE_OPTIONS } from "@/lib/labels";
import { convertLeadAction, type ConvertState } from "@/server/leads/actions";

type Props = {
  lead: { id: string; studentName: string; gradeLevel: number | null; parentName: string; phone: string; email: string | null };
  classes: { value: string; label: string }[];
};

export function ConvertLeadForm({ lead, classes }: Props) {
  const [state, action] = useActionState<ConvertState, FormData>(convertLeadAction, { ok: false });

  if (state.ok) {
    const hasStudentLogin = state.credentials?.some((c) => c.role === "STUDENT");
    return (
      <div className="space-y-4">
        <FormMessage state={{ ok: true, message: `${state.message} Mã học sinh: ${state.studentCode}.` }} />
        <CredentialsNotice
          credentials={state.credentials ?? []}
          note={
            hasStudentLogin
              ? undefined
              : "Học sinh chưa có email/SĐT nên chưa đăng nhập được. Admin có thể bổ sung và đặt lại mật khẩu trong mục Người dùng."
          }
        />
        <Link href="/quan-ly/hoc-vien">Xem danh sách học viên</Link>
      </div>
    );
  }

  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="leadId" value={lead.id} />
      <TextField name="studentName" label="Họ tên học sinh" required maxLength={120} defaultValue={v.studentName ?? lead.studentName} error={e.studentName} />
      <SelectField
        name="gradeLevel"
        label="Khối lớp"
        required
        placeholder="Chọn khối"
        options={GRADE_OPTIONS}
        defaultValue={v.gradeLevel ?? (lead.gradeLevel ? String(lead.gradeLevel) : "")}
        error={e.gradeLevel}
      />
      <TextField name="studentEmail" type="email" label="Email học sinh" maxLength={191} hint="Cần email hoặc SĐT để học sinh tự đăng nhập." defaultValue={v.studentEmail} error={e.studentEmail} />
      <TextField name="studentPhone" type="tel" label="SĐT học sinh" maxLength={20} defaultValue={v.studentPhone} error={e.studentPhone} />
      <TextField name="parentName" label="Họ tên phụ huynh" required maxLength={120} defaultValue={v.parentName ?? lead.parentName} error={e.parentName} />
      <TextField
        name="parentPhone"
        type="tel"
        label="SĐT phụ huynh"
        required
        maxLength={20}
        hint="Nếu SĐT đã có tài khoản phụ huynh, hệ thống liên kết vào tài khoản đó."
        defaultValue={v.parentPhone ?? lead.phone}
        error={e.parentPhone}
      />
      <TextField name="parentEmail" type="email" label="Email phụ huynh" maxLength={191} defaultValue={v.parentEmail ?? lead.email ?? ""} error={e.parentEmail} />
      <SearchSelect name="classId" label="Ghi danh vào lớp (tùy chọn)" emptyLabel="Chưa ghi danh" options={classes} defaultValue={v.classId ?? ""} error={e.classId} />
      <SubmitButton className="w-full" pendingLabel="Đang chuyển…">
        Chuyển thành học viên
      </SubmitButton>
    </form>
  );
}
