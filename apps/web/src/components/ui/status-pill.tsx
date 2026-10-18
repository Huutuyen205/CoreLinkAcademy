import React from 'react';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';
export type GeneralStatus = 'paid' | 'unpaid' | 'pending' | 'submitted' | 'graded' | 'active' | 'inactive';

export interface StatusPillProps {
  status: AttendanceStatus | GeneralStatus | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  present: {
    label: 'Có mặt',
    dot: 'bg-emerald-400 animate-pulse',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  late: {
    label: 'Đi muộn',
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  absent: {
    label: 'Vắng mặt',
    dot: 'bg-rose-500',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  excused: {
    label: 'Có phép',
    dot: 'bg-indigo-400',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  paid: {
    label: 'Đã đóng',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  unpaid: {
    label: 'Chưa đóng',
    dot: 'bg-rose-400',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  pending: {
    label: 'Đang xử lý',
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  submitted: {
    label: 'Đã nộp',
    dot: 'bg-blue-400',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  graded: {
    label: 'Đã chấm',
    dot: 'bg-purple-400',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  active: {
    label: 'Đang hoạt động',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  inactive: {
    label: 'Tạm dừng',
    dot: 'bg-slate-400',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalizedKey = status?.toLowerCase() || '';
  const config = statusConfig[normalizedKey] || {
    label: label || status,
    dot: 'bg-slate-400',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{label || config.label}</span>
    </span>
  );
};
