'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  AlertCircle,
  Award,
} from 'lucide-react';

export default function ParentSurveysPage() {
  const [selectedSurvey, setSelectedSurvey] = useState('sv-1');
  const [teacher, setTeacher] = useState('Thầy David Smith (Lớp Movers 01)');
  const [stars, setStars] = useState({
    teachingQuality: 5,
    enthusiasm: 5,
    feedback: 4,
  });
  const [hoverStars, setHoverStars] = useState({
    teachingQuality: 0,
    enthusiasm: 0,
    feedback: 0,
  });
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const surveys = [
    {
      id: 'sv-1',
      title: 'Khảo sát chất lượng giảng dạy Kỳ Thu 2026',
      period: '2026-Q3',
      closesAt: '31/12/2026',
      status: 'open',
    },
    {
      id: 'sv-2',
      title: 'Đánh giá môi trường học tập & cơ sở vật chất',
      period: '2026-Q2',
      closesAt: '30/09/2026',
      status: 'closed',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadySubmitted) return;
    setSubmitted(true);
    setAlreadySubmitted(true);
  };

  const renderStarPicker = (
    key: 'teachingQuality' | 'enthusiasm' | 'feedback',
    label: string,
    desc: string,
  ) => {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-500">{desc}</div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => {
            const current = hoverStars[key] || stars[key];
            return (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverStars((prev) => ({ ...prev, [key]: s }))}
                onMouseLeave={() => setHoverStars((prev) => ({ ...prev, [key]: 0 }))}
                onClick={() => setStars((prev) => ({ ...prev, [key]: s }))}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    s <= current
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-300'
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-2 w-8 text-right font-mono text-sm font-bold text-slate-700">
            {stars[key]}/5
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
              S24 • Khảo sát ý kiến
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              <Lock className="h-3 w-3" /> Ẩn danh SHA-256
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Khảo Sát & Đánh Giá Giáo Viên
          </h1>
          <p className="text-sm text-slate-600">
            Ý kiến của quý phụ huynh giúp CoreLink Academy nâng cao chất lượng đào tạo
          </p>
        </div>

        {/* Thông báo bảo vệ quyền riêng tư */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong className="font-semibold">Cam kết ẩn danh tuyệt đối (TC-138, TC-139):</strong>{' '}
              Hệ thống tạo mã băm ngẫu nhiên SHA-256 một chiều để ghi nhận bạn đã tham gia khảo sát (mỗi người 1 lần/kỳ). Giáo viên chỉ nhận được điểm sao trung bình và góp ý tổng hợp, hoàn toàn không xem được tên, số điện thoại hay thông tin con của bạn.
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 animate-bounce" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Cảm ơn quý phụ huynh đã gửi đánh giá!
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Phản hồi đã được ghi nhận ẩn danh thành công. Mỗi phụ huynh chỉ gửi 1 lần mỗi kỳ khảo sát.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/parent"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Về Trang Chủ Phụ Huynh
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {/* Chọn đợt khảo sát & Giáo viên */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Kỳ khảo sát:</label>
                <select
                  value={selectedSurvey}
                  onChange={(e) => setSelectedSurvey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 outline-none"
                >
                  {surveys.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.status === 'closed'}>
                      {s.title} ({s.status === 'closed' ? 'Đã đóng' : `Hạn ${s.closesAt}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Giáo viên phụ trách:</label>
                <select
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 outline-none"
                >
                  <option value="Thầy David Smith (Lớp Movers 01)">Thầy David Smith (Lớp Movers 01)</option>
                  <option value="Cô Sarah Jones (Lớp Flyers 02)">Cô Sarah Jones (Lớp Flyers 02)</option>
                </select>
              </div>
            </div>

            {/* Bộ tiêu chí đánh giá sao */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tiêu Chí Đánh Giá (1 - 5 Sao)
              </label>

              {renderStarPicker(
                'teachingQuality',
                '1. Phương pháp & Chất lượng giảng dạy',
                'Bài giảng sinh động, dễ hiểu, con hào hứng tham gia phát biểu',
              )}

              {renderStarPicker(
                'enthusiasm',
                '2. Sự tận tình & Quan tâm học sinh',
                'Kiên nhẫn hướng dẫn, sửa lỗi phát âm, khích lệ sự tự tin của học sinh',
              )}

              {renderStarPicker(
                'feedback',
                '3. Nhận xét định kỳ & Giao tiếp phụ huynh',
                'Cung cấp thông tin tiến độ rõ ràng, phản hồi kịp thời các thắc mắc',
              )}
            </div>

            {/* Ý kiến đóng góp */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Góp ý chi tiết hoặc mong muốn cải thiện:
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ví dụ: Thầy dạy rất dễ hiểu, mong thầy có thêm các trò chơi từ vựng tương tác cuối giờ để con nhớ từ lâu hơn..."
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                Lưu ý: Bạn chỉ có thể gửi 1 phản hồi cho giáo viên này trong kỳ.
              </span>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
              >
                Gửi Đánh Giá Ẩn Danh
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
