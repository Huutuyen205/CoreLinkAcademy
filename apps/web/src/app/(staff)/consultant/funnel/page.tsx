'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Target,
  Plus,
  DollarSign,
  Users,
  Award,
  Filter,
} from 'lucide-react';

interface FunnelData {
  branch_id?: string;
  lead_month?: string;
  source?: string;
  leads_total: number;
  contacted: number;
  trial_booked: number;
  trial_done: number;
  enrolled: number;
}

interface Campaign {
  id: string;
  name: string;
  utmCampaign: string;
  channel?: string;
  costVnd: number;
  discountCode?: string;
  discountPercent?: number;
  totalLeads: number;
  enrolledCount: number;
  conversionRate: number;
  cacVnd: number;
}

export default function ConsultantFunnelPage() {
  const [funnelList, setFunnelList] = useState<FunnelData[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo chiến dịch mới
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campChannel, setCampChannel] = useState('facebook');
  const [campCost, setCampCost] = useState(5000000);
  const [campUtm, setCampUtm] = useState('');
  const [campDiscountCode, setCampDiscountCode] = useState('');
  const [campDiscountPercent, setCampDiscountPercent] = useState(10);
  const [campError, setCampError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [resFunnel, resCamps] = await Promise.all([
        fetch('/api/v1/leads/funnel', { headers }),
        fetch('/api/v1/campaigns', { headers }),
      ]);

      if (resFunnel.ok) {
        const data = await resFunnel.json();
        setFunnelList(data);
      } else {
        // Fallback demo data
        setFunnelList([
          { leads_total: 120, contacted: 102, trial_booked: 68, trial_done: 52, enrolled: 30, source: 'Tổng hợp' },
        ]);
      }

      if (resCamps.ok) {
        const data = await resCamps.json();
        setCampaigns(data);
      } else {
        // Fallback demo campaigns
        setCampaigns([
          {
            id: 'c1',
            name: 'Chiến dịch Tuyển sinh Mùa Thu 2026',
            utmCampaign: 'fb_autumn_2026',
            channel: 'facebook',
            costVnd: 15000000,
            discountCode: 'AUTUMN10',
            discountPercent: 10,
            totalLeads: 65,
            enrolledCount: 18,
            conversionRate: 27.7,
            cacVnd: 833333,
          },
          {
            id: 'c2',
            name: 'Hội thảo Trải nghiệm Tiếng Anh Tiểu Học',
            utmCampaign: 'workshop_primary',
            channel: 'event',
            costVnd: 8000000,
            discountCode: 'WORK500',
            discountPercent: 15,
            totalLeads: 40,
            enrolledCount: 12,
            conversionRate: 30.0,
            cacVnd: 666667,
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campName,
          channel: campChannel,
          costVnd: Number(campCost),
          utmCampaign: campUtm || `camp_${Date.now()}`,
          discountCode: campDiscountCode || undefined,
          discountPercent: Number(campDiscountPercent),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Tạo chiến dịch thất bại');
      }

      setIsNewCampaignOpen(false);
      setCampName('');
      setCampUtm('');
      setCampDiscountCode('');
      await fetchData();
    } catch (err: any) {
      setCampError(err.message);
    }
  };

  const aggregated = funnelList.reduce(
    (acc, cur) => ({
      leads_total: acc.leads_total + Number(cur.leads_total || 0),
      contacted: acc.contacted + Number(cur.contacted || 0),
      trial_booked: acc.trial_booked + Number(cur.trial_booked || 0),
      trial_done: acc.trial_done + Number(cur.trial_done || 0),
      enrolled: acc.enrolled + Number(cur.enrolled || 0),
    }),
    { leads_total: 0, contacted: 0, trial_booked: 0, trial_done: 0, enrolled: 0 }
  );

  const total = aggregated.leads_total || 1;
  const funnelSteps = [
    { label: 'Tổng Lead tiếp nhận', count: aggregated.leads_total, percent: 100, barClass: 'bg-blue-600' },
    { label: 'Đã liên hệ tư vấn', count: aggregated.contacted, percent: Math.round((aggregated.contacted / total) * 100), barClass: 'bg-amber-500' },
    { label: 'Xếp lịch học thử', count: aggregated.trial_booked, percent: Math.round((aggregated.trial_booked / total) * 100), barClass: 'bg-purple-600' },
    { label: 'Đã tham gia học thử', count: aggregated.trial_done, percent: Math.round((aggregated.trial_done / total) * 100), barClass: 'bg-indigo-600' },
    { label: 'Nhập học chính thức', count: aggregated.enrolled, percent: Math.round((aggregated.enrolled / total) * 100), barClass: 'bg-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  Hiệu Suất Tuyển Sinh
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Báo Cáo Phễu & CAC</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Chỉ Số Chuyển Đổi & Hiệu Quả Chiến Dịch
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/consultant/leads"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Bảng Kanban
            </Link>
            <Link
              href="/consultant/funnel"
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Báo cáo Phễu & CAC
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Về Tổng Quan
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Phần 1: Biểu đồ phễu chuyển đổi */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Phễu Chuyển Đổi Tuyển Sinh Toàn Diện</h2>
              <p className="text-xs text-slate-500">Dữ liệu tổng hợp từ nguồn tiếp cận đến ghi danh chính thức</p>
            </div>
          </div>

          <div className="space-y-4">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-700">{step.label}</span>
                  <span className="text-slate-500">
                    <strong className="text-slate-900 font-bold">{step.count}</strong> lead ({step.percent}%)
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.barClass}`}
                    style={{ width: `${Math.max(step.percent, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phần 2: Quản lý Chiến dịch & CAC */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Chiến Dịch Marketing & Chi Phí Tiếp Nhận (CAC)</h2>
                <p className="text-xs text-slate-500">CAC = Chi phí chiến dịch / Số học viên nhập học thực tế</p>
              </div>
            </div>

            <button
              onClick={() => setIsNewCampaignOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Tạo Chiến Dịch Mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold">
                  <th className="py-3 px-4">Tên chiến dịch</th>
                  <th className="py-3 px-4">Mã UTM</th>
                  <th className="py-3 px-4">Kênh</th>
                  <th className="py-3 px-4 text-right">Chi phí</th>
                  <th className="py-3 px-4 text-center">Leads</th>
                  <th className="py-3 px-4 text-center">Nhập học</th>
                  <th className="py-3 px-4 text-right">Tỷ lệ C/R</th>
                  <th className="py-3 px-4 text-right">CAC thực tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{camp.name}</td>
                    <td className="py-3 px-4 text-blue-600 font-mono text-xs">{camp.utmCampaign}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{camp.channel}</td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {camp.costVnd.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{camp.totalLeads}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{camp.enrolledCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-800">{camp.conversionRate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {camp.cacVnd.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal Tạo Chiến Dịch */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Khởi Tạo Chiến Dịch Marketing
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cấu hình UTM tracking và ngân sách phân bổ cho kênh
            </p>

            {campError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {campError}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chiến dịch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tuyển sinh IELTS Mùa Hè 2026"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kênh truyền thông</label>
                  <select
                    value={campChannel}
                    onChange={(e) => setCampChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="facebook">Facebook Ads</option>
                    <option value="zalo">Zalo OA</option>
                    <option value="google">Google Search</option>
                    <option value="flyer">Tờ rơi / Banner</option>
                    <option value="event">Sự kiện / Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngân sách (VND)</label>
                  <input
                    type="number"
                    value={campCost}
                    onChange={(e) => setCampCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã UTM Campaign</label>
                <input
                  type="text"
                  placeholder="VD: fb_summer_2026"
                  value={campUtm}
                  onChange={(e) => setCampUtm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã ưu đãi</label>
                  <input
                    type="text"
                    placeholder="VD: SUMMER15"
                    value={campDiscountCode}
                    onChange={(e) => setCampDiscountCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">% Giảm học phí</label>
                  <input
                    type="number"
                    value={campDiscountPercent}
                    onChange={(e) => setCampDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Tạo Chiến Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
