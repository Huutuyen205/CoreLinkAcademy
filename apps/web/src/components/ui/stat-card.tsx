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
      className={`p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>

        {icon && (
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-100 transition-all duration-200">
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-xs pt-3 border-t border-slate-100">
          {change && (
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                change.isPositive
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border border-rose-200'
              }`}
            >
              {change.isPositive ? '↑' : '↓'} {change.value}
            </span>
          )}
          {change?.period && <span className="text-slate-500">{change.period}</span>}
          {subtitle && !change && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
