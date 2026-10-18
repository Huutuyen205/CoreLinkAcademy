import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra sự cố',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng thử lại sau.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </Button>
      )}
    </div>
  );
};
