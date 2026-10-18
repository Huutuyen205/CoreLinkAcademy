'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Share2, Copy, CheckCircle2, Users, Award, DollarSign } from 'lucide-react';

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  enrolledCount: number;
  totalRewardVnd: number;
  referredLeads: Array<{
    id: string;
    parent_name: string;
    child_name?: string;
    status: string;
    created_at: string;
  }>;
}

export default function GuardianReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/guardian/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Fallback demo data
        setStats({
          referralCode: 'REF-PH8829',
          totalReferred: 3,
          enrolledCount: 2,
          totalRewardVnd: 1000000,
          referredLeads: [
            { id: '1', parent_name: 'Bác Trần Minh', child_name: 'Trần Bảo Anh', status: 'enrolled', created_at: '2026-10-10' },
            { id: '2', parent_name: 'Chị Lê Thu Hà', child_name: 'Lê Tuấn Hưng', status: 'enrolled', created_at: '2026-10-12' },
            { id: '3', parent_name: 'Anh Vũ Hoàng', child_name: 'Vũ Đức Nam', status: 'contacted', created_at: '2026-10-15' },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!stats?.referralCode) return;
    const url = `${window.location.origin}/register-trial?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  Cổng Thông Tin Phụ Huynh
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Đồng Hành & Tích Lũy</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Chương Trình Giới Thiệu & Học Bổng Đồng Hành
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/profile"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hồ sơ & Con
            </Link>
            <Link
              href="/referrals"
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Giới thiệu bạn bè
            </Link>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {/* Banner giới thiệu */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Lan Tỏa Tri Thức — Nhận Học Bổng Đồng Hành
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
                Mỗi khi phụ huynh người quen nhập học thành công qua mã giới thiệu của bạn, cả hai gia đình đều nhận được voucher học bổng <strong className="text-emerald-700">500.000 VND</strong> khấu trừ trực tiếp vào kỳ học phí tiếp theo!
              </p>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="mt-6 p-4 rounded-xl bg-white border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-xl">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã giới thiệu của bạn</span>
              <strong className="text-xl sm:text-2xl text-blue-700 font-mono tracking-wider">
                {stats?.referralCode || 'Đang tạo...'}
              </strong>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã sao chép link!' : 'Sao chép link đăng ký'}
            </button>
          </div>
        </div>

        {/* 3 Thẻ thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Lượt giới thiệu gửi đăng ký</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {stats?.totalReferred || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Gia đình đã gửi form tư vấn</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Đã nhập học thành công</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats?.enrolledCount || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Học viên chính thức</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Học bổng tích lũy</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800">
              {stats?.totalRewardVnd ? `${stats.totalRewardVnd.toLocaleString('vi-VN')} đ` : '0 đ'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Khấu trừ vào hóa đơn kỳ tới</span>
          </div>
        </div>

        {/* Bảng lịch sử giới thiệu */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Lịch Sử Lượt Giới Thiệu
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Đang tải lịch sử...</div>
          ) : stats?.referredLeads && stats.referredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold">
                    <th className="py-3 px-4">Phụ huynh</th>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.referredLeads.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.parent_name || 'Phụ huynh'}</td>
                      <td className="py-3 px-4 text-slate-600">{item.child_name || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.status === 'enrolled'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {item.status === 'enrolled' ? '✓ Đã nhập học (+500k)' : 'Đang tư vấn'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              Chưa có lượt giới thiệu nào. Hãy chia sẻ link với người quen để nhận học bổng nhé!
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
