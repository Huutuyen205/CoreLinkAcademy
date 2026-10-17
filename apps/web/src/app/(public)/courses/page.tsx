'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  levelName?: string;
  description?: string;
  durationSessions?: number;
  feeAmountVnd?: number;
  targetAudience?: string;
  teachers?: Array<{
    id: string;
    fullName: string;
    degree?: string;
    certifications?: string;
    avatarUrl?: string;
  }>;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/public/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      } else {
        // Mock fallback nếu database chưa có data mẫu
        setCourses([
          {
            id: 'c1',
            name: 'Tiếng Anh Giao Tiếp & Nền Tảng Cambridge (Starters/Movers)',
            code: 'ENG-PRI-01',
            levelName: 'Tiểu học (6 - 10 tuổi)',
            description: 'Phát triển phản xạ phát âm chuẩn quốc tế qua ngữ cảnh tương tác và tình huống thực tế.',
            durationSessions: 36,
            feeAmountVnd: 4500000,
            targetAudience: 'Học sinh lớp 1 - 5',
            teachers: [{ id: 't1', fullName: 'ThS. Nguyễn Mai Linh', degree: 'ThS. TESOL (Australia)', certifications: 'IELTS 8.5' }],
          },
          {
            id: 'c2',
            name: 'Ngữ Pháp Chuyên Sâu & Luyện Thi Vào Lớp 10 Chuyên',
            code: 'ENG-SEC-02',
            levelName: 'THCS (11 - 15 tuổi)',
            description: 'Nắm vững 100% cấu trúc ngữ pháp học thuật, kỹ năng giải đề thi vào trường chuyên/chọn.',
            durationSessions: 48,
            feeAmountVnd: 5800000,
            targetAudience: 'Học sinh lớp 6 - 9',
            teachers: [{ id: 't2', fullName: 'Thầy Trần Quốc Tuấn', degree: 'Cử nhân ĐH Sư Phạm HN', certifications: 'IELTS 8.0, 10 năm KN' }],
          },
          {
            id: 'c3',
            name: 'Khóa Luyện Thi IELTS Academic Cam Kết Đầu Ra 6.5 - 7.5+',
            code: 'IELTS-ADV-03',
            levelName: 'THPT & Đại học (15+ tuổi)',
            description: 'Chiến thuật 4 kỹ năng Nghe-Nói-Đọc-Viết, chấm bài chi tiết kèm AI Speaking Coach sửa lỗi phát âm.',
            durationSessions: 60,
            feeAmountVnd: 8500000,
            targetAudience: 'Học sinh THPT & Sinh viên',
            teachers: [{ id: 't3', fullName: 'Cô Sarah Jenkins', degree: 'MA in Applied Linguistics', certifications: 'Ex-IELTS Examiner' }],
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesLevel =
      selectedLevel === 'all' ||
      (c.levelName && c.levelName.toLowerCase().includes(selectedLevel.toLowerCase()));
    const matchesKeyword =
      !searchKeyword ||
      c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.code.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesLevel && matchesKeyword;
  });

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
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.025em' }}>CoreLink Academy</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Hệ thống Quản lý Đào tạo & Tuyển sinh</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/courses" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Khóa học</Link>
          <Link href="/register-trial" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Đăng ký học thử</Link>
          <Link href="/info" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Công khai pháp lý</Link>
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

      {/* Hero Banner */}
      <section style={{
        padding: '3.5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.35rem 1rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: '#38BDF8',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          Chương trình Đào tạo Tiêu chuẩn Quốc tế (M01, S01, S02)
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', lineHeight: 1.2 }}>
          Lộ trình Học tập Toàn diện từ <span style={{ background: 'linear-gradient(135deg, #60A5FA, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tiểu học đến IELTS 7.5+</span>
        </h2>
        <p style={{ maxWidth: '700px', margin: '0 auto 2rem auto', color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.6 }}>
          100% giáo viên đạt chuẩn chuyên môn, phương pháp cá nhân hóa với trợ lý AI hỗ trợ tự học 24/7. Kiểm tra trình độ và học thử hoàn toàn miễn phí.
        </p>

        {/* Filter controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2.5rem'
        }}>
          <input
            type="text"
            placeholder="Tìm theo tên khóa học hoặc mã khóa..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              minWidth: '280px',
              fontSize: '0.9rem'
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả cấp độ' },
              { id: 'tiểu học', label: 'Tiểu học' },
              { id: 'thcs', label: 'THCS' },
              { id: 'ielts', label: 'Luyện thi IELTS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedLevel === tab.id ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: selectedLevel === tab.id ? '#2563EB' : 'rgba(255,255,255,0.04)',
                  color: selectedLevel === tab.id ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Course List */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 4rem 2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Đang tải danh mục khóa học...</div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Không tìm thấy khóa học phù hợp với bộ lọc.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1rem',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      {c.code}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#A855F7', fontWeight: 600 }}>
                      {c.levelName || 'Toàn diện'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {c.description || 'Chương trình giảng dạy tích hợp chuẩn đầu ra, nâng cao tư duy ngôn ngữ và kỹ năng ứng dụng.'}
                  </p>

                  {/* Course Details */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    borderRadius: '0.75rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Thời lượng:</span>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{c.durationSessions ? `${c.durationSessions} buổi học` : '36 buổi'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Đối tượng:</span>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{c.targetAudience || 'Theo kiểm tra đầu vào'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Học phí niêm yết:</span>
                      <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.95rem' }}>
                        {c.feeAmountVnd ? `${c.feeAmountVnd.toLocaleString('vi-VN')} đ` : 'Liên hệ tư vấn'}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Preview (S02) */}
                  {c.teachers && c.teachers.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: '0.75rem',
                      marginBottom: '1.5rem',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '9999px',
                        backgroundColor: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        {c.teachers[0].fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F1F5F9' }}>{c.teachers[0].fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.teachers[0].degree || c.teachers[0].certifications || 'Giảng viên chuyên ngữ'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    href={`/register-trial?course=${encodeURIComponent(c.name)}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: '0.625rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                    }}
                  >
                    Đăng ký học thử
                  </Link>
                  <Link
                    href={`/placement-test/sample?grade=6`}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#E2E8F0',
                      borderRadius: '0.625rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    Test trình độ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
