'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Gift,
  Calendar,
  CheckCircle2,
  PhoneCall,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Star,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

export default function SeasonalCampaignLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [resolvedParams] = React.useState<{ slug: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    childAge: '8',
    targetCourse: 'Tiếng Anh Thiếu Niên Cambridge (A2-B1)',
  });

  const campaign = {
    title: 'Chiến Dịch Hè Rực Rỡ 2026 - Tựu Trường Vững Bước (FR-109)',
    subtitle: 'Khởi động hè năng động cùng chương trình Anh ngữ thông minh tích hợp AI Tutor 1-1',
    discountCode: 'SUMMER26',
    discountPercent: 15,
    validUntil: '31/08/2026',
    highlights: [
      'Giảm trực tiếp 15% học phí trọn khóa khi ghi danh trong mùa hè',
      'Tặng gói ôn luyện cá nhân hóa AI Tutor miễn phí 3 tháng',
      'Đánh giá năng lực 4 kỹ năng chuẩn quốc tế CEFR hoàn toàn miễn phí',
      'Lớp học tiêu chuẩn sĩ số vàng tối đa 12 học viên/lớp',
    ],
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(campaign.discountCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm">
              CL
            </div>
            <span className="font-black text-slate-900 tracking-tight text-base">
              CoreLink <span className="text-amber-600">Academy</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">Hotline tư vấn:</span>
            <a
              href="tel:19008888"
              className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200"
            >
              1900 8888 (Miễn phí)
            </a>
          </div>
        </div>
      </header>

      {/* Hero Campaign Section */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-amber-100 border border-white/20">
            <Gift className="w-4 h-4 text-amber-200" />
            CHƯƠNG TRÌNH KHUYẾN MÃI THEO MÙA (FR-109)
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {campaign.title}
          </h1>

          <p className="text-sm md:text-base text-amber-100 max-w-2xl mx-auto leading-relaxed">
            {campaign.subtitle}
          </p>

          {/* Coupon Code Banner */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md mx-auto space-y-3 shadow-xl">
            <p className="text-xs text-amber-100 font-bold uppercase tracking-wider">Mã Ưu Đãi Độc Quyền</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black font-mono tracking-widest text-white bg-black/20 px-4 py-2 rounded-xl border border-white/30">
                {campaign.discountCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-amber-50 font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
            <p className="text-xs text-amber-200 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Có hiệu lực đến hết ngày {campaign.validUntil}
            </p>
          </div>
        </div>
      </section>

      {/* Campaign Details & Lead Form */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Highlights (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Đặc Quyền Khóa Học Hè 2026</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tích hợp nền tảng công nghệ giáo dục hiện đại bậc nhất giúp học sinh bứt phá
              </p>
            </div>

            <div className="space-y-3">
              {campaign.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{h}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                <ShieldCheck className="w-4 h-4" /> Cam kết chất lượng đầu ra
              </span>
              <p className="leading-relaxed">
                100% học viên tham gia khóa học được theo dõi tiến độ qua hệ thống Đánh giá Năng lực M07 và AI Cảnh báo sớm M12. Nếu không đạt chuẩn cam kết, trung tâm hỗ trợ học lại hoàn toàn miễn phí.
              </p>
            </div>
          </div>

          {/* Lead Registration Card (5 cols) */}
          <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Đăng Ký Nhận Ưu Đãi Ngay</h3>
              <p className="text-xs text-slate-500">Giữ chỗ học hè và áp dụng ngay mã giảm 15%</p>
            </div>

            {isSubmitted ? (
              <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Đăng Ký Thành Công!</h4>
                <p className="text-xs text-slate-600">
                  Cảm ơn Quý phụ huynh. Tư vấn viên của CoreLink Academy sẽ liên hệ trong vòng 15 phút để gửi lịch kiểm tra đầu vào và hướng dẫn áp dụng mã giảm giá.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ tên Phụ huynh:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Thị Mai"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Độ tuổi của con:</label>
                  <select
                    value={formData.childAge}
                    onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="6">6 - 8 tuổi (Starters / Movers)</option>
                    <option value="9">9 - 11 tuổi (Movers / Flyers)</option>
                    <option value="12">12 - 15 tuổi (THCS / KET / PET)</option>
                    <option value="16">16+ tuổi (IELTS Foundation & Intensive)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chương trình quan tâm:</label>
                  <input
                    type="text"
                    value={formData.targetCourse}
                    onChange={(e) => setFormData({ ...formData, targetCourse: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Gửi Đăng Ký Giữ Chỗ Ưu Đãi</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
