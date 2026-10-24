"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldShell } from "@/components/ui/field";
import { cn } from "@/lib/format";
import { foldVietnamese } from "@/lib/search";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  options: Option[];
  /** Nhãn của lựa chọn rỗng (vd. "Tất cả"); bỏ trống thì không có mục bỏ chọn. */
  placeholder?: string;
  defaultValue?: string;
  id?: string;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Mặc định true: chọn xong gửi form chứa nó (dùng cho `FilterForm`). */
  autoSubmit?: boolean;
  onChange?: (value: string) => void;
};

/**
 * Dropdown luôn có khung tìm theo tên khi mở (không cần gõ dấu).
 * Trong `FilterForm`: chọn xong tự gửi form như `<select>`; trong form thường đặt `autoSubmit={false}`.
 */
export function FilterSelect({ name, label, options, placeholder, defaultValue = "", id: idProp, className, error, required, disabled, autoSubmit = true, onChange }: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const changed = useRef(false);

  const items = useMemo(() => {
    const terms = foldVietnamese(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;
    return options.filter((o) => terms.every((t) => foldVietnamese(o.label).includes(t)));
  }, [options, placeholder, query]);

  const selected = options.find((o) => o.value === value);

  // Gửi form sau khi ô ẩn đã nhận giá trị mới.
  useEffect(() => {
    if (!changed.current) return;
    changed.current = false;
    if (autoSubmit) hidden.current?.form?.requestSubmit();
  }, [value, autoSubmit]);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (v: string) => {
    setOpen(false);
    if (v === value) return;
    changed.current = true;
    setValue(v);
    onChange?.(v);
  };

  const toggle = () => {
    setQuery("");
    setActive(0);
    setOpen((o) => !o);
  };

  return (
    <FieldShell id={id} label={label} className={className} error={error} required={required}>
      <div ref={root} className="relative">
        <input ref={hidden} type="hidden" name={name} value={value} />
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          data-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={toggle}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-line-strong bg-surface px-3 text-left text-base text-ink focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60 data-[invalid=true]:border-danger"
        >
          <span className={cn("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder ?? "Chọn"}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full min-w-48 rounded-control border border-line bg-surface shadow-lg">
            <div className="relative border-b border-line p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                autoComplete="off"
                placeholder="Tìm theo tên…"
                aria-label={`Tìm ${label.toLowerCase()}`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, items.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter") {
                    // Enter chọn mục đang sáng, không gửi form.
                    e.preventDefault();
                    if (items[active]) choose(items[active].value);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                  }
                }}
                className="block min-h-10 w-full rounded-control border border-line-strong bg-surface pl-8 pr-2 text-sm text-ink focus-visible:border-primary"
              />
            </div>
            <ul id={`${id}-list`} role="listbox" className="custom-scrollbar max-h-60 overflow-auto py-1">
              {items.length === 0 && <li className="px-3 py-2 text-sm text-muted">Không tìm thấy.</li>}
              {items.map((o, i) => (
                <li
                  key={o.value || "_all"}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(o.value);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm", i === active && "bg-primary-soft text-primary")}
                >
                  <Check className={cn("size-4 shrink-0", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="truncate">{o.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
