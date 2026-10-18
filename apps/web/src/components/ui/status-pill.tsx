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
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  late: {
    label: 'Đi muộn',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  absent: {
    label: 'Vắng mặt',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  excused: {
    label: 'Có phép',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  paid: {
    label: 'Đã đóng',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  unpaid: {
    label: 'Chưa đóng',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  pending: {
    label: 'Đang xử lý',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  submitted: {
    label: 'Đã nộp',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  graded: {
    label: 'Đã chấm',
    dot: 'bg-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  active: {
    label: 'Đang hoạt động',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  inactive: {
    label: 'Tạm dừng',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
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
