import React from 'react';
import { clsx } from 'clsx';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={clsx('flex items-center text-xs text-slate-400', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/" className="hover:text-blue-400 transition-colors flex items-center">
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <li>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </li>
              <li>
                {isLast || !item.href ? (
                  <span className="text-slate-200 font-medium">{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-blue-400 transition-colors">
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
