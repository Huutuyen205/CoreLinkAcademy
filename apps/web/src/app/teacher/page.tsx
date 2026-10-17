'use client';

import React from 'react';
import Link from 'next/link';

export default function TeacherDashboardPage() {
  const todayClasses = [
    {
      id: 'cls-1',
      name: 'Cambridge Movers 01',
      time: '18:00 - 19:30',
      room: 'Phòng 204',
      studentsCount: 15,
      sessionNo: 7,
      status: 'upcoming',
    },
    {
      id: 'cls-2',
      name: 'Cambridge Flyers 02',
      time: '19:45 - 21:15',
      room: 'Phòng 301',
      studentsCount: 12,
      sessionNo: 10,
      status: 'upcoming',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Giáo viên chuyên môn
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Xin chào, Cô Mai Lan 👩‍🏫
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Trung tâm CoreLink Academy • Chi nhánh Cầu Giấy
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/teacher/evaluations"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-sm"
            >
              ✍️ Đánh giá nhanh cả lớp
            </Link>
            <Link
              href="/teacher/grading"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/20 backdrop-blur-sm"
            >
              📝 Chấm bài & Rubric
            </Link>
          </div>
        </div>

        {/* 4 Actionable Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Buổi dạy hôm nay</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">2 ca dạy</div>
            <p className="text-xs text-blue-600 font-medium mt-1">Bắt đầu từ 18:00</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Bài tập chờ chấm</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">3 bài tự luận</div>
            <Link href="/teacher/grading" className="text-xs text-blue-600 hover:underline mt-1 block">
              Vào chấm bài ngay →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Tin nhắn phụ huynh</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">1 tin chưa trả lời</div>
            <Link href="/messages" className="text-xs text-blue-600 hover:underline mt-1 block">
              Mở hộp tin nhắn →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Đánh giá cần hoàn thành</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">15 học sinh</div>
            <Link href="/teacher/evaluations" className="text-xs text-blue-600 hover:underline mt-1 block">
              Chọn mẫu & lưu nhanh →
            </Link>
          </div>
        </div>

        {/* Teaching Schedule & Quick Portals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Teaching Classes (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🗓️</span> Lịch giảng dạy hôm nay
              </h2>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                Thứ Bảy, 18/10/2026
              </span>
            </div>

            <div className="space-y-3">
              {todayClasses.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {c.time}
                      </span>
                      <span className="text-xs text-slate-500">Buổi {c.sessionNo}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {c.room} • Sĩ số: <strong className="text-slate-700">{c.studentsCount} học sinh</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/teacher/evaluations"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                    >
                      Đánh giá buổi học
                    </Link>
                    <Link
                      href="/attendance/qr"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                    >
                      Điểm danh QR
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Management Shortcuts (1 col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Tính năng quản lý</h2>
            <div className="space-y-2.5">
              <Link
                href="/teacher/questions"
                className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between block"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Ngân hàng câu hỏi</h4>
                  <p className="text-[11px] text-slate-400">9 dạng câu hỏi, lọc theo 3 nhãn</p>
                </div>
                <span className="text-blue-600 text-sm">→</span>
              </Link>

              <Link
                href="/teacher/assignments"
                className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between block"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Giao bài tập & Đề thi</h4>
                  <p className="text-[11px] text-slate-400">Giao cho lớp, nhóm hoặc cá nhân</p>
                </div>
                <span className="text-blue-600 text-sm">→</span>
              </Link>

              <Link
                href="/teacher/evaluations"
                className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between block"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Đánh giá nhanh theo mẫu</h4>
                  <p className="text-[11px] text-slate-400">Đánh giá cả lớp dưới 3 phút (FR-701)</p>
                </div>
                <span className="text-blue-600 text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
