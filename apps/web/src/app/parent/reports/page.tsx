'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DailySummary {
  id: string;
  date: string;
  textVi: string;
  sentAt: string;
}

export default function ParentReportsPage() {
  const [selectedChild, setSelectedChild] = useState('Lê Minh Khôi (Con A)');
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const summaries: DailySummary[] = [
    {
      id: 'ds-1',
      date: '18/10/2026',
      textVi:
        'Hôm nay Lê Minh Khôi đã tham gia đầy đủ buổi học tại lớp Cambridge Movers 01. Con đã hoàn thành nộp bài "Kiểm tra giữa kỳ Unit 4" đạt 8.5 điểm. Nhận xét từ giáo viên trong ngày: "Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài" (từ giáo viên Cô Mai Lan).',
      sentAt: '20:00:15',
    },
    {
      id: 'ds-2',
      date: '16/10/2026',
      textVi:
        'Hôm nay Lê Minh Khôi đã tham gia đầy đủ buổi học tại lớp Cambridge Movers 01. Con đã hoàn thành nộp bài "Luyện tập ngữ pháp thì Hiện tại tiếp diễn" đạt 9.0 điểm.',
      sentAt: '20:00:08',
    },
    {
      id: 'ds-3',
      date: '14/10/2026',
      textVi:
        'Hôm nay Lê Minh Khôi đã tham gia đầy đủ buổi học tại lớp Cambridge Movers 01. Giáo viên ghi nhận con phát âm to rõ và tích cực tham gia các hoạt động trò chơi nhóm.',
      sentAt: '20:00:22',
    },
  ];

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedback('');
      setFeedbackSent(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/parent" className="text-xs text-blue-600 hover:underline">
                ← Bảng tổng quan
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Báo cáo & Tóm tắt học tập</h1>
            <p className="text-slate-500 text-sm">
              Hệ thống tự động tổng hợp lúc 20:00 mỗi ngày từ dữ kiện thực tế (điểm danh, bài nộp, nhận xét)
            </p>
          </div>

          <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-blue-800">
            👤 {selectedChild}
          </div>
        </div>

        {/* Daily Summaries Stream */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📅</span> Nhật ký học tập hàng ngày
          </h2>

          {summaries.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Ngày {s.date}
                </span>
                <span className="text-slate-400">Gửi lúc {s.sentAt}</span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {s.textVi}
              </p>
            </div>
          ))}
        </div>

        {/* Monthly Report Summary Preview */}
        <div className="bg-gradient-to-br from-indigo-700 to-blue-800 p-6 rounded-2xl text-white shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Báo cáo định kỳ
            </span>
            <span className="text-xs text-blue-200">Tháng 10/2026</span>
          </div>

          <h3 className="text-lg font-bold">Báo cáo đánh giá năng lực & chuyên cần tháng 10</h3>
          <p className="text-xs text-blue-100 leading-relaxed">
            Học sinh Lê Minh Khôi duy trì tỷ lệ chuyên cần 100%, hoàn thành 100% bài tập về nhà với điểm trung bình 8.75/10. Giáo viên đánh giá con nắm chắc kiến thức Unit 1 - 4.
          </p>
        </div>

        {/* Parent Feedback Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900">Phản hồi của phụ huynh</h3>
          <p className="text-xs text-slate-500">
            Quý phụ huynh có thể gửi phản hồi, góp ý hoặc dặn dò trực tiếp đến giáo viên giảng dạy và giáo vụ trung tâm.
          </p>

          {feedbackSent ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium text-center">
              ✅ Cảm ơn Quý phụ huynh! Phản hồi đã được chuyển đến giáo viên và trung tâm.
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập nội dung phản hồi, ý kiến đóng góp cho buổi học..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedback.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Gửi phản hồi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
