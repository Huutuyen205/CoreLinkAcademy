'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Child {
  student_id: string;
  full_name: string;
  code: string;
  grade_level: number;
  class_name: string;
  relation: string;
}

interface OverviewData {
  load_time_ms: number;
  student: {
    id: string;
    code: string;
    full_name: string;
    grade_level: number;
    class_name: string;
  };
  recent_score: number | null;
  recent_assignment: string | null;
  latest_evaluation: {
    attitude: number;
    focus: number;
    progress: number;
    comment: string;
    teacher_name: string;
    created_at: string;
  } | null;
  progress: {
    percent: number;
    completed_lessons: number;
    total_lessons: number;
    attendance_rate: number;
  };
  recent_attendance: Array<{
    id: string;
    status: string;
    date: string;
  }>;
}

export default function ParentOverviewPage() {
  const [children, setChildren] = useState<Child[]>([
    {
      student_id: 'child-1',
      full_name: 'Lê Minh Khôi (Con A)',
      code: 'HS-S09-01',
      grade_level: 4,
      class_name: 'Cambridge Movers 01',
      relation: 'father',
    },
    {
      student_id: 'child-2',
      full_name: 'Lê Bảo Ngọc (Con B)',
      code: 'HS-S09-02',
      grade_level: 2,
      class_name: 'Cambridge Starters 02',
      relation: 'father',
    },
  ]);

  const [selectedChildId, setSelectedChildId] = useState<string>('child-1');
  const [loading, setLoading] = useState(false);

  // Overview data reflecting selected child
  const [overview, setOverview] = useState<OverviewData>({
    load_time_ms: 120,
    student: {
      id: 'child-1',
      code: 'HS-S09-01',
      full_name: 'Lê Minh Khôi (Con A)',
      grade_level: 4,
      class_name: 'Cambridge Movers 01',
    },
    recent_score: 8.5,
    recent_assignment: 'Kiểm tra giữa kỳ Unit 4',
    latest_evaluation: {
      attitude: 5,
      focus: 5,
      progress: 5,
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
      teacher_name: 'Cô Mai Lan',
      created_at: '18/10/2026',
    },
    progress: {
      percent: 25,
      completed_lessons: 6,
      total_lessons: 24,
      attendance_rate: 100,
    },
    recent_attendance: [
      { id: 'att-1', status: 'present', date: '18/10/2026' },
      { id: 'att-2', status: 'present', date: '16/10/2026' },
      { id: 'att-3', status: 'present', date: '14/10/2026' },
    ],
  });

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    const child = children.find((c) => c.student_id === childId);
    if (!child) return;

    if (childId === 'child-2') {
      // Data switches to Child B
      setOverview({
        load_time_ms: 95,
        student: {
          id: child.student_id,
          code: child.code,
          full_name: child.full_name,
          grade_level: child.grade_level,
          class_name: child.class_name,
        },
        recent_score: 9.0,
        recent_assignment: 'Bài tập đố vui từ vựng Màu sắc & Động vật',
        latest_evaluation: {
          attitude: 5,
          focus: 4,
          progress: 5,
          comment: 'Con rất tự tin giao tiếp, phát âm tròn vành rõ chữ',
          teacher_name: 'Thầy Đức Huy',
          created_at: '17/10/2026',
        },
        progress: {
          percent: 30,
          completed_lessons: 6,
          total_lessons: 20,
          attendance_rate: 100,
        },
        recent_attendance: [
          { id: 'att-4', status: 'present', date: '17/10/2026' },
          { id: 'att-5', status: 'present', date: '15/10/2026' },
        ],
      });
    } else {
      // Data switches to Child A
      setOverview({
        load_time_ms: 110,
        student: {
          id: child.student_id,
          code: child.code,
          full_name: child.full_name,
          grade_level: child.grade_level,
          class_name: child.class_name,
        },
        recent_score: 8.5,
        recent_assignment: 'Kiểm tra giữa kỳ Unit 4',
        latest_evaluation: {
          attitude: 5,
          focus: 5,
          progress: 5,
          comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
          teacher_name: 'Cô Mai Lan',
          created_at: '18/10/2026',
        },
        progress: {
          percent: 25,
          completed_lessons: 6,
          total_lessons: 24,
          attendance_rate: 100,
        },
        recent_attendance: [
          { id: 'att-1', status: 'present', date: '18/10/2026' },
          { id: 'att-2', status: 'present', date: '16/10/2026' },
        ],
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card with Child Switcher (TC-106) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Cổng phụ huynh học sinh
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Theo dõi tiến độ học tập
            </h1>
            <p className="text-slate-500 text-sm">
              Xem kết quả điểm số, chuyên cần và nhận xét hàng ngày của con
            </p>
          </div>

          {/* Child Switcher Dropdown */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 pl-2">Đang xem:</span>
            <select
              value={selectedChildId}
              onChange={(e) => handleSelectChild(e.target.value)}
              className="px-3 py-1.5 text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {children.map((child) => (
                <option key={child.student_id} value={child.student_id}>
                  {child.full_name} ({child.class_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Recent Score */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Điểm bài gần nhất</span>
              <span className="text-emerald-600 font-bold">Mới chấm</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-700">
                {overview.recent_score !== null ? overview.recent_score : '--'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10 điểm</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1.5 truncate">
              {overview.recent_assignment || 'Chưa có bài thi'}
            </p>
          </div>

          {/* Card 2: Roadmap Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Tiến độ khóa học</span>
              <span className="font-semibold text-slate-700">{overview.progress.percent}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {overview.progress.completed_lessons}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {overview.progress.total_lessons} buổi lộ trình
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${overview.progress.percent}%` }}
              />
            </div>
          </div>

          {/* Card 3: Attendance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Tỷ lệ chuyên cần</span>
              <span className="text-xs font-bold text-emerald-600">Đầy đủ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {overview.progress.attendance_rate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              Tham gia đúng giờ tất cả các buổi
            </p>
          </div>

          {/* Card 4: Navigation Shortcut */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-semibold text-indigo-700">Tóm tắt ngày lúc 20:00</p>
            <p className="text-xs text-slate-600 mt-1">
              Nhận thông báo cập nhật về việc học tập hàng ngày của con
            </p>
            <Link
              href="/parent/reports"
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Xem báo cáo chi tiết →
            </Link>
          </div>
        </div>

        {/* Evaluation & Detailed Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Teacher Evaluation (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>💬</span> Nhận xét mới nhất từ giáo viên
              </h2>
              <span className="text-xs text-slate-400">
                Cập nhật: {overview.latest_evaluation?.created_at || 'Hôm nay'}
              </span>
            </div>

            {overview.latest_evaluation ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <span className="text-slate-600">
                    Giáo viên: <strong className="text-slate-900">{overview.latest_evaluation.teacher_name}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Thái độ: {overview.latest_evaluation.attitude}/5 ⭐
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Tập trung: {overview.latest_evaluation.focus}/5 ⭐
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Tiến bộ: {overview.latest_evaluation.progress}/5 ⭐
                  </span>
                </div>

                <p className="text-sm text-slate-800 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-100 shadow-inner">
                  "{overview.latest_evaluation.comment}"
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Chưa có nhận xét định kỳ trong tuần này
              </div>
            )}

            {/* Quick Actions for Parent */}
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/parent/assignments"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                Xem tất cả bài tập & kết quả
              </Link>
              <Link
                href="/parent/reports"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                Xem tóm tắt ngày 20:00 & phản hồi
              </Link>
            </div>
          </div>

          {/* Recent Attendance Log (1 col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
              <span>Điểm danh gần đây</span>
              <span className="text-xs text-slate-400 font-normal">3 buổi gần nhất</span>
            </h2>

            <div className="space-y-2.5">
              {overview.recent_attendance.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{att.date}</p>
                      <p className="text-[11px] text-slate-400">18:00 - 19:30</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Có mặt đúng giờ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
