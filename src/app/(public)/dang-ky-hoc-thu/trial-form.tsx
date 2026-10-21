"use client";

import { useActionState, useState } from "react";
import { CheckboxField, SelectField, TextareaField, TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADE_OPTIONS } from "@/lib/labels";
import { submitTrialRequestAction } from "@/server/leads/actions";
import { initialActionState } from "@/server/errors";

type Option = { value: string; label: string };

type Props = {
  subjects: Option[];
  courses: (Option & { subjectSlug: string })[];
  subjectSlugToId: Record<string, string>;
  presetCourse?: string;
  presetSubjectId?: string;
};

export function TrialForm({ subjects, courses, subjectSlugToId, presetCourse, presetSubjectId }: Props) {
  const [state, action] = useActionState(submitTrialRequestAction, initialActionState);
  const [subjectId, setSubjectId] = useState(presetSubjectId ?? "");
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const courseOptions = courses.filter((c) => !subjectId || subjectSlugToId[c.subjectSlug] === subjectId);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}

      <fieldset className="space-y-4">
        <legend className="mb-1 font-heading text-lg font-bold text-primary">Thông tin phụ huynh</legend>
        <TextField name="parentName" defaultValue={v.parentName} label="Họ tên phụ huynh" autoComplete="name" required maxLength={120} error={e.parentName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="phone" defaultValue={v.phone}
            type="tel"
            label="Số điện thoại"
            autoComplete="tel"
            inputMode="tel"
            required
            maxLength={20}
            hint="Ví dụ: 0912 345 678"
            error={e.phone}
          />
          <TextField name="email" defaultValue={v.email} type="email" label="Email" autoComplete="email" maxLength={191} error={e.email} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-heading text-lg font-bold text-primary">Thông tin học sinh</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="studentName" defaultValue={v.studentName} label="Họ tên học sinh" required maxLength={120} error={e.studentName} />
          <SelectField name="gradeLevel" defaultValue={v.gradeLevel ?? ""} label="Khối lớp" required placeholder="Chọn khối" options={GRADE_OPTIONS} error={e.gradeLevel} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="subjectId"
            label="Môn quan tâm"
            required
            placeholder="Chọn môn"
            options={subjects}
            value={subjectId}
            onChange={(ev) => setSubjectId(ev.target.value)}
            error={e.subjectId}
          />
          <SelectField
            name="courseSlug"
            label="Khóa học (nếu đã chọn)"
            placeholder="Chưa chọn"
            options={courseOptions}
            defaultValue={v.courseSlug ?? presetCourse ?? ""}
            error={e.courseSlug}
          />
        </div>
        <TextareaField
          name="note" defaultValue={v.note}
          label="Ghi chú"
          maxLength={1000}
          hint="Mục tiêu học tập, thời gian có thể học…"
          error={e.note}
        />
      </fieldset>

      {/* Honeypot chống bot (FR-005): người dùng không thấy ô này. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <CheckboxField
        name="consent"
        label="Tôi đồng ý để CoreLink Academy liên hệ qua số điện thoại/email trên để tư vấn khóa học."
        error={e.consent}
      />

      <SubmitButton className="w-full sm:w-auto" pendingLabel="Đang gửi…">
        Gửi đăng ký
      </SubmitButton>
    </form>
  );
}
