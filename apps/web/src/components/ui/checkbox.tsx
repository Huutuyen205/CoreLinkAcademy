import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, checked, id, ...props }, ref) => {
    const checkId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={checkId} className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              ref={ref}
              id={checkId}
              checked={checked}
              className={clsx(
                'peer appearance-none w-5 h-5 rounded-lg border transition-all duration-150 outline-none cursor-pointer',
                'bg-white border-slate-300 checked:bg-blue-600 checked:border-blue-600',
                'focus:ring-2 focus:ring-blue-100 group-hover:border-slate-400',
                'disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed',
                className
              )}
              {...props}
            />
            <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none stroke-[2.5]" />
          </div>
          {label && <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">{label}</span>}
        </label>
        {error && <span className="text-xs text-red-600 font-medium ml-7">{error}</span>}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
