'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface TodayClass {
  id: string;
  name: string;
  time: string;
  room: string;
  teacher: string;
  meetingUrl?: string;
}

interface DueAssignment {
  id: string;
  title: string;
  dueAt: string;
  kind: string;
  timeLeft: string;
}

export default function StudentDashboardPage() {
  const [progress, setProgress] = useState({
    percent: 25,
    completedLessons: 6,
    totalLessons: 24,
    attendanceRate: 98,
  });

  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([
    {
      id: 'session-1',
      name: 'Cambridge Movers 01 - Unit 4: Family & Hobbies',
      time: '18:00 - 19:30',
      room: 'Phòng 204 (Tầng 2)',
      teacher: 'Cô Mai Lan',
      meetingUrl: 'https://meet.corelink.edu.vn/cls-m01',
    },
  ]);

  const [dueAssignments, setDueAssignments] = useState<DueAssignment[]>([
    {
      id: 'asg-1',
      title: 'Kiểm tra từ vựng Unit 4 (Vocabulary Quiz)',
      dueAt: 'Hôm nay, 21:00',
      kind: 'quiz',
      timeLeft: 'Còn 3 giờ',
    },
    {
      id: 'asg-2',
      title: 'Bài tập đọc hiểu: Reading Comprehension Practice 4',
      dueAt: 'Ngày mai, 20:00',
      kind: 'homework',
      timeLeft: 'Còn 26 giờ',
    },
  ]);

  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Học sinh năng động
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Xin chào, Lê Minh Khôi 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Mã học sinh: <span className="font-semibold text-white">HS-S09-01</span> • Lớp: Cambridge Movers 01
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/student/schedule"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20 backdrop-blur-sm"
            >
              Xem lịch tuần
            </Link>
            <Link
              href="/assignments"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm transition-all shadow-sm"
            >
              Làm bài tập
            </Link>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              🎯
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tiến độ lộ trình</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-800">{progress.percent}%</span>
                <span className="text-xs text-slate-500 font-medium">
                  ({progress.completedLessons}/{progress.totalLessons} bài)
                </span>
              </div>
              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              ⭐
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Chuyên cần</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-800">{progress.attendanceRate}%</span>
                <span className="text-xs text-emerald-600 font-medium">Tốt</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Đã tham gia 6/6 buổi học</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              📚
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bài cần hoàn thành</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-amber-600">{dueAssignments.length}</span>
                <span className="text-xs text-slate-500 font-medium">bài tập</span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-1">1 bài hết hạn hôm nay</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Today's Classes & Urgent Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Today's Schedule & Learning Materials (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hôm nay học gì?
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                  Thứ Bảy, 18/10/2026
                </span>
              </div>

              {todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {cls.time}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                        <p className="text-xs text-slate-500">
                          {cls.room} • Giảng viên: <span className="font-medium text-slate-700">{cls.teacher}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {cls.meetingUrl && (
                          <a
                            href={cls.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <span>📹</span> Vào lớp online
                          </a>
                        )}
                        <Link
                          href="/student/materials"
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                        >
                          Tài liệu buổi học
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  Hôm nay bạn không có lịch học. Hãy dành thời gian ôn luyện nhé!
                </div>
              )}
            </div>

            {/* AI Practice Recommendations */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>💡</span> Trợ Lý AI & Luyện Tập Cá Nhân Hóa
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                  AI Hub
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  href="/student/speaking"
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎙️</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Phòng Luyện Nói AI (Speaking Coach)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Thu âm • Nhận diện phát âm IPA & Lưu loát</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/student/vocabulary"
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Sổ Tay Từ Vựng Flashcards (SM-2)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Lặp lại ngắt quãng • Nhớ lâu gấp 3 lần</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/student/tutor"
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Gia Sư AI 1-Kèm-1 (AI Tutor)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Giải đáp ngữ pháp & Bài tập khó 24/7</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/student/competency"
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Bản Đồ Năng Lực 4 Kỹ Năng</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Radar CEFR • Bài luyện thích ứng</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Urgent Assignments (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Bài sắp hết hạn</span>
                <Link href="/assignments" className="text-xs text-blue-600 hover:underline font-medium">
                  Xem tất cả
                </Link>
              </h2>

              <div className="space-y-3">
                {dueAssignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{asg.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⏳ {asg.timeLeft}
                      </span>
                      <Link
                        href={`/assignments/${asg.id}/take`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                      >
                        Làm ngay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/student/materials"
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📁</span> Mở kho học liệu lớp học
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
