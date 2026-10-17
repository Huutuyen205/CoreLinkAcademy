'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
        // Mock fallback nếu test độc lập giao diện
        setLeads([
          {
            id: 'l1',
            parentName: 'Chị Đặng Thị Lan',
            phone: '0988776655',
            childName: 'Nguyễn Tiến Đạt',
            childGrade: 6,
            goal: 'Luyện thi Chuyên ngữ',
            source: 'facebook',
            status: 'new',
            isOverdue24h: true, // Cảnh báo quá 24h
            createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
          },
          {
            id: 'l2',
            parentName: 'Anh Phạm Hoàng Long',
            phone: '0912334455',
            childName: 'Phạm Minh Anh',
            childGrade: 8,
            goal: 'IELTS Foundation',
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
            goal: 'Giao tiếp Starters',
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
            goal: 'Ngữ pháp cơ bản',
            source: 'flyer',
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
    { id: 'new', title: 'Mới tiếp nhận', color: '#38BDF8' },
    { id: 'contacted', title: 'Đã liên hệ', color: '#F59E0B' },
    { id: 'trial_booked', title: 'Lên lịch học thử', color: '#A855F7' },
    { id: 'trial_done', title: 'Đã học thử xong', color: '#8B5CF6' },
    { id: 'enrolled', title: 'Đã nhập học', color: '#10B981' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 15, 29, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem'
          }}>CL</div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Quản Trị Tuyển Sinh (Kanban S35, S36)</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Theo dõi phễu khách tiềm năng & Chuyển đổi học viên</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/consultant/leads" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Kanban Leads</Link>
          <Link href="/consultant/funnel" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Báo cáo Phễu & CAC</Link>
          <Link href="/admin/users" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Quản lý User</Link>
        </nav>
      </header>

      {/* Kanban Board */}
      <main style={{ padding: '1.5rem 2rem', overflowX: 'auto' }}>
        {actionError && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            color: '#F87171',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {actionError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))', gap: '1.25rem', minWidth: '1440px' }}>
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 120px)',
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>{col.title}</span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#94A3B8'
                  }}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Card List */}
                <div style={{ padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{
                        backgroundColor: lead.isOverdue24h ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                        border: lead.isOverdue24h ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '0.625rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        boxShadow: lead.isOverdue24h ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                      }}
                    >
                      {/* Cảnh báo quá 24h chưa liên hệ (TC-018) */}
                      {lead.isOverdue24h && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.25rem',
                          marginBottom: '0.5rem'
                        }}>
                          ⚠️ QUÁ 24H CHƯA GỌI
                        </div>
                      )}

                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                        {lead.parentName}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600, marginBottom: '0.5rem' }}>
                        📞 {lead.phone}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                        Con: <strong>{lead.childName || 'Chưa rõ'}</strong> {lead.childGrade ? `(Lớp ${lead.childGrade})` : ''}
                      </div>

                      {lead.goal && (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                          Mục tiêu: {lead.goal}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.7rem',
                        color: '#64748B',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        <span>Nguồn: {lead.source}</span>
                        <span>{new Date(lead.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal Chi tiết khách tiềm năng (S36) */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#FFFFFF' }}>
                  {selectedLead.parentName}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 600 }}>📞 {selectedLead.phone}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setConvertResult(null);
                  setActionError(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Thông tin học sinh */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: '1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <div><span style={{ color: '#64748B' }}>Học sinh:</span> <strong>{selectedLead.childName || '—'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Khối lớp:</span> <strong>{selectedLead.childGrade ? `Lớp ${selectedLead.childGrade}` : '—'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Mục tiêu:</span> <strong>{selectedLead.goal || '—'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Nguồn kênh:</span> <strong>{selectedLead.source}</strong></div>
              {selectedLead.referredByName && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748B' }}>Người giới thiệu:</span> <strong style={{ color: '#F59E0B' }}>{selectedLead.referredByName}</strong>
                </div>
              )}
            </div>

            {/* Chuyển đổi trạng thái nhanh */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.5rem' }}>
                Đổi trạng thái tiếp cận:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {columns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleUpdateStatus(selectedLead.id, col.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedLead.status === col.id ? `1px solid ${col.color}` : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: selectedLead.status === col.id ? col.color : 'rgba(255,255,255,0.04)',
                      color: selectedLead.status === col.id ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    {col.title}
                  </button>
                ))}

                <button
                  onClick={() => setIsLostModalOpen(true)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#F87171'
                  }}
                >
                  Không nhập học (Lost)
                </button>
              </div>
            </div>

            {/* Nút Chuyển thành học viên (TC-020) */}
            {selectedLead.status !== 'enrolled' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setIsConvertOpen(!isConvertOpen)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🎓 Chuyển Thành Học Viên Chính Thức (1-Click Transaction)
                </button>
              </div>
            )}

            {/* Form chuyển đổi học viên */}
            {isConvertOpen && (
              <form onSubmit={handleConvertLead} style={{
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#10B981' }}>
                  Thông tin ghi danh khóa học:
                </h4>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.25rem' }}>Mã Lớp Học (Class ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập Class ID hoặc chọn từ danh sách"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFF',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.25rem' }}>Giảm giá (VND)</label>
                    <input
                      type="number"
                      value={discountVnd}
                      onChange={(e) => setDiscountVnd(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#FFF',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.25rem' }}>Lý do ưu đãi</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#FFF',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#10B981',
                    color: '#FFF',
                    fontWeight: 700,
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  Xác nhận Tạo Học Viên & Lập Học Phí
                </button>

                {convertResult && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem'
                  }}>
                    <div>✅ {convertResult.message}</div>
                    <div>Mã học sinh: <strong>{convertResult.studentCode}</strong></div>
                    <div>Mật khẩu tạm thời: <strong>{convertResult.tempPassword}</strong></div>
                  </div>
                )}
              </form>
            )}

            {/* Thêm lịch sử tương tác */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.75rem' }}>
                Ghi chú cuộc gọi & Chăm sóc khách (TC-017)
              </h4>
              <form onSubmit={handleAddActivity} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.85rem'
                  }}
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
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFF',
                    fontSize: '0.85rem'
                  }}
                />

                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 110,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '1rem',
            maxWidth: '460px',
            width: '100%',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#F87171' }}>
              Xác Nhận Không Nhập Học (TC-019)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Theo quy định FR-105, bắt buộc phải ghi nhận nguyên nhân khách hàng không nhập học để cải thiện dịch vụ.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
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
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    backgroundColor: selectedLostReason === reason ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: selectedLostReason === reason ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.06)',
                    color: selectedLostReason === reason ? '#FFFFFF' : '#CBD5E1'
                  }}
                >
                  {selectedLostReason === reason ? '◉ ' : '○ '} {reason}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsLostModalOpen(false)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!selectedLostReason}
                onClick={() => handleUpdateStatus(selectedLead.id, 'lost', selectedLostReason)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: selectedLostReason ? '#EF4444' : '#475569',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  cursor: selectedLostReason ? 'pointer' : 'not-allowed'
                }}
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
