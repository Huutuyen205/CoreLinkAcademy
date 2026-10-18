'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, Video, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <span>Quản Lý Đào Tạo</span>
            <span>•</span>
            <span>Thời Khóa Biểu Học Kỳ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Thời Khóa Biểu Tuần Toàn Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi phân bổ phòng học, giảng viên phụ trách và link lớp học trực tuyến theo thời gian thực
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Tuần trước
          </button>
          <button
            onClick={() => setCurrentWeekOffset(0)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold shadow-xs transition-colors cursor-pointer"
          >
            Tuần này
          </button>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Tuần sau
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
        <div>
          <span>Khoảng thời gian: </span>
          <strong className="text-slate-900 font-bold">
            {monday.toLocaleDateString('vi-VN')} — {sunday.toLocaleDateString('vi-VN')}
          </strong>
        </div>
        <div>
          Tổng số buổi học trong tuần: <strong className="text-blue-600 font-bold">{sessions.length}</strong> buổi
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
              className="rounded-2xl border border-slate-200/90 bg-slate-100/70 p-3 min-h-[480px] flex flex-col shadow-2xs"
            >
              {/* Day Header */}
              <div className="text-center pb-2.5 border-b border-slate-200 mb-3 bg-white -m-3 p-3 rounded-t-2xl">
                <div className="text-xs font-bold text-slate-900">{d.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">{dayDate.toLocaleDateString('vi-VN')}</div>
              </div>

              {/* Sessions */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {daySessions.length === 0 ? (
                  <div className="text-[11px] text-slate-400 text-center py-10 italic">Không có buổi học</div>
                ) : (
                  daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl p-3 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {session.classCode}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            session.mode === 'online'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {session.mode}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 line-clamp-1 mb-1.5">{session.className}</div>

                      <div className="text-[11px] text-slate-500 space-y-1 mb-2.5">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(session.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(session.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{session.roomName || 'Chưa xếp phòng'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{session.teacherName}</span>
                        </div>
                      </div>

                      {/* Online Meet link */}
                      {session.meetingUrl && (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3 h-3 text-blue-600" />
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
