'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ParentMonthlyReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  const reportData = {
    studentName: 'Lê Minh Khôi (Con A)',
    studentCode: 'HS-S09-01',
    className: 'Cambridge Movers 01',
    teacherName: 'Cô Mai Lan (Giáo viên chủ nhiệm)',
    attendanceRate: 98,
    averageScore: 8.5,
    completedHomework: '8/8 bài (100%)',
    finalText:
      'Báo cáo tháng 10/2026 của em Lê Minh Khôi:\n\nTrong tháng qua, Minh Khôi duy trì tỷ lệ chuyên cần rất xuất sắc đạt 98% và điểm kiểm tra định kỳ trung bình đạt 8.5/10. Khôi đặc biệt tự tin trong các giờ luyện nói (Speaking), phát âm rõ ràng và phản xạ nhanh. Ở phần đọc hiểu (Reading), em đã tiến bộ vượt bậc so với tháng trước, không còn bị nhầm lẫn giữa các thì quá khứ đơn và hiện tại hoàn thành.\n\nCô giáo gửi lời khen ngợi tinh thần học tập gương mẫu của Khôi và kính chúc gia đình luôn dồi dào sức khỏe!',
    approvedAt: '29/10/2026 14:30',
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setSubmittedFeedback(feedbackText);
      setFeedbackText('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Báo cáo định kỳ phụ huynh • FR-803
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Báo Cáo Học Tập Hàng Tháng 📑
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Học sinh: {reportData.studentName} • {reportData.className}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/parent"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/20 backdrop-blur-sm"
            >
              ← Tổng quan con
            </Link>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md focus:outline-none"
            >
              <option value="2026-10">Tháng 10/2026</option>
              <option value="2026-09">Tháng 09/2026</option>
            </select>
          </div>
        </div>

        {/* Fact Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-xs text-slate-500 block mb-1">Chuyên cần tháng</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {reportData.attendanceRate}%
            </div>
            <span className="text-[11px] text-slate-400">Không vắng buổi nào</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-xs text-slate-500 block mb-1">Điểm kiểm tra TB</span>
            <div className="text-2xl font-bold text-indigo-600 font-mono">
              {reportData.averageScore} / 10
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">↑ Tăng 0.5 so với tháng 9</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-xs text-slate-500 block mb-1">Bài tập hoàn thành</span>
            <div className="text-2xl font-bold text-purple-600 font-mono">
              {reportData.completedHomework}
            </div>
            <span className="text-[11px] text-slate-400">Đúng hạn 100%</span>
          </div>
        </div>

        {/* Official Report Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>💬</span> Nhận xét chi tiết từ Giáo viên chủ nhiệm
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportData.teacherName} • Duyệt lúc {reportData.approvedAt}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Đã kiểm duyệt chính thức
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
            {reportData.finalText}
          </div>
        </div>

        {/* Guardian Feedback Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>✍️</span> Phản hồi của Phụ huynh gửi Giáo viên & Trung tâm
          </h3>
          <p className="text-xs text-slate-500">
            Mọi ý kiến đóng góp của gia đình sẽ được gửi trực tiếp đến Giáo viên chủ nhiệm và Ban Giám đốc đào tạo CoreLink.
          </p>

          {submittedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <span className="font-bold">✓ Cảm ơn gia đình đã gửi phản hồi:</span>
              <p className="text-slate-700 italic">"{submittedFeedback}"</p>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="space-y-3">
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Nhập phản hồi hoặc câu hỏi của phụ huynh về tình hình học tập của con..."
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !feedbackText.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
