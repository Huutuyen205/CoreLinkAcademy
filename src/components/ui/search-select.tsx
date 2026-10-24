"use client";

import { Check, ChevronDown } from "lucide-react";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldShell } from "@/components/ui/field";
import { InFilterForm } from "@/components/ui/filter-form";
import { cn } from "@/lib/format";
import { foldVietnamese } from "@/lib/search";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  options: Option[];
  /** Chữ mờ khi chưa chọn gì (mặc định: `emptyLabel` hoặc "Gõ để tìm…"). */
  placeholder?: string;
  /** Mục bỏ chọn (value ""), vd. "Tất cả". Không hiện khi `required`; xóa hết chữ rồi rời ô cũng bỏ chọn. */
  emptyLabel?: string;
  defaultValue?: string;
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
  /** Mặc định: tự gửi form khi nằm trong `FilterForm`, không gửi ở form thường. */
  autoSubmit?: boolean;
  /** Tăng lên để xóa lựa chọn (vd. sau khi liên kết thành công). */
  resetKey?: number;
  onChange?: (value: string) => void;
};

const MAX_SHOWN = 80;

/**
 * Ô chọn dùng chung toàn hệ thống: một ô viền xanh vừa gõ để tìm (không cần dấu) vừa bấm để xổ danh sách.
 * Nhãn dài tự cắt trong ô và xuống dòng trong danh sách — không tràn khỏi khung. Gửi `name` = value đã chọn như `<select>`;
 * trong `FilterForm` chọn xong là lọc ngay. Dùng cho mọi danh sách từ ~6 mục hoặc nhãn dài; enum ngắn dùng `SelectField`.
 */
export function SearchSelect({
  name,
  label,
  options,
  placeholder,
  emptyLabel,
  defaultValue = "",
  id: idProp,
  hint,
  error,
  required,
  disabled,
  hideLabel,
  className,
  autoSubmit,
  resetKey,
  onChange,
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  const inFilter = useContext(InFilterForm);
  const submitOnPick = autoSubmit ?? inFilter;

  const [value, setValue] = useState(defaultValue);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hidden = useRef<HTMLInputElement>(null);
  const changed = useRef(false);

  // Trang lọc dựng lại với giá trị mới (vd. bấm "Xóa lọc") hoặc form báo xóa lựa chọn.
  const [lastDefault, setLastDefault] = useState(defaultValue);
  if (defaultValue !== lastDefault) {
    setLastDefault(defaultValue);
    setValue(defaultValue);
    setTyping(false);
  }
  const [lastReset, setLastReset] = useState(resetKey);
  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setValue("");
    setTyping(false);
  }

  const selected = options.find((o) => o.value === value);
  const showEmpty = emptyLabel !== undefined && !required;

  const matches = useMemo(() => {
    const terms = typing ? foldVietnamese(text).split(/\s+/).filter(Boolean) : [];
    if (terms.length === 0) return showEmpty ? [{ value: "", label: emptyLabel }, ...options] : options;
    return options.filter((o) => {
      const key = foldVietnamese(o.label);
      return terms.every((t) => key.includes(t));
    });
  }, [options, emptyLabel, showEmpty, text, typing]);
  const shown = matches.slice(0, MAX_SHOWN);

  // Gửi form sau khi ô ẩn đã nhận giá trị mới.
  useEffect(() => {
    if (!changed.current) return;
    changed.current = false;
    if (submitOnPick) hidden.current?.form?.requestSubmit();
  }, [value, submitOnPick]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const choose = (v: string) => {
    setOpen(false);
    setTyping(false);
    if (v === value) return;
    changed.current = true;
    setValue(v);
    onChange?.(v);
  };

  const openList = () => {
    if (disabled) return;
    if (!open) setActive(Math.max(0, matches.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const shownText = typing ? text : (selected?.label ?? "");

  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <input ref={hidden} type="hidden" name={name} value={value} />
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          enterKeyHint="done"
          data-no-filter=""
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          placeholder={placeholder ?? emptyLabel ?? "Gõ để tìm…"}
          title={selected?.label}
          value={shownText}
          onChange={(e) => {
            setText(e.target.value);
            setTyping(true);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            openList();
          }}
          onClick={openList}
          onBlur={() => {
            setOpen(false);
            if (typing && text.trim() === "" && showEmpty) choose("");
            else setTyping(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) openList();
              else setActive((a) => Math.min(a + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open) {
              // Enter chọn mục đang sáng thay vì gửi form.
              e.preventDefault();
              if (shown[active]) choose(shown[active].value);
            } else if (e.key === "Escape" && open) {
              e.preventDefault();
              setOpen(false);
              setTyping(false);
            }
          }}
          className="block min-h-11 w-full truncate rounded-control border border-primary bg-surface pl-3 pr-9 text-base text-ink placeholder:text-muted/80 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger"
        />
        <ChevronDown className={cn("pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary transition-transform", open && "rotate-180")} aria-hidden="true" />
        {open && (
          <ul
            id={listId}
            role="listbox"
            onMouseDown={(e) => e.preventDefault()}
            className="custom-scrollbar absolute left-0 z-30 mt-1 max-h-64 w-full overflow-y-auto overflow-x-hidden rounded-control border border-primary bg-surface py-1 shadow-lg"
          >
            {shown.length === 0 && <li className="px-3 py-2 text-sm text-muted">Không tìm thấy “{text}”.</li>}
            {shown.map((o, i) => (
              <li
                key={o.value || "_empty"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o.value);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex min-h-10 cursor-pointer items-start gap-2 px-3 py-2 text-sm", i === active && "bg-primary-soft text-primary", o.value === value && "font-semibold")}
              >
                <Check className={cn("mt-0.5 size-4 shrink-0", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                <span className="min-w-0 break-words">{o.label}</span>
              </li>
            ))}
            {matches.length > MAX_SHOWN && <li className="px-3 py-2 text-xs text-muted">Còn {matches.length - MAX_SHOWN} kết quả — gõ thêm để thu hẹp.</li>}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
