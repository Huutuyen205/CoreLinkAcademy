'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, BookOpen, Clock, Calendar, Sparkles } from 'lucide-react';

export default function RegisterTrialPage() {
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState<number>(6);
  const [goal, setGoal] = useState('Tiếng Anh toàn diện & Luyện thi');
  const [referralCode, setReferralCode] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [utmSource, setUtmSource] = useState('web_direct');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Capture UTM parameters from query string
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('utm_source')) setUtmSource(params.get('utm_source')!);
      if (params.get('utm_campaign')) setUtmCampaign(params.get('utm_campaign')!);
      if (params.get('ref')) setReferralCode(params.get('ref')!);
      if (params.get('course')) setGoal(`Khóa học quan tâm: ${params.get('course')}`);
    }
  }, []);

  const slotOptions = [
    'Thứ 2 - 4 - 6 (18:00 - 19:30)',
    'Thứ 2 - 4 - 6 (19:30 - 21:00)',
    'Thứ 3 - 5 - 7 (18:00 - 19:30)',
    'Thứ 3 - 5 - 7 (19:30 - 21:00)',
    'Thứ 7 - Chủ Nhật (08:30 - 10:00)',
    'Thứ 7 - Chủ Nhật (14:30 - 16:00)',
  ];

  const handleToggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName,
          phone,
          childName,
          childGrade: Number(childGrade),
          goal,
          freeSlots: selectedSlots,
          referralCode: referralCode.trim() || undefined,
          utmSource,
          utmCampaign: utmCampaign || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      }

      setSuccessResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              CL
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">CoreLink Academy</span>
              <p className="text-xs text-slate-500 font-medium">Học Viện Anh Ngữ & Luyện Thi Chuẩn Quốc Tế</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/courses" className="text-slate-600 hover:text-blue-600 transition-colors">Khóa học</Link>
            <Link href="/register-trial" className="text-blue-600 font-semibold">Đăng ký học thử</Link>
            <Link href="/info" className="text-slate-600 hover:text-blue-600 transition-colors">Công khai pháp lý</Link>
            <Link href="/login" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        {successResult ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Đăng Ký Học Thử Thành Công!
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-lg mx-auto mb-6">
              {successResult.message || 'Cảm ơn Quý phụ huynh. Đội ngũ cố vấn học vụ CoreLink sẽ liên hệ xác nhận trong vòng 24 giờ làm việc để xếp lịch học thử tối ưu nhất cho học viên.'}
            </p>

            {successResult.isDuplicateMerged && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
                ℹ️ Số điện thoại này đã có trong hệ thống, nguyện vọng mới của quý phụ huynh đã được cập nhật thành công vào hồ sơ tư vấn!
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/placement-test/sample?grade=${childGrade}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Làm bài đánh giá năng lực ngay (15 phút)
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
              >
                Khám phá lộ trình đào tạo
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Miễn Phí 100% • Cam Kết Không Chèo Kéo
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Đăng Ký Học Thử & Đánh Giá Năng Lực
              </h1>
              <p className="text-slate-600 text-sm max-w-lg mx-auto">
                Trải nghiệm 01 buổi học trực tiếp cùng giảng viên chuyên môn & nhận báo cáo phân tích năng lực chi tiết theo khung chuẩn Châu Âu CEFR.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Họ tên Phụ huynh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Họ tên Học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Hoàng Nam"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Lớp hiện tại
                  </label>
                  <select
                    value={childGrade}
                    onChange={(e) => setChildGrade(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mục tiêu học tập ưu tiên
                </label>
                <input
                  type="text"
                  placeholder="VD: Luyện thi Chuyên Cấp 3, lấy chứng chỉ IELTS 6.5+, bồi dưỡng nền tảng..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Khung giờ gia đình có thể tham gia học thử (chọn nhiều)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {slotOptions.map((slot) => {
                    const isChecked = selectedSlots.includes(slot);
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => handleToggleSlot(slot)}
                        className={`px-3.5 py-2.5 rounded-xl text-left text-xs font-medium border flex items-center gap-2.5 transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked ? '✓' : ''}
                        </span>
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mã giới thiệu (nếu có người quen học tại CoreLink)
                </label>
                <input
                  type="text"
                  placeholder="VD: REF-8A9F1B"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-amber-800 font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    'Đang xử lý thông tin đăng ký...'
                  ) : (
                    <>
                      Gửi Đăng Ký Học Thử Miễn Phí
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 mt-3">
                  Thông tin của Quý phụ huynh được bảo mật tuyệt đối theo Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
