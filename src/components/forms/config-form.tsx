"use client";

import { useActionState, useId } from "react";
import { CheckboxField, SelectField, TextareaField, TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/format";
import { initialActionState, type ActionState } from "@/server/errors";

type Base = { name: string; label: string; hint?: string; required?: boolean; defaultValue?: string; wide?: boolean };

export type FieldConfig =
  | (Base & { type: "text" | "email" | "tel" | "number" | "date" | "time" | "datetime-local" | "password"; maxLength?: number; min?: string; max?: string; step?: string })
  | (Base & { type: "textarea"; maxLength?: number; rows?: number })
  | (Base & { type: "select"; options: { value: string; label: string }[]; placeholder?: string })
  | (Base & { type: "checkbox"; defaultChecked?: boolean })
  | (Base & { type: "checkboxes"; options: { value: string; label: string }[]; defaultValues?: string[] });

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: FieldConfig[];
  hidden?: Record<string, string>;
  submitLabel: string;
  /** Hai cột trên màn hình rộng. */
  columns?: 1 | 2;
  /** Hỏi xác nhận trước khi gửi (thao tác khó hoàn tác). */
  confirm?: string;
  submitVariant?: "primary" | "secondary" | "danger";
  className?: string;
};

/** Thông báo chung của form + danh sách chi tiết (vd. xung đột lịch). */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <Alert tone={state.ok ? "success" : "danger"}>
      {state.message}
      {state.details && state.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5">
          {state.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

/** Form dựng từ cấu hình: lỗi từng ô, thông báo chung, giữ lại giá trị khi lỗi (docs/08 §5). */
export function ConfigForm({ action, fields, hidden, submitLabel, columns = 1, confirm, submitVariant = "primary", className }: Props) {
  const [state, formAction] = useActionState(action, initialActionState);
  const uid = useId();
  const e = state.fieldErrors ?? {};
  const v = state.ok ? {} : (state.values ?? {});

  return (
    <form
      action={formAction}
      noValidate
      className={cn("space-y-4", className)}
      onSubmit={(ev) => {
        if (confirm && !window.confirm(confirm)) ev.preventDefault();
      }}
    >
      <FormMessage state={state} />
      {hidden && Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
        {fields.map((f) => {
          const span = cn(f.wide && columns === 2 && "sm:col-span-2");
          const value = v[f.name] ?? f.defaultValue;
          const fid = `${uid}-${f.name}`;
          switch (f.type) {
            case "textarea":
              return (
                <TextareaField key={f.name} id={fid} className={span} name={f.name} label={f.label} hint={f.hint} required={f.required} maxLength={f.maxLength} rows={f.rows} defaultValue={value} error={e[f.name]} />
              );
            case "select":
              return (
                <SelectField key={f.name} id={fid} className={span} name={f.name} label={f.label} hint={f.hint} required={f.required} options={f.options} placeholder={f.placeholder} defaultValue={value ?? ""} error={e[f.name]} />
              );
            case "checkbox":
              // Khi lỗi, action trả `values[name]` = "on" | "" để giữ trạng thái người dùng đã chọn.
              return (
                <CheckboxField key={f.name} id={fid} className={span} name={f.name} label={f.label} defaultChecked={v[f.name] !== undefined ? v[f.name] === "on" : f.defaultChecked} error={e[f.name]} />
              );
            case "checkboxes":
              return (
                <fieldset key={f.name} className={cn("space-y-2", span)} aria-describedby={e[f.name] ? `${fid}-error` : undefined}>
                  <legend className="text-sm font-medium">
                    {f.label}
                    {f.required && <span className="text-danger" aria-hidden="true"> *</span>}
                  </legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {f.options.map((o) => (
                      <label key={o.value} className="inline-flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" name={f.name} value={o.value} defaultChecked={(v[f.name]?.split(",") ?? f.defaultValues)?.includes(o.value)} className="size-5 accent-primary" />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  {e[f.name] && (
                    <p id={`${fid}-error`} className="text-sm text-danger">
                      {e[f.name]}
                    </p>
                  )}
                </fieldset>
              );
            default:
              return (
                <TextField
                  key={f.name}
                  id={fid}
                  className={span}
                  type={f.type}
                  name={f.name}
                  label={f.label}
                  hint={f.hint}
                  required={f.required}
                  maxLength={f.maxLength}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  defaultValue={f.type === "password" ? undefined : value}
                  autoComplete={f.type === "password" ? "new-password" : undefined}
                  error={e[f.name]}
                />
              );
          }
        })}
      </div>
      <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
    </form>
  );
}
