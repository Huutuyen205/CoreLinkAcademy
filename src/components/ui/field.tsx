import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

const control =
  "block w-full rounded-control border border-line bg-surface px-3 text-base text-ink placeholder:text-muted/80 focus-visible:border-primary aria-[invalid=true]:border-danger";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Nhãn + gợi ý + lỗi; control bên trong phải dùng `describedBy(id, hint, error)`. */
export function FieldShell({ id, label, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type Common = { name: string; label: string; hint?: string; error?: string; id?: string; className?: string };

export function TextField({ name, label, hint, error, id = name, className, required, ...props }: Common & ComponentProps<"input">) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "min-h-11")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextareaField({ name, label, hint, error, id = name, className, required, ...props }: Common & ComponentProps<"textarea">) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "py-2")}
        {...props}
      />
    </FieldShell>
  );
}

type Option = { value: string; label: string };

export function SelectField({
  name,
  label,
  hint,
  error,
  id = name,
  className,
  required,
  options,
  placeholder,
  ...props
}: Common & ComponentProps<"select"> & { options: Option[]; placeholder?: string }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "min-h-11")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  error,
  id = name,
  className,
  ...props
}: Omit<Common, "hint"> & Omit<ComponentProps<"input">, "type">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-primary"
          {...props}
        />
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
