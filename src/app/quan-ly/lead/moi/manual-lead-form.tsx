"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADE_OPTIONS, LEAD_SOURCE_LABELS, MANUAL_LEAD_SOURCES } from "@/lib/labels";
import { createLeadAction, type CreateLeadState } from "@/server/leads/actions";

type Option = { value: string; label: string };

/** UC-020: nhập lead tay. Trùng lead đang mở → liên kết tới lead cũ. */
export function ManualLeadForm({ subjects, courses }: { subjects: Option[]; courses: Option[] }) {
  const [state, action] = useActionState<CreateLeadState, FormData>(createLeadAction, { ok: false });
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      {state.existingLeadId && (
        <p className="text-sm">
          <Link href={`/quan-ly/lead/${state.existingLeadId}`}>Mở lead hiện có</Link>
        </p>
      )}
      <SelectField
        name="source"
        label="Nguồn khách"
        required
        placeholder="Chọn nguồn"
        options={MANUAL_LEAD_SOURCES.map((s) => ({ value: s, label: LEAD_SOURCE_LABELS[s]! }))}
        defaultValue={v.source ?? "phone"}
        error={e.source}
      />
      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-lg font-semibold">Phụ huynh</legend>
        <TextField name="parentName" label="Họ tên phụ huynh" required maxLength={120} defaultValue={v.parentName} error={e.parentName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="phone" type="tel" inputMode="tel" label="Số điện thoại" required maxLength={20} hint="Ví dụ: 0912 345 678" defaultValue={v.phone} error={e.phone} />
          <TextField name="email" type="email" label="Email" maxLength={191} defaultValue={v.email} error={e.email} />
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-lg font-semibold">Học sinh</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="studentName" label="Họ tên học sinh" required maxLength={120} defaultValue={v.studentName} error={e.studentName} />
          <SelectField name="gradeLevel" label="Khối lớp" placeholder="Chưa rõ" options={GRADE_OPTIONS} defaultValue={v.gradeLevel ?? ""} error={e.gradeLevel} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="subjectId" label="Môn quan tâm" placeholder="Chưa rõ" options={subjects} defaultValue={v.subjectId ?? ""} error={e.subjectId} />
          <SelectField name="courseSlug" label="Khóa học" placeholder="Chưa chọn" options={courses} defaultValue={v.courseSlug ?? ""} error={e.courseSlug} hint="Chọn khóa thì môn lấy theo khóa." />
        </div>
        <TextareaField name="note" label="Ghi chú" maxLength={1000} rows={3} defaultValue={v.note} error={e.note} />
      </fieldset>
      <SubmitButton>Tạo lead</SubmitButton>
    </form>
  );
}
