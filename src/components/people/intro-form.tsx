"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { TextareaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveMyIntroAction } from "@/server/people/actions";
import { initialActionState } from "@/server/errors";

/** GV §11A: soạn hồ sơ giới thiệu — lưu nháp hoặc gửi duyệt. */
export function IntroForm({ defaultValue }: { defaultValue: string }) {
  const [state, action] = useActionState(saveMyIntroAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <TextareaField
        name="introDraft"
        label="Giới thiệu (kinh nghiệm, chuyên môn, thành tích, phương pháp dạy)"
        maxLength={3000}
        rows={8}
        defaultValue={state.values?.introDraft ?? defaultValue}
        error={state.fieldErrors?.introDraft}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="draft" variant="secondary">
          Lưu nháp
        </SubmitButton>
        <SubmitButton name="intent" value="submit">
          Gửi duyệt
        </SubmitButton>
      </div>
    </form>
  );
}
