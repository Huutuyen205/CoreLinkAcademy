'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Chỉ hiển thị trên các trang ứng dụng (student, parent, teacher, academic, assignments, messages, notifications)
  const isAppSection =
    pathname.startsWith('/student') ||
    pathname.startsWith('/parent') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/academic') ||
    pathname.startsWith('/assignments') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile');

  if (!isAppSection) return null;

  // Quyết định nav items theo vai trò được nhận diện qua đường dẫn
  const isStudent = pathname.startsWith('/student') || pathname.startsWith('/assignments');
  const isParent = pathname.startsWith('/parent');
  const isTeacher = pathname.startsWith('/teacher');

  let navItems: NavItem[] = [
    { label: 'Trang chủ', href: isStudent ? '/student' : isParent ? '/parent' : isTeacher ? '/teacher' : '/student', icon: '🏠' },
    { label: 'Lịch học', href: isStudent ? '/student/schedule' : isParent ? '/parent' : '/academic/schedule', icon: '📅' },
    { label: 'Bài tập', href: isStudent ? '/assignments' : isParent ? '/parent/assignments' : '/teacher/assignments', icon: '📝' },
    { label: 'Tin nhắn', href: '/messages', icon: '💬' },
    { label: 'Cá nhân', href: '/profile', icon: '👤' },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 2);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] px-2 py-1 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-blue-400 font-bold bg-blue-500/10'
                : 'text-slate-400 font-medium hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
