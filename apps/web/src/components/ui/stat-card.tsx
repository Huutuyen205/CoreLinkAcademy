import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive?: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  subtitle,
  className = '',
  badge,
}) => {
  return (
    <div
      className={`glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80 transition-all duration-200 relative overflow-hidden group ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>

        {icon && (
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-600/25 transition-all duration-200">
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-xs pt-3 border-t border-slate-800/60">
          {change && (
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                change.isPositive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {change.isPositive ? '↑' : '↓'} {change.value}
            </span>
          )}
          {change?.period && <span className="text-slate-400">{change.period}</span>}
          {subtitle && !change && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
