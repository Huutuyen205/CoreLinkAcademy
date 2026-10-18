'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Lock,
} from 'lucide-react';

interface TeachingSession {
  id: string;
  sessionNo: number;
  date: string;
  time: string;
  className: string;
  classCode: string;
  type: 'regular' | 'substitute';
  substituteFor?: string;
  mode: 'offline' | 'online';
  isVerified: boolean;
  rateVnd: number;
}

export default function TeacherPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const sessions: TeachingSession[] = [
    {
      id: 'ses-101',
      sessionNo: 1,
      date: '03/11/2026',
      time: '18:00 - 19:30',
      className: 'Lớp Cambridge Movers 01',
      classCode: 'CLS-M01',
      type: 'regular',
      mode: 'offline',
      isVerified: true,
      rateVnd: 300000,
    },
    {
      id: 'ses-102',
      sessionNo: 2,
      date: '05/11/2026',
      time: '18:00 - 19:30',
      className: 'Lớp Cambridge Movers 01',
      classCode: 'CLS-M01',
      type: 'regular',
      mode: 'offline',
      isVerified: true,
      rateVnd: 300000,
    },
    {
      id: 'ses-103',
      sessionNo: 5,
      date: '07/11/2026',
      time: '09:00 - 10:30',
      className: 'Lớp Cambridge Flyers 02',
      classCode: 'CLS-F02',
      type: 'substitute', // Dạy thay cho Cô Sarah Jones
      substituteFor: 'Cô Sarah Jones (bận công tác)',
      mode: 'offline',
      isVerified: true,
      rateVnd: 300000,
    },
    {
      id: 'ses-104',
      sessionNo: 3,
      date: '10/11/2026',
      time: '18:00 - 19:30',
      className: 'Lớp Cambridge Movers 01',
      classCode: 'CLS-M01',
      type: 'regular',
      mode: 'offline',
      isVerified: true,
      rateVnd: 300000,
    },
    {
      id: 'ses-105',
      sessionNo: 4,
      date: '12/11/2026',
      time: '18:00 - 19:30',
      className: 'Lớp Cambridge Movers 01',
      classCode: 'CLS-M01',
      type: 'regular',
      mode: 'offline',
      isVerified: false, // Chưa xác thực
      rateVnd: 300000,
    },
  ];

  const verifiedSessions = sessions.filter((s) => s.isVerified);
  const unverifiedSessions = sessions.filter((s) => !s.isVerified);

  const baseRate = 300000;
  const verifiedCount = verifiedSessions.length;
  const totalVerifiedSalary = verifiedCount * baseRate;
  const adjustments = 200000; // Thưởng chuyên cần & phản hồi phụ huynh tốt
  const netSalary = totalVerifiedSalary + adjustments;

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedback('');
      setFeedbackSent(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header & chọn kỳ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                S34 • Cổng Giáo Viên
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <Clock className="h-3 w-3" /> Kỳ đang mở (Open)
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Bảng Lương & Lịch Giảng Dạy
            </h1>
            <p className="text-sm text-slate-600">
              Tra cứu buổi dạy thực tế, buổi dạy thay và chi tiết thu nhập hàng tháng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kỳ tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm outline-none"
            >
              <option value="2026-11">Tháng 11/2026 (Hiện tại)</option>
              <option value="2026-10">Tháng 10/2026 (Đã chốt)</option>
              <option value="2026-09">Tháng 09/2026 (Đã chốt)</option>
            </select>
          </div>
        </div>

        {/* Thẻ thống kê lương */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-semibold">Buổi dạy đã duyệt</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-700 md:text-3xl">
              {verifiedCount} buổi
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {unverifiedSessions.length} buổi đang chờ duyệt
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Đơn giá / buổi</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">
              {baseRate.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-slate-500">Hiệu lực từ 01/09/2026</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Thưởng / Phụ cấp</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 md:text-3xl">
              +{adjustments.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-slate-500">Thưởng chuyên cần tháng</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold">Thực lĩnh dự kiến</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700 md:text-3xl">
              {netSalary.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-emerald-600">Kỳ tính lương FR-1105</p>
          </div>
        </div>

        {/* Danh sách các buổi giảng dạy chi tiết */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chi Tiết Từng Buổi Giảng Dạy</h2>
              <p className="text-xs text-slate-500">
                Tính lương buổi dạy thay (substitute) cho người thực dạy theo TC-130
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực (tính lương)
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Chờ xác thực
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="p-3">Ngày & Giờ</th>
                  <th className="p-3">Lớp học</th>
                  <th className="p-3">Loại buổi</th>
                  <th className="p-3">Hình thức</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{ses.date}</div>
                      <div className="text-xs text-slate-500">{ses.time}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{ses.className}</div>
                      <div className="font-mono text-xs text-slate-400">{ses.classCode}</div>
                    </td>
                    <td className="p-3">
                      {ses.type === 'substitute' ? (
                        <div className="space-y-0.5">
                          <span className="inline-block rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                            Dạy thay (TC-130)
                          </span>
                          <div className="text-xs text-slate-500">{ses.substituteFor}</div>
                        </div>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          Buổi chính thức
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-medium uppercase text-slate-500">{ses.mode}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {ses.rateVnd.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-center">
                      {ses.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <Clock className="h-3 w-3" /> Chờ duyệt
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Khối phản hồi bảng lương */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Phản Hồi hoặc Khiếu Nại Bảng Lương</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Nếu có buổi dạy bị thiếu hoặc chênh lệch giờ, vui lòng gửi phản hồi trực tiếp cho bộ phận kế toán.
          </p>

          {feedbackSent ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
              Đã gửi phản hồi đến bộ phận kế toán thành công.
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="mt-3 flex gap-2">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập nội dung phản hồi (VD: Buổi ngày 12/11 em đã dạy đủ 90 phút nhờ kế toán duyệt giúp)..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Gửi phản hồi
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
