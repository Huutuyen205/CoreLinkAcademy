"use client";

import { X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { foldVietnamese } from "@/lib/search";
import { createAnnouncementAction } from "@/server/notifications/actions";
import { initialActionState } from "@/server/errors";

type Option = { value: string; label: string };
type Person = { id: string; label: string; group: string };

const SHOWN = 30;

/**
 * Soạn thông báo (Admin §12A, GV §10A): chọn đối tượng — toàn bộ một nhóm, một lớp, hoặc chọn từng người nhận
 * (tìm theo tên/mã, lọc theo vai trò). Lớp chỉ hiện khi chọn "Một lớp"; danh sách người chỉ hiện khi chọn "từng người".
 */
export function AnnouncementForm({ audiences, classes, people, defaultAudience, defaultClassId }: { audiences: Option[]; classes: Option[]; people: Person[]; defaultAudience: string; defaultClassId: string }) {
  const [state, action] = useActionState(createAnnouncementAction, initialActionState);
  const [audience, setAudience] = useState(defaultAudience);
  const [picked, setPicked] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.ok ? {} : (state.values ?? {});
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setPicked([]);
      setQ("");
    }
  }, [state]);

  const groups = useMemo(() => [...new Set(people.map((p) => p.group))], [people]);
  const matches = useMemo(() => {
    const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
    const chosen = new Set(picked.map((p) => p.id));
    return people.filter((p) => !chosen.has(p.id) && (!group || p.group === group) && terms.every((t) => foldVietnamese(p.label).includes(t)));
  }, [people, picked, q, group]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <SelectField name="audience" label="Đối tượng nhận" required options={audiences} value={audience} onChange={(ev) => setAudience(ev.target.value)} error={e.audience} />
      {audience === "CLASS" && (
        <SearchSelect name="classId" label="Lớp" required placeholder="Chọn lớp" options={classes} defaultValue={v.classId ?? defaultClassId} error={e.classId} />
      )}
      {audience === "USERS" && (
        <fieldset className="space-y-3 rounded-control border border-line p-3">
          <legend className="px-1 text-sm font-semibold">Người nhận ({picked.length})</legend>
          {picked.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {picked.map((p) => (
                <li key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm text-primary">
                  <input type="hidden" name="userIds" value={p.id} />
                  {p.label}
                  <button type="button" onClick={() => setPicked((old) => old.filter((x) => x.id !== p.id))} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-primary/15" aria-label={`Bỏ ${p.label}`}>
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <TextField name="_q" label="Tìm người (tên, mã HS)" value={q} onChange={(ev) => setQ(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && ev.preventDefault()} maxLength={80} />
            <SelectField name="_group" label="Vai trò" placeholder="Tất cả" options={groups.map((g) => ({ value: g, label: g }))} value={group} onChange={(ev) => setGroup(ev.target.value)} />
          </div>
          <ul className="max-h-60 divide-y divide-line overflow-y-auto rounded-control border border-line custom-scrollbar">
            {matches.slice(0, SHOWN).map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setPicked((old) => [...old, p])} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm hover:bg-primary-soft">
                  <span>{p.label}</span>
                  <span className="text-xs text-muted">{p.group}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="px-3 py-3 text-sm text-muted">Không còn người phù hợp.</li>}
          </ul>
          {matches.length > SHOWN && <p className="text-xs text-muted">Hiển thị {SHOWN}/{matches.length} — gõ thêm để thu hẹp.</p>}
          {matches.length > 1 && matches.length <= 200 && (
            <button type="button" onClick={() => setPicked((old) => [...old, ...matches])} className="text-sm font-semibold text-primary">
              Chọn tất cả {matches.length} người đang lọc
            </button>
          )}
          {e.userIds && <p className="text-sm text-danger">{e.userIds}</p>}
        </fieldset>
      )}
      <TextField name="title" label="Tiêu đề" required maxLength={200} defaultValue={v.title} error={e.title} />
      <TextareaField name="body" label="Nội dung" required maxLength={5000} rows={6} defaultValue={v.body} error={e.body} />
      <SubmitButton
        onClick={(ev) => {
          if (!window.confirm(audience === "USERS" ? `Gửi thông báo cho ${picked.length} người đã chọn?` : "Gửi thông báo này?")) ev.preventDefault();
        }}
      >
        Gửi
      </SubmitButton>
    </form>
  );
}
