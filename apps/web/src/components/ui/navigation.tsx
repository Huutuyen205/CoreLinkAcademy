'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Home,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  MessageSquare,
  Bell,
  User,
  GraduationCap,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface NavigationProps {
  role?: 'student' | 'guardian' | 'teacher' | 'staff' | 'public';
}

export const Navigation: React.FC<NavigationProps> = ({ role = 'public' }) => {
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'student':
        return [
          { label: 'Trang chính', href: '/student', icon: <Home className="w-5 h-5" /> },
          { label: 'Lịch học', href: '/student/schedule', icon: <Calendar className="w-5 h-5" /> },
          { label: 'Bài tập', href: '/assignments', icon: <FileText className="w-5 h-5" /> },
          { label: 'Điểm danh', href: '/attendance', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Gia sư AI', href: '/student/tutor', icon: <Sparkles className="w-5 h-5" /> },
          { label: 'Năng lực', href: '/student/competency', icon: <BarChart3 className="w-5 h-5" /> },
        ];
      case 'guardian':
        return [
          { label: 'Tổng quan', href: '/parent', icon: <Home className="w-5 h-5" /> },
          { label: 'Bài tập con', href: '/parent/assignments', icon: <FileText className="w-5 h-5" /> },
          { label: 'Báo cáo', href: '/parent/monthly-reports', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Học phí', href: '/parent/tuition', icon: <DollarSign className="w-5 h-5" /> },
          { label: 'Khảo sát', href: '/parent/surveys', icon: <CheckCircle className="w-5 h-5" /> },
        ];
      case 'teacher':
        return [
          { label: 'Bàn việc', href: '/teacher', icon: <Home className="w-5 h-5" /> },
          { label: 'Lớp học', href: '/teacher/assignments', icon: <Users className="w-5 h-5" /> },
          { label: 'Giáo trình', href: '/teacher/curriculum', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Chấm bài', href: '/teacher/grading', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Bảng lương', href: '/teacher/payroll', icon: <DollarSign className="w-5 h-5" /> },
        ];
      case 'staff':
        return [
          { label: 'Dashboard', href: '/admin/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
          { label: 'Khách CRM', href: '/consultant/leads', icon: <Users className="w-5 h-5" /> },
          { label: 'Lớp & Lịch', href: '/academic/classes', icon: <Calendar className="w-5 h-5" /> },
          { label: 'Học phí', href: '/accounting/tuition', icon: <DollarSign className="w-5 h-5" /> },
          { label: 'Cấu hình', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
        ];
      default:
        return [
          { label: 'Trang chủ', href: '/', icon: <Home className="w-5 h-5" /> },
          { label: 'Khóa học', href: '/courses', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Học thử', href: '/register-trial', icon: <GraduationCap className="w-5 h-5" /> },
          { label: 'Blog', href: '/blog', icon: <FileText className="w-5 h-5" /> },
          { label: 'Thông tin', href: '/info', icon: <CheckCircle className="w-5 h-5" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop / Tablet Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-100 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>
              CoreLink<span className="text-blue-500">.</span>Academy
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'px-3.5 py-2 text-xs font-medium rounded-xl transition-all duration-150 flex items-center gap-2',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <Link
              href="/messages"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
              title="Tin nhắn"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link
              href="/notifications"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors relative"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
            </Link>
            <Link
              href="/profile"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
              title="Tài khoản"
            >
              <User className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile-first (360px+) Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors select-none',
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {item.icon}
                <span className="mt-0.5 truncate max-w-[55px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
