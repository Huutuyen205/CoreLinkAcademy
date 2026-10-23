"use client";

import { Link2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { ComboboxField } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import { initialActionState, type ActionState } from "@/server/errors";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  submitLabel?: string;
  className?: string;
};

/** Một hàng: ô gõ tìm (combobox) + nút — vd. "Thêm phụ huynh", "Liên kết thêm con". */
export function InlinePickForm({ action, hidden, name, label, placeholder, options, submitLabel = "Liên kết", className }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!state.ok) return;
    setResetKey((k) => k + 1);
    if (state.message) toast(state.message);
  }, [state]);
  const error = state.ok ? undefined : (state.fieldErrors?.[name] ?? state.message);

  return (
    <form action={formAction} className={cn("space-y-1", className)}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="flex items-start gap-2">
        <ComboboxField name={name} label={label} hideLabel placeholder={placeholder} options={options} className="min-w-0 flex-1" resetKey={resetKey} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control bg-primary px-3.5 text-sm font-semibold text-white hover:bg-primary-strong disabled:opacity-60"
        >
          <Link2 className="size-4" aria-hidden="true" />
          {pending ? "Đang lưu…" : submitLabel}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
