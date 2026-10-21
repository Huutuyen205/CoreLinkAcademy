"use client";

import type { AttendanceStatus } from "@prisma/client";
import { useActionState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/format";
import { saveAttendanceAction } from "@/server/attendance/actions";
import { initialActionState } from "@/server/errors";

const OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: "PRESENT", label: "Có mặt", className: "has-[:checked]:border-success has-[:checked]:bg-success-soft has-[:checked]:text-success" },
  { value: "LATE", label: "Muộn", className: "has-[:checked]:border-warning has-[:checked]:bg-warning-soft has-[:checked]:text-warning" },
  { value: "ABSENT", label: "Vắng", className: "has-[:checked]:border-danger has-[:checked]:bg-danger-soft has-[:checked]:text-danger" },
  { value: "EXCUSED", label: "Có phép", className: "has-[:checked]:border-muted has-[:checked]:bg-paper" },
];

type Row = { id: string; fullName: string; studentCode: string | null; status: AttendanceStatus | null; note: string | null };

/** GOAL-003: mặc định "có mặt", giáo viên chỉ chỉnh các em vắng/muộn rồi lưu. */
export function AttendanceForm({ sessionId, rows, needsReason }: { sessionId: string; rows: Row[]; needsReason: boolean }) {
  const [state, action] = useActionState(saveAttendanceAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <ol className="divide-y divide-line rounded-block border border-line bg-surface">
        {rows.map((r, i) => (
          <li key={r.id} className="px-4 py-3">
            <input type="hidden" name="studentIds" value={r.id} />
            <fieldset>
              <legend className="font-medium">
                {i + 1}. {r.fullName} <span className="text-sm font-normal text-muted">{r.studentCode}</span>
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border border-line px-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                      o.className,
                    )}
                  >
                    <input type="radio" name={`status:${r.id}`} value={o.value} defaultChecked={(r.status ?? "PRESENT") === o.value} className="accent-primary" />
                    {o.label}
                  </label>
                ))}
              </div>
              <label className="mt-2 block">
                <span className="sr-only">Ghi chú cho {r.fullName}</span>
                <input
                  name={`note:${r.id}`}
                  defaultValue={r.note ?? ""}
                  maxLength={255}
                  placeholder="Ghi chú (không bắt buộc)"
                  className="block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-base"
                />
              </label>
            </fieldset>
          </li>
        ))}
      </ol>
      {needsReason && (
        <TextField
          name="reason"
          label="Lý do sửa ngoài khung thời gian"
          required
          maxLength={255}
          hint="Bắt buộc và được ghi vào nhật ký."
          defaultValue={state.values?.reason}
          error={state.fieldErrors?.reason}
        />
      )}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 lg:bottom-0">
        <SubmitButton className="w-full sm:w-auto">Lưu điểm danh</SubmitButton>
      </div>
    </form>
  );
}
