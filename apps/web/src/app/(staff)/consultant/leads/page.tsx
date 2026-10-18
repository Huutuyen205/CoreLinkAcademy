'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Phone,
  UserPlus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';

interface Lead {
  id: string;
  parentName: string;
  phone: string;
  childName?: string;
  childAge?: number;
  childGrade?: number;
  goal?: string;
  freeSlots?: any;
  source: string;
  utmSource?: string;
  utmCampaign?: string;
  status: string;
  lostReason?: string;
  ownerId?: string;
  ownerName?: string;
  firstContactedAt?: string;
  isOverdue24h: boolean;
  campaignName?: string;
  referredByName?: string;
  convertedStudentId?: string;
  createdAt: string;
  recentActivities?: any[];
}

export default function ConsultantLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modal chuyển đổi thành học sinh (TC-020)
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const [discountVnd, setDiscountVnd] = useState(0);
  const [discountReason, setDiscountReason] = useState('Ưu đãi đăng ký sớm');
  const [convertResult, setConvertResult] = useState<any>(null);

  // Modal Không nhập học (TC-019)
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState('');

  // Form thêm hoạt động cuộc gọi / ghi chú (TC-017)
  const [activityType, setActivityType] = useState('call');
  const [activityContent, setActivityContent] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else {
        // Fallback demo data chuẩn
        setLeads([
          {
            id: 'l1',
            parentName: 'Chị Đặng Thị Lan',
            phone: '0988776655',
            childName: 'Nguyễn Tiến Đạt',
            childGrade: 6,
            goal: 'Luyện thi Chuyên ngữ Cấp 2',
            source: 'facebook',
            status: 'new',
            isOverdue24h: true,
            createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
          },
          {
            id: 'l2',
            parentName: 'Anh Phạm Hoàng Long',
            phone: '0912334455',
            childName: 'Phạm Minh Anh',
            childGrade: 8,
            goal: 'IELTS Foundation 5.5+',
            source: 'referral',
            referredByName: 'Bác Trần Minh',
            status: 'contacted',
            isOverdue24h: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'l3',
            parentName: 'Bác Bùi Văn Toàn',
            phone: '0903445566',
            childName: 'Bùi Gia Khiêm',
            childGrade: 3,
            goal: 'Cambridge Starters & Phản xạ',
            source: 'web_form',
            status: 'trial_booked',
            isOverdue24h: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'l4',
            parentName: 'Chị Mai Tuyết Dung',
            phone: '0977889900',
            childName: 'Trần Gia Hân',
            childGrade: 7,
            goal: 'Lấy lại căn bản ngữ pháp',
            source: 'school_event',
            status: 'enrolled',
            isOverdue24h: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string, lostReason?: string) => {
    setActionError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          lostReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Cập nhật trạng thái thất bại');
      }

      await fetchLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus, lostReason } : null));
      }
      setIsLostModalOpen(false);
      setSelectedLostReason('');
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityContent.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: activityType,
          content: activityContent,
        }),
      });

      if (res.ok) {
        setActivityContent('');
        await fetchLeads();
      }
    } catch (err) {
      console.error('Error adding activity:', err);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !classId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId,
          discountVnd: Number(discountVnd),
          discountReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Chuyển đổi thất bại');
      }

      setConvertResult(data);
      await fetchLeads();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const columns = [
    { id: 'new', title: 'Mới Tiếp Nhận', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'contacted', title: 'Đã Liên Hệ', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'trial_booked', title: 'Xếp Lịch Học Thử', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'trial_done', title: 'Đã Học Thử Xong', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'enrolled', title: 'Đã Nhập Học', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  Tuyển Sinh & CRM
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Pipeline Bán Hàng</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Kanban Quản Lý Khách Hàng Tiềm Năng
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/consultant/leads"
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Bảng Kanban
            </Link>
            <Link
              href="/consultant/funnel"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
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

      {/* Main Kanban Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {actionError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200/90 rounded-2xl flex flex-col min-w-[250px] max-h-[calc(100vh-160px)] shadow-2xs"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.badgeClass}`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Card List */}
                <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-sm ${
                        lead.isOverdue24h
                          ? 'border-red-300 ring-2 ring-red-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {lead.isOverdue24h && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          QUÁ 24H CHƯA GỌI
                        </div>
                      )}

                      <div className="font-bold text-sm text-slate-900 mb-0.5">
                        {lead.parentName}
                      </div>

                      <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1.5">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </div>

                      <div className="text-xs text-slate-600 mb-1">
                        Học sinh: <strong className="text-slate-800">{lead.childName || 'Chưa rõ'}</strong>{' '}
                        {lead.childGrade ? `(Lớp ${lead.childGrade})` : ''}
                      </div>

                      {lead.goal && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mb-2 bg-slate-50 p-1 rounded border border-slate-100">
                          {lead.goal}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                        <span className="uppercase font-semibold">{lead.source}</span>
                        <span>{new Date(lead.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      Chưa có lead ở bước này
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal Chi tiết lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedLead.parentName}</h3>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  {selectedLead.phone}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setConvertResult(null);
                  setActionError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin học sinh */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs mb-5 border border-slate-100">
              <div><span className="text-slate-500">Học sinh:</span> <strong className="text-slate-800">{selectedLead.childName || '—'}</strong></div>
              <div><span className="text-slate-500">Khối lớp:</span> <strong className="text-slate-800">{selectedLead.childGrade ? `Lớp ${selectedLead.childGrade}` : '—'}</strong></div>
              <div><span className="text-slate-500">Mục tiêu:</span> <strong className="text-slate-800">{selectedLead.goal || '—'}</strong></div>
              <div><span className="text-slate-500">Nguồn tiếp cận:</span> <strong className="text-slate-800">{selectedLead.source}</strong></div>
              {selectedLead.referredByName && (
                <div className="col-span-2">
                  <span className="text-slate-500">Người giới thiệu:</span> <strong className="text-amber-800">{selectedLead.referredByName}</strong>
                </div>
              )}
            </div>

            {/* Chuyển đổi trạng thái nhanh */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Cập nhật giai đoạn xử lý:
              </label>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleUpdateStatus(selectedLead.id, col.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedLead.status === col.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {col.title}
                  </button>
                ))}

                <button
                  onClick={() => setIsLostModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer"
                >
                  Không nhập học (Lost)
                </button>
              </div>
            </div>

            {/* Chuyển thành học viên */}
            {selectedLead.status !== 'enrolled' && (
              <div className="mb-5">
                <button
                  onClick={() => setIsConvertOpen(!isConvertOpen)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Chuyển Thành Học Viên Chính Thức (Tạo Hồ Sơ & Học Phí)
                </button>
              </div>
            )}

            {/* Form chuyển đổi học viên */}
            {isConvertOpen && (
              <form onSubmit={handleConvertLead} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl mb-5 space-y-3">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Ghi danh vào lớp học:
                </div>
                <div>
                  <label className="block text-xs text-slate-700 font-medium mb-1">Mã Lớp Học (Class ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CLASS-IELTS-A1"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-700 font-medium mb-1">Giảm giá (VND)</label>
                    <input
                      type="number"
                      value={discountVnd}
                      onChange={(e) => setDiscountVnd(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-700 font-medium mb-1">Lý do ưu đãi</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Xác Nhận Nhập Học & Lập Hóa Đơn
                </button>

                {convertResult && (
                  <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg text-xs text-emerald-900 space-y-1">
                    <div>✅ {convertResult.message}</div>
                    <div>Mã học sinh: <strong>{convertResult.studentCode}</strong></div>
                    <div>Mật khẩu tạm thời: <strong>{convertResult.tempPassword}</strong></div>
                  </div>
                )}
              </form>
            )}

            {/* Thêm lịch sử tương tác */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Ghi chú cuộc gọi & chăm sóc:
              </h4>
              <form onSubmit={handleAddActivity} className="flex gap-2">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="call">📞 Cuộc gọi</option>
                  <option value="meeting">🤝 Gặp trực tiếp</option>
                  <option value="note">📝 Ghi chú</option>
                </select>

                <input
                  type="text"
                  placeholder="Nội dung trao đổi với phụ huynh..."
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Lưu
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bắt buộc chọn lý do Không nhập học (TC-019) */}
      {isLostModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-xl max-w-md w-full p-6 text-slate-800">
            <h3 className="text-base font-bold text-red-700 mb-1">
              Xác Nhận Không Nhập Học (Lost Lead)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Vui lòng chọn lý do khách hàng không tiếp tục để bộ phận học vụ cải thiện chất lượng chương trình:
            </p>

            <div className="space-y-2 mb-6">
              {[
                'Học phí cao hơn ngân sách dự kiến',
                'Lịch học không phù hợp với gia đình',
                'Khoảng cách địa lý xa trung tâm',
                'Đã chọn trung tâm đào tạo khác',
                'Học sinh chưa có nhu cầu học ngay',
                'Lý do khác',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedLostReason(reason)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                    selectedLostReason === reason
                      ? 'bg-red-50 border-red-500 text-red-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {selectedLostReason === reason ? '◉ ' : '○ '} {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsLostModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!selectedLostReason}
                onClick={() => handleUpdateStatus(selectedLead.id, 'lost', selectedLostReason)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Lưu Trạng Thái Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
