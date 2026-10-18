import React from 'react';
import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'ai';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center font-semibold rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200',
    success: 'bg-emerald-50 text-[#0F9D8A] border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    destructive: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'border border-slate-200 text-slate-700 bg-white',
    ai: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={clsx(baseClasses, variants[variant], sizes[size], className)} {...props}>
      {variant === 'ai' && <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />}
      {children}
    </span>
  );
};
