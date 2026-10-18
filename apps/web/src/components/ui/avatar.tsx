import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const statusClasses = {
  online: 'bg-emerald-500 ring-emerald-500/20',
  offline: 'bg-slate-500 ring-slate-500/20',
  busy: 'bg-rose-500 ring-rose-500/20',
  away: 'bg-amber-500 ring-amber-500/20',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = '',
  size = 'md',
  status,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (text: string) => {
    if (!text) return 'CL';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-slate-800`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name || alt)}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${statusClasses[status]}`}
          title={`Trạng thái: ${status}`}
        />
      )}
    </div>
  );
};
