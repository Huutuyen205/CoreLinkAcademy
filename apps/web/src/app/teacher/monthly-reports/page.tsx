'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StudentMonthlyReport {
  id: string;
  studentName: string;
  studentCode: string;
  attendanceRate: number;
  testAvg: number;
  homeworkRatio: number;
  aiDraft: string;
  finalText: string;
  status: 'drafted' | 'sent';
  isEditing: boolean;
}

export default function TeacherMonthlyReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [hasReminderWarning, setHasReminderWarning] = useState(true);

  const [reports, setReports] = useState<StudentMonthlyReport[]>([
    {
      id: 'mr-101',
      studentName: 'Phạm Minh Châu',
      studentCode: 'HS-S12-01',
      attendanceRate: 96,
      testAvg: 8.5,
      homeworkRatio: 1.0,
      aiDraft:
        'Báo cáo tháng 10 của em Phạm Minh Châu: Tỷ lệ chuyên cần đạt 96%, điểm kiểm tra trung bình 8.5/10. Em tiếp thu bài rất nhanh ở phần phát âm và từ vựng. Đề xuất gia đình cùng hỗ trợ em củng cố thêm các dạng bài đọc hiểu suy luận.',
      finalText:
        'Báo cáo tháng 10 của em Phạm Minh Châu: Tỷ lệ chuyên cần đạt 96%, điểm kiểm tra trung bình 8.5/10. Em tiếp thu bài rất nhanh ở phần phát âm và từ vựng. Cô giáo rất khen ngợi sự tích cực đóng góp bài của Châu trong tháng qua!',
      status: 'drafted',
      isEditing: false,
    },
    {
      id: 'mr-102',
      studentName: 'Lê Minh Khôi',
      studentCode: 'HS-S09-01',
      attendanceRate: 92,
      testAvg: 8.0,
      homeworkRatio: 0.9,
      aiDraft:
        'Báo cáo tháng 10 của em Lê Minh Khôi: Chuyên cần đạt 92%, điểm trung bình 8.0/10. Em hoàn thành tốt các bài tập ngữ pháp thì hoàn thành.',
      finalText:
        'Báo cáo tháng 10 của em Lê Minh Khôi: Chuyên cần đạt 92%, điểm trung bình 8.0/10. Em hoàn thành tốt các bài tập ngữ pháp thì hoàn thành.',
      status: 'drafted',
      isEditing: false,
    },
    {
      id: 'mr-103',
      studentName: 'Trần Tuấn Kiệt',
      studentCode: 'HS-S09-03',
      attendanceRate: 88,
      testAvg: 7.2,
      homeworkRatio: 0.8,
      aiDraft:
        'Báo cáo tháng 10 của em Trần Tuấn Kiệt: Tỷ lệ chuyên cần 88%, điểm trung bình 7.2/10. Em cần chú ý làm đầy đủ bài tập nghe trước khi đến lớp.',
      finalText:
        'Báo cáo tháng 10 của em Trần Tuấn Kiệt: Tỷ lệ chuyên cần 88%, điểm trung bình 7.2/10. Em cần chú ý làm đầy đủ bài tập nghe trước khi đến lớp.',
      status: 'drafted',
      isEditing: false,
    },
  ]);

  const handleUpdateText = (id: string, newText: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, finalText: newText } : r)),
    );
  };

  const handleToggleEdit = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEditing: !r.isEditing } : r)),
    );
  };

  const handleApproveBatch = () => {
    setIsApprovingAll(true);
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) => ({
          ...r,
          status: 'sent',
          isEditing: false,
        })),
      );
      setHasReminderWarning(false);
      setIsApprovingAll(false);
    }, 1000);
  };

  const pendingCount = reports.filter((r) => r.status === 'drafted').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Báo cáo học tập định kỳ • FR-803 (TC-107, TC-108)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Phê Duyệt Báo Cáo Tháng Hàng Loạt 📋
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              AI soạn thảo tự động ngày 28 • Giáo viên chỉnh sửa & duyệt cả lớp trên 1 màn hình
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white/10 text-white font-medium text-xs border border-white/20 backdrop-blur-sm focus:outline-none"
            >
              <option value="2026-10" className="text-slate-800">Tháng 10/2026</option>
              <option value="2026-09" className="text-slate-800">Tháng 09/2026</option>
            </select>

            <button
              onClick={handleApproveBatch}
              disabled={isApprovingAll || pendingCount === 0}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              {isApprovingAll ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi phụ huynh...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Duyệt & Gửi cả lớp ({pendingCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TC-108: Reminder Banner when past Day 3 */}
        {hasReminderWarning && pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <span className="font-bold">Cảnh báo nhắc nhở ngày 3 (TC-108): </span>
                <span>
                  Lớp còn <span className="font-bold text-amber-800">{pendingCount} báo cáo tháng</span> chưa được duyệt gửi phụ huynh. Ban Giáo vụ và Giáo viên đã được gửi thông báo đôn đốc.
                </span>
              </div>
            </div>
            <button
              onClick={handleApproveBatch}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm"
            >
              Duyệt ngay
            </button>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 transition-all ${
                r.status === 'drafted'
                  ? 'border-indigo-200 ring-1 ring-indigo-50'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              {/* Student Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {r.studentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {r.studentName}
                      <span className="font-mono text-xs text-slate-400 font-normal">({r.studentCode})</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>Chuyên cần: <b className="text-slate-800">{r.attendanceRate}%</b></span>
                      <span>•</span>
                      <span>Điểm TB: <b className="text-slate-800">{r.testAvg}/10</b></span>
                      <span>•</span>
                      <span>Bài tập: <b className="text-slate-800">{Math.round(r.homeworkRatio * 100)}%</b></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      r.status === 'drafted'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {r.status === 'drafted' ? '⏳ Bản nháp (Draft)' : '✅ Đã gửi phụ huynh'}
                  </span>
                  <button
                    onClick={() => handleToggleEdit(r.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
                  >
                    {r.isEditing ? 'Đóng sửa' : '✏️ Sửa'}
                  </button>
                </div>
              </div>

              {/* Report Body */}
              <div className="text-xs space-y-2">
                <span className="font-semibold text-slate-600 block">Nội dung báo cáo gửi phụ huynh:</span>
                {r.isEditing ? (
                  <textarea
                    rows={4}
                    value={r.finalText}
                    onChange={(e) => handleUpdateText(r.id, e.target.value)}
                    className="w-full p-3 border border-indigo-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                  />
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    {r.finalText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
