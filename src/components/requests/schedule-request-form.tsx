"use client";

import { useActionState, useMemo, useState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";
import { FilterSelect } from "@/components/ui/filter-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { SCHEDULE_REQUEST_TYPE } from "@/lib/labels";
import { createScheduleRequestAction } from "@/server/requests/actions";
import { initialActionState } from "@/server/errors";

type Props = {
  classes: { value: string; label: string }[];
  sessions: { id: string; classId: string; label: string }[];
};

/** Đề xuất đổi lịch: chọn lớp → chọn buổi của lớp đó → loại đề xuất. */
export function ScheduleRequestForm({ classes, sessions }: Props) {
  const [state, action] = useActionState(createScheduleRequestAction, initialActionState);
  const [classId, setClassId] = useState("");
  const [type, setType] = useState("LEAVE");
  const e = state.fieldErrors ?? {};
  const v = state.ok ? {} : (state.values ?? {});
  const options = useMemo(() => sessions.filter((s) => s.classId === classId).map((s) => ({ value: s.id, label: s.label })), [sessions, classId]);

  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <FilterSelect name="_class" label="Lớp" required placeholder="Chọn lớp" options={classes} autoSubmit={false} onChange={setClassId} />
      <FilterSelect
        key={classId}
        name="sessionId"
        label="Buổi"
        required
        placeholder={classId ? "Chọn buổi" : "Chọn lớp trước"}
        options={options}
        disabled={!classId}
        autoSubmit={false}
        defaultValue={v.sessionId && options.some((o) => o.value === v.sessionId) ? v.sessionId : ""}
        error={e.sessionId}
      />
      <SelectField
        name="type"
        label="Loại đề xuất"
        value={type}
        onChange={(ev) => setType(ev.target.value)}
        options={Object.entries(SCHEDULE_REQUEST_TYPE).map(([value, label]) => ({ value, label }))}
        error={e.type}
      />
      {type === "RESCHEDULE" && (
        <div className="grid grid-cols-2 gap-4">
          <TextField type="date" name="date" label="Ngày mới" className="col-span-2" defaultValue={v.date ?? ""} error={e.date} />
          <TextField type="time" name="startTime" label="Bắt đầu" defaultValue={v.startTime ?? ""} error={e.startTime} />
          <TextField type="time" name="endTime" label="Kết thúc" defaultValue={v.endTime ?? ""} error={e.endTime} />
        </div>
      )}
      <TextareaField name="reason" label="Lý do" required maxLength={500} rows={2} defaultValue={v.reason ?? ""} error={e.reason} />
      <SubmitButton>Gửi đề xuất</SubmitButton>
    </form>
  );
}
