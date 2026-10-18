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
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    primary: 'bg-blue-600/15 text-blue-400 border border-blue-500/30',
    success: 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-600/15 text-amber-400 border border-amber-500/30',
    destructive: 'bg-red-600/15 text-red-400 border border-red-500/30',
    outline: 'border border-slate-600 text-slate-300 bg-transparent',
    ai: 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={clsx(baseClasses, variants[variant], sizes[size], className)} {...props}>
      {variant === 'ai' && <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />}
      {children}
    </span>
  );
};
