'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  classId: string;
  classCode: string;
  className: string;
  mode: 'offline' | 'online' | 'hybrid';
  meetingUrl: string | null;
  sessionNo: number;
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  roomName: string | null;
  teacherId: string;
  teacherName: string;
  status: string;
}

export default function AcademicSchedulePage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Filters
  const [teacherFilter, setTeacherFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // Tính khoảng ngày của tuần hiện tại
  const getWeekDates = (offsetWeeks = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const { monday, sunday } = getWeekDates(currentWeekOffset);

  useEffect(() => {
    fetchSchedule();
  }, [currentWeekOffset, teacherFilter, roomFilter]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: monday.toISOString(),
        endDate: sunday.toISOString(),
      });
      if (teacherFilter) params.append('teacherId', teacherFilter);
      if (roomFilter) params.append('roomId', roomFilter);

      const res = await fetch(`/api/v1/academic/schedule?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Lỗi tải thời khóa biểu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gom nhóm sessions theo ngày trong tuần (Thứ 2 = 1 .. Chủ nhật = 7)
  const days = [
    { name: 'Thứ Hai', dayIndex: 1 },
    { name: 'Thứ Ba', dayIndex: 2 },
    { name: 'Thứ Tư', dayIndex: 3 },
    { name: 'Thứ Năm', dayIndex: 4 },
    { name: 'Thứ Sáu', dayIndex: 5 },
    { name: 'Thứ Bảy', dayIndex: 6 },
    { name: 'Chủ Nhật', dayIndex: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-indigo-400 font-semibold mb-1">
            <span>QUẢN LÝ ĐÀO TẠO</span>
            <span>•</span>
            <span>S27 / FR-303</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Thời Khóa Biểu Tuần
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lịch học theo giáo viên, phòng học, lớp và học sinh với link học trực tuyến (FR-309)
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
          >
            ← Tuần trước
          </button>
          <button
            onClick={() => setCurrentWeekOffset(0)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold"
          >
            Tuần này
          </button>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
          >
            Tuần sau →
          </button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div>
          <span>Khoảng thời gian: </span>
          <strong className="text-slate-200">
            {monday.toLocaleDateString('vi-VN')} — {sunday.toLocaleDateString('vi-VN')}
          </strong>
        </div>
        <div>
          Tổng số buổi học: <strong className="text-indigo-400">{sessions.length}</strong>
        </div>
      </div>

      {/* Grid 7 ngày */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((d, idx) => {
          const dayDate = new Date(monday);
          dayDate.setDate(monday.getDate() + idx);

          const daySessions = sessions.filter((s) => {
            const sDate = new Date(s.startsAt);
            return sDate.getDay() === d.dayIndex;
          });

          return (
            <div
              key={d.name}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 min-h-[480px] flex flex-col"
            >
              {/* Day Header */}
              <div className="text-center pb-2 border-b border-slate-800 mb-3">
                <div className="text-xs font-bold text-slate-300">{d.name}</div>
                <div className="text-[11px] text-slate-500">{dayDate.toLocaleDateString('vi-VN')}</div>
              </div>

              {/* Sessions */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {daySessions.length === 0 ? (
                  <div className="text-[11px] text-slate-600 text-center py-8">Không có buổi học</div>
                ) : (
                  daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl p-3 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 transition shadow-sm text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-indigo-400 font-bold">
                          {session.classCode}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            session.mode === 'online'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {session.mode}
                        </span>
                      </div>

                      <div className="font-bold text-slate-200 line-clamp-1 mb-1">{session.className}</div>

                      <div className="text-[11px] text-slate-400 space-y-0.5 mb-2">
                        <div>
                          ⏰ {new Date(session.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(session.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>📍 {session.roomName || 'Chưa xếp phòng'}</div>
                        <div>👨‍🏫 {session.teacherName}</div>
                      </div>

                      {/* Online Meet / Zoom link (FR-309) */}
                      {session.meetingUrl && (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <span>🎥</span>
                          <span>Vào lớp trực tuyến</span>
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
