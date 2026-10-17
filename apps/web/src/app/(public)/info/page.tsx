'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface LegalInfo {
  organizationName: string;
  licenseNumber: string;
  licensedBy: string;
  licensedDate: string;
  headquarters: string;
  branches: Array<{
    code: string;
    name: string;
    address: string;
  }>;
  tuitionPolicy: {
    standardRefundRule: string;
    reservationRule: string;
    feeList: Array<{
      program: string;
      level: string;
      feeMonthlyVnd: number;
      sessionsPerWeek: number;
    }>;
  };
  teachingStandards: {
    qualificationRate: string;
    internationalCertRate: string;
    curriculumStandards: string;
  };
}

export default function PublicLegalInfoPage() {
  const [legalData, setLegalData] = useState<LegalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLegalInfo();
  }, []);

  const fetchLegalInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/public/info');
      if (res.ok) {
        const data = await res.json();
        setLegalData(data);
      } else {
        // Fallback compliance data theo TT 29/2024/TT-BGDĐT
        setLegalData({
          organizationName: 'Hệ thống Trung tâm Đào tạo Ngoại ngữ & Tin học CoreLink Academy',
          licenseNumber: 'QĐ-1284/QĐ-SGDĐT-HàNội',
          licensedBy: 'Sở Giáo dục và Đào tạo TP. Hà Nội',
          licensedDate: '15/01/2024',
          headquarters: 'Tòa nhà văn phòng CoreLink, Cầu Giấy, Hà Nội',
          branches: [
            { code: 'HN-CG', name: 'Cơ sở 1 — Cầu Giấy', address: 'Số 18 Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội' },
            { code: 'HN-TX', name: 'Cơ sở 2 — Thanh Xuân', address: 'Số 45 Đường Nguyễn Trãi, P. Thượng Đình, Q. Thanh Xuân, Hà Nội' },
          ],
          tuitionPolicy: {
            standardRefundRule: 'Hoàn 100% học phí trước ngày khai giảng; hoàn 70% trong vòng 2 tuần đầu nếu học viên không thể tiếp tục theo học vì lý do chính đáng.',
            reservationRule: 'Cho phép bảo lưu học phí tối đa 06 tháng đối với học sinh có đơn xin nghỉ ốm hoặc chuyển nơi cư trú.',
            feeList: [
              { program: 'Tiếng Anh Tiểu học (Cambridge Young Learners)', level: 'Lớp 1 - 5', feeMonthlyVnd: 1500000, sessionsPerWeek: 2 },
              { program: 'Tiếng Anh THCS & Chuyên sâu', level: 'Lớp 6 - 9', feeMonthlyVnd: 1800000, sessionsPerWeek: 2 },
              { program: 'Luyện thi Chuyên cấp 3 & IELTS Foundation', level: 'Lớp 8 - 10', feeMonthlyVnd: 2200000, sessionsPerWeek: 2 },
              { program: 'Luyện thi IELTS Chuyên sâu Cam kết 6.5 - 7.5+', level: 'THPT & SV', feeMonthlyVnd: 2800000, sessionsPerWeek: 3 },
            ],
          },
          teachingStandards: {
            qualificationRate: '100% giáo viên tốt nghiệp Đại học chuyên ngành Sư phạm Ngoại ngữ hoặc Ngôn ngữ Anh',
            internationalCertRate: '92% sở hữu chứng chỉ giảng dạy quốc tế CELTA/TESOL và IELTS 8.0+',
            curriculumStandards: 'Giáo trình xây dựng theo Khung tham chiếu chuẩn Châu Âu CEFR và chuẩn đầu ra Bộ GD&ĐT',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching legal info:', err);
    } finally {
      setLoading(false);
    }
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
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.25rem'
          }}>CL</div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>CoreLink Academy</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Công khai Thông tin Hoạt động Giáo dục</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/courses" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Khóa học</Link>
          <Link href="/register-trial" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Đăng ký học thử</Link>
          <Link href="/info" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Công khai pháp lý</Link>
          <Link href="/login" style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60A5FA',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>Đăng nhập</Link>
        </nav>
      </header>

      <main style={{ maxWidth: '960px', margin: '3rem auto', padding: '0 2rem 5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem'
          }}>
            Tuân thủ Thông tư 29/2024/TT-BGDĐT
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Công Khai Pháp Lý & Quy Chế Hoạt Động
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '650px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
            Bảo đảm quyền lợi học viên, tính minh bạch về học phí, cam kết chất lượng đội ngũ giảng dạy và quy chuẩn an toàn giáo dục.
          </p>
        </div>

        {legalData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Thông tin pháp lý & Cơ sở */}
            <section style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏢 1. Pháp Lý & Hệ Thống Cơ Sở Đào Tạo
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <div><span style={{ color: '#64748B' }}>Tổ chức chủ quản:</span> <strong style={{ color: '#FFFFFF' }}>{legalData.organizationName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Giấy phép hoạt động:</span> <strong style={{ color: '#10B981' }}>{legalData.licenseNumber}</strong></div>
                <div><span style={{ color: '#64748B' }}>Cơ quan cấp phép:</span> <strong style={{ color: '#FFFFFF' }}>{legalData.licensedBy}</strong></div>
                <div><span style={{ color: '#64748B' }}>Ngày cấp phép:</span> <strong style={{ color: '#FFFFFF' }}>{legalData.licensedDate}</strong></div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '0.75rem' }}>Địa điểm đào tạo được cấp phép:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {legalData.branches.map((b) => (
                    <div key={b.code} style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.875rem'
                    }}>
                      <strong style={{ color: '#38BDF8' }}>{b.name}:</strong> <span style={{ color: '#CBD5E1' }}>{b.address}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Biểu phí niêm yết & Chính sách hoàn học phí */}
            <section style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💰 2. Niêm Yết Học Phí & Quy Chế Hoàn / Bảo Lưu (Điều 8 TT 29/2024)
              </h3>

              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94A3B8' }}>
                      <th style={{ padding: '0.75rem' }}>Chương trình đào tạo</th>
                      <th style={{ padding: '0.75rem' }}>Đối tượng</th>
                      <th style={{ padding: '0.75rem' }}>Số buổi / tuần</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Học phí niêm yết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {legalData.tuitionPolicy.feeList.map((fee, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#F1F5F9' }}>{fee.program}</td>
                        <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{fee.level}</td>
                        <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{fee.sessionsPerWeek} buổi</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                          {fee.feeMonthlyVnd.toLocaleString('vi-VN')} đ/tháng
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.875rem', marginBottom: '0.35rem' }}>Chính sách hoàn phí:</div>
                  <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5 }}>{legalData.tuitionPolicy.standardRefundRule}</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.875rem', marginBottom: '0.35rem' }}>Chính sách bảo lưu:</div>
                  <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5 }}>{legalData.tuitionPolicy.reservationRule}</div>
                </div>
              </div>
            </section>

            {/* 3. Tiêu chuẩn đội ngũ giảng viên */}
            <section style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#C084FC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎓 3. Tiêu Chuẩn Đội Ngũ Giảng Dạy & Chương Trình
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>{legalData.teachingStandards.qualificationRate}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>{legalData.teachingStandards.internationalCertRate}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>{legalData.teachingStandards.curriculumStandards}</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
