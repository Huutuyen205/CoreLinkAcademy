'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    // Bắt UTM parameters từ query string
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
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Đăng ký trải nghiệm & Xếp lớp</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/courses" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Khóa học</Link>
          <Link href="/register-trial" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Đăng ký học thử</Link>
          <Link href="/info" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Công khai pháp lý</Link>
        </nav>
      </header>

      <main style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        {successResult ? (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '1rem',
            padding: '2.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '9999px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem auto'
            }}>✓</div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
              Đăng ký thành công!
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.6, marginBottom: '2rem' }}>
              {successResult.message || 'Cảm ơn Quý phụ huynh. Đội ngũ tư vấn CoreLink sẽ liên hệ lại trong vòng 24 giờ làm việc để xếp lịch học thử phù hợp nhất.'}
            </p>

            {successResult.isDuplicateMerged && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.5rem',
                color: '#60A5FA',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}>
                ℹ️ Số điện thoại này đã có trong hệ thống, nhu cầu mới của bạn đã được cập nhật thành công vào hồ sơ tư vấn!
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link
                href={`/placement-test/sample?grade=${childGrade}`}
                style={{
                  padding: '0.85rem 1.75rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none'
                }}
              >
                Làm bài Test đánh giá năng lực ngay
              </Link>
              <Link
                href="/courses"
                style={{
                  padding: '0.85rem 1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#CBD5E1',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none'
                }}
              >
                Về danh mục khóa học
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
          }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Đăng ký Học thử Miễn phí
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>
                Trải nghiệm 01 buổi học thực tế với giáo viên chuyên môn & nhận báo cáo đánh giá năng lực cá nhân.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '0.75rem',
                color: '#F87171',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    Họ tên Phụ huynh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    Họ tên Học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Hoàng Nam"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    Lớp hiện tại
                  </label>
                  <select
                    value={childGrade}
                    onChange={(e) => setChildGrade(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  Mục tiêu học tập mong muốn
                </label>
                <input
                  type="text"
                  placeholder="VD: Lấy lại gốc tiếng Anh, luyện thi vào trường chuyên, chứng chỉ IELTS..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#CBD5E1' }}>
                  Khung giờ gia đình có thể tham gia học thử:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {slotOptions.map((slot) => {
                    const isChecked = selectedSlots.includes(slot);
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => handleToggleSlot(slot)}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '0.5rem',
                          textAlign: 'left',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                          border: isChecked ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
                          color: isChecked ? '#60A5FA' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>{isChecked ? '☑' : '☐'}</span>
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  Mã giới thiệu (nếu có người quen tại CoreLink)
                </label>
                <input
                  type="text"
                  placeholder="VD: REF-8A9F1B"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F59E0B',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Đang gửi thông tin...' : 'Gửi Đăng Ký Học Thử Miễn Phí'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
