'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  enrolledCount: number;
  totalRewardVnd: number;
  referredLeads: Array<{
    id: string;
    parent_name?: string;
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
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/campaigns/referral-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Mock fallback cho preview
        setStats({
          referralCode: 'REF-CL892F',
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        padding: '1.25rem 2rem',
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
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.25rem'
          }}>CL</div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Cổng Thông Tin Phụ Huynh</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Chương trình giới thiệu & Tích lũy học bổng (S25)</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/profile" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Hồ sơ & Con</Link>
          <Link href="/referrals" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Giới thiệu bạn bè</Link>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              padding: '0.4rem 0.85rem',
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#F87171',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Đăng xuất
          </button>
        </nav>
      </header>

      <main style={{ maxWidth: '880px', margin: '3rem auto', padding: '0 1.5rem' }}>
        {/* Banner giới thiệu */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(16, 185, 129, 0.15))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Lan Tỏa Tri Thức — Nhận Học Bổng Đồng Hành
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
            Mỗi khi phụ huynh người quen nhập học thành công qua mã giới thiệu của bạn, cả hai gia đình đều nhận được voucher học bổng <strong>500,000 VND</strong> khấu trừ trực tiếp vào kỳ học phí tiếp theo!
          </p>

          {/* Referral Code Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            backgroundColor: 'rgba(10, 15, 29, 0.8)',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            border: '1px dashed #3B82F6',
            width: 'fit-content'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>Mã giới thiệu của bạn:</span>
              <strong style={{ fontSize: '1.5rem', color: '#F59E0B', letterSpacing: '0.1em' }}>
                {stats?.referralCode || 'Đang tạo...'}
              </strong>
            </div>

            <button
              onClick={handleCopyLink}
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: copied ? '#10B981' : '#2563EB',
                color: '#FFFFFF',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Đã sao chép link!' : 'Sao chép link đăng ký'}
            </button>
          </div>
        </div>

        {/* 3 Thẻ thống kê (Metrics) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Tổng số lượt giới thiệu</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38BDF8' }}>
              {stats?.totalReferred || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Gia đình đã gửi đăng ký</div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Đã nhập học thành công</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>
              {stats?.enrolledCount || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Học viên chính thức</div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem' }}>Học bổng tích lũy</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#F59E0B' }}>
              {stats?.totalRewardVnd ? `${stats.totalRewardVnd.toLocaleString('vi-VN')} đ` : '0 đ'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Được trừ vào kỳ học phí tới</div>
          </div>
        </div>

        {/* Bảng lịch sử giới thiệu */}
        <section style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem',
          padding: '1.75rem'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>
            Lịch Sử Lượt Giới Thiệu
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Đang tải lịch sử...</div>
          ) : stats?.referredLeads && stats.referredLeads.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                    <th style={{ padding: '0.75rem' }}>Phụ huynh</th>
                    <th style={{ padding: '0.75rem' }}>Học sinh</th>
                    <th style={{ padding: '0.75rem' }}>Ngày đăng ký</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referredLeads.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>{item.parent_name || 'Phụ huynh'}</td>
                      <td style={{ padding: '0.75rem', color: '#CBD5E1' }}>{item.child_name || '—'}</td>
                      <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: item.status === 'enrolled' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                          color: item.status === 'enrolled' ? '#10B981' : '#60A5FA',
                          border: item.status === 'enrolled' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(59,130,246,0.3)'
                        }}>
                          {item.status === 'enrolled' ? 'Đã nhập học (+500k)' : 'Đang tư vấn'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
              Chưa có lượt giới thiệu nào. Hãy chia sẻ link với người quen để nhận học bổng nhé!
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
