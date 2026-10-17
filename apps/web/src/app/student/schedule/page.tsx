'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  dayOfWeek: string;
  date: string;
  time: string;
  className: string;
  room: string;
  teacher: string;
  status: 'done' | 'scheduled' | 'cancelled';
  meetingUrl?: string;
}

export default function StudentSchedulePage() {
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'ses-1',
      dayOfWeek: 'Thứ Ba',
      date: '14/10/2026',
      time: '18:00 - 19:30',
      className: 'Cambridge Movers 01',
      room: 'Phòng 204',
      teacher: 'Cô Mai Lan',
      status: 'done',
    },
    {
      id: 'ses-2',
      dayOfWeek: 'Thứ Năm',
      date: '16/10/2026',
      time: '18:00 - 19:30',
      className: 'Cambridge Movers 01',
      room: 'Phòng 204',
      teacher: 'Cô Mai Lan',
      status: 'done',
    },
    {
      id: 'ses-3',
      dayOfWeek: 'Thứ Bảy',
      date: '18/10/2026',
      time: '18:00 - 19:30',
      className: 'Cambridge Movers 01',
      room: 'Phòng 204',
      teacher: 'Cô Mai Lan',
      status: 'scheduled',
      meetingUrl: 'https://meet.corelink.edu.vn/cls-m01',
    },
    {
      id: 'ses-4',
      dayOfWeek: 'Thứ Ba',
      date: '21/10/2026',
      time: '18:00 - 19:30',
      className: 'Cambridge Movers 01',
      room: 'Phòng 204',
      teacher: 'Cô Mai Lan',
      status: 'scheduled',
    },
  ]);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const handleOpenLeaveModal = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsLeaveModalOpen(true);
    setLeaveSuccess(false);
    setLeaveReason('');
  };

  const handleSubmitLeave = () => {
    if (!leaveReason.trim()) return;
    setLeaveSuccess(true);
    setTimeout(() => {
      setIsLeaveModalOpen(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-blue-600 hover:underline">
                ← Bảng điều khiển
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Thời khóa biểu của tôi</h1>
            <p className="text-slate-500 text-sm">Xem lịch học, phòng học hoặc đường dẫn học online</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Tuần hiện tại: 13/10 - 19/10/2026
            </span>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="space-y-4">
          {sessions.map((ses) => (
            <div
              key={ses.id}
              className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                ses.status === 'scheduled' ? 'border-slate-200 hover:border-blue-300' : 'border-slate-100 opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${
                    ses.status === 'done'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <span className="text-sm">{ses.dayOfWeek}</span>
                  <span className="text-[10px] font-normal">{ses.date.slice(0, 5)}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {ses.time}
                    </span>
                    {ses.status === 'done' ? (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Đã kết thúc
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Sắp diễn ra
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{ses.className}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {ses.room} • Giảng viên: <span className="font-semibold text-slate-700">{ses.teacher}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {ses.meetingUrl && ses.status === 'scheduled' && (
                  <a
                    href={ses.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>📹</span> Vào học online
                  </a>
                )}
                {ses.status === 'scheduled' && (
                  <button
                    onClick={() => handleOpenLeaveModal(ses.id)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                  >
                    Xin nghỉ phép
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Xin nghỉ */}
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Gửi đơn xin nghỉ có phép</h3>
              <p className="text-xs text-slate-500">
                Đơn xin nghỉ cần gửi trước giờ học để giáo viên và giáo vụ trung tâm ghi nhận lý do chính đáng.
              </p>

              {leaveSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium text-center">
                  ✅ Đã gửi đơn xin nghỉ thành công! Giáo viên sẽ được thông báo.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Lý do xin nghỉ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Ví dụ: Em bị sốt hoặc có lịch thi ở trường..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsLeaveModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSubmitLeave}
                      disabled={!leaveReason.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium"
                    >
                      Xác nhận gửi đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
