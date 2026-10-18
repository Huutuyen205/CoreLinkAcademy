'use client';

import React, { useState } from 'react';

export interface RatingStarsProps {
  value: number; // 1 to 5
  max?: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm gap-0.5',
  md: 'text-lg gap-1',
  lg: 'text-2xl gap-1.5',
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
      role="radiogroup"
      aria-label={`Đánh giá ${value} trên ${max} sao`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= displayValue;

        return (
          <button
            key={starNumber}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(starNumber)}
            onMouseEnter={() => !readOnly && setHoverValue(starNumber)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={`transition-colors duration-150 focus:outline-none ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
            } ${isFilled ? 'text-amber-400' : 'text-slate-700 hover:text-amber-300/60'}`}
            title={`${starNumber} sao`}
            aria-label={`${starNumber} sao`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};
