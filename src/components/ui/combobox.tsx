"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { FieldShell } from "@/components/ui/field";
import { cn } from "@/lib/format";
import { foldVietnamese } from "@/lib/search";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  options: Option[];
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  hideLabel?: boolean;
  /** Tăng lên để xóa lựa chọn (vd. sau khi liên kết thành công). */
  resetKey?: number;
};

const MAX_SHOWN = 50;

/**
 * Ô chọn có tìm kiếm: gõ vài chữ (không cần dấu) để lọc danh sách, chọn bằng chuột hoặc phím ↑ ↓ Enter.
 * Gửi đi `name` = value của mục đã chọn (ô ẩn), như một `<select>`.
 */
export function ComboboxField({ name, label, options, id: idProp, hint, error, required, placeholder = "Gõ để tìm…", defaultValue = "", className, hideLabel, resetKey }: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  const [selected, setSelected] = useState<Option | null>(() => options.find((o) => o.value === defaultValue) ?? null);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [lastReset, setLastReset] = useState(resetKey);
  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setSelected(null);
    setQuery("");
  }

  const folded = useMemo(() => options.map((o) => ({ ...o, key: foldVietnamese(o.label) })), [options]);
  const matches = useMemo(() => {
    const terms = foldVietnamese(selected && query === selected.label ? "" : query).split(/\s+/).filter(Boolean);
    return folded.filter((o) => terms.every((t) => o.key.includes(t)));
  }, [folded, query, selected]);
  const shown = matches.slice(0, MAX_SHOWN);

  const choose = (o: Option) => {
    setSelected(o);
    setQuery(o.label);
    setOpen(false);
  };

  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <input type="hidden" name={name} value={selected?.value ?? ""} />
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open) {
              // Enter chọn mục đang sáng thay vì gửi form.
              e.preventDefault();
              if (shown[active]) choose(shown[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="block min-h-11 w-full rounded-control border border-line-strong bg-surface pl-9 pr-9 text-base text-ink placeholder:text-muted/80 focus-visible:border-primary aria-[invalid=true]:border-danger"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        {open && (
          <ul id={listId} role="listbox" className="custom-scrollbar absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-control border border-line bg-surface py-1 shadow-lg">
            {shown.length === 0 && <li className="px-3 py-2 text-sm text-muted">Không tìm thấy “{query}”.</li>}
            {shown.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected?.value === o.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm", i === active && "bg-primary-soft text-primary")}
              >
                <Check className={cn("size-4 shrink-0", selected?.value === o.value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                {o.label}
              </li>
            ))}
            {matches.length > MAX_SHOWN && <li className="px-3 py-2 text-xs text-muted">Còn {matches.length - MAX_SHOWN} kết quả — gõ thêm để thu hẹp.</li>}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
