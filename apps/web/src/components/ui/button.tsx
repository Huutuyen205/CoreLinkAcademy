import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'ai';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
      secondary:
        'bg-[#0F9D8A] hover:bg-[#0D8272] text-white shadow-sm hover:shadow active:scale-[0.98]',
      outline:
        'border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
      destructive:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-[0.98]',
      ai: 'bg-gradient-to-r from-blue-600 to-[#0F9D8A] hover:from-blue-700 hover:to-[#0D8272] text-white shadow-sm active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
