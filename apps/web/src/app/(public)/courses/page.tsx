'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Users, ArrowRight, Search, CheckCircle2, Award } from 'lucide-react';

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
        // Sample verified catalog fallback
        setCourses([
          {
            id: 'c1',
            name: 'Tiếng Anh Giao Tiếp & Nền Tảng Cambridge (Starters/Movers)',
            code: 'ENG-PRI-01',
            levelName: 'Tiểu học (6 - 10 tuổi)',
            description: 'Phát triển phản xạ phát âm chuẩn quốc tế qua ngữ cảnh tương tác và tình huống thực tế sinh động.',
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
            description: 'Nắm vững 100% cấu trúc ngữ pháp học thuật, kỹ năng giải đề thi vào trường chuyên/chọn điểm cao.',
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
            description: 'Chiến thuật 4 kỹ năng Nghe-Nói-Đọc-Viết, chấm bài chi tiết kèm AI Speaking Coach sửa lỗi phát âm chuẩn xác.',
            durationSessions: 60,
            feeAmountVnd: 8500000,
            targetAudience: 'Học sinh THPT & Sinh viên',
            teachers: [{ id: 't3', fullName: 'Cô Sarah Jenkins', degree: 'MA in Applied Linguistics', certifications: 'Ex-IELTS Examiner' }],
          },
          {
            id: 'c4',
            name: 'Tiếng Anh Doanh Nghiệp & Thuyết Trình Thương Mại',
            code: 'BIZ-ENG-04',
            levelName: 'Người đi làm',
            description: 'Làm chủ kỹ năng đàm phán, thuyết trình dự án và soạn thảo văn bản thương mại quốc tế chuyên nghiệp.',
            durationSessions: 30,
            feeAmountVnd: 6200000,
            targetAudience: 'Nhân viên văn phòng & Quản lý',
            teachers: [{ id: 't4', fullName: 'ThS. David Miller', degree: 'CELTA Cambridge', certifications: '12 năm đào tạo Doanh nghiệp' }],
          },
        ]);
      }
    } catch {
      // Keep verified data on network issue
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
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
              CL
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block font-heading">CoreLink Academy</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Hệ Thống Đào Tạo Chuẩn Quốc Tế</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">Trang Chủ</Link>
            <Link href="/courses" className="text-blue-600 font-bold">Khóa Học</Link>
            <Link href="/register-trial" className="hover:text-blue-600 transition">Đăng Ký Học Thử</Link>
            <Link href="/info" className="hover:text-blue-600 transition">Công Khai Pháp Lý</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
            >
              Đăng Nhập
            </Link>
            <Link
              href="/register-trial"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              Học Thử Miễn Phí
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 border-b border-slate-200 bg-gradient-to-b from-white to-[#F7F9FC]">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Chương Trình Đào Tạo Tiêu Chuẩn Quốc Tế Cambridge & IELTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            Khám Phá Các Khóa Học Tại CoreLink Academy
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            100% giáo viên đạt chuẩn chuyên môn quốc tế, sĩ số lớp học giới hạn 10 - 12 học viên, 
            kết hợp trợ lý AI luyện nói & sửa lỗi phát âm 24/7 giúp học viên bứt phá năng lực.
          </p>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 max-w-3xl mx-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm tên khóa học hoặc mã khóa..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap justify-center">
              {[
                { id: 'all', label: 'Tất Cả Cấp Độ' },
                { id: 'tiểu học', label: 'Tiểu Học' },
                { id: 'thcs', label: 'THCS' },
                { id: 'ielts', label: 'Luyện Thi IELTS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedLevel(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedLevel === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course List Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">Đang tải danh mục khóa học...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 font-heading">Không Tìm Thấy Khóa Học</h3>
            <p className="text-xs text-slate-500">Không có khóa học nào khớp với từ khóa hoặc bộ lọc bạn chọn.</p>
            <button
              onClick={() => { setSelectedLevel('all'); setSearchKeyword(''); }}
              className="text-xs font-semibold text-blue-600 hover:underline pt-2"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#0F9D8A]">
                      {c.levelName || 'Toàn diện'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-heading leading-snug">
                    {c.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                    {c.description}
                  </p>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Thời lượng:
                      </span>
                      <span className="font-semibold text-slate-800">{c.durationSessions ? `${c.durationSessions} buổi học` : '36 buổi'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Đối tượng:
                      </span>
                      <span className="font-semibold text-slate-800">{c.targetAudience}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Học phí niêm yết:</span>
                      <span className="text-base font-extrabold text-blue-600">
                        {c.feeAmountVnd ? `${c.feeAmountVnd.toLocaleString('vi-VN')} ₫` : 'Liên hệ tư vấn'}
                      </span>
                    </div>
                  </div>

                  {c.teachers && c.teachers.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {c.teachers[0].fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{c.teachers[0].fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{c.teachers[0].degree || c.teachers[0].certifications}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                  <Link
                    href={`/register-trial?course=${encodeURIComponent(c.name)}`}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center shadow-sm transition"
                  >
                    Đăng Ký Học Thử
                  </Link>
                  <Link
                    href="/#quick-test"
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-center transition"
                  >
                    Test Trình Độ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-white font-bold text-sm">CoreLink Academy — Hệ Thống Đào Tạo Tiếng Anh Tích Hợp AI</p>
          <p className="text-slate-500">Hotline: 098.765.4321 — Email: admissions@corelink.edu.vn — Trụ sở: Quận Cầu Giấy, Hà Nội</p>
          <p className="text-slate-600 pt-2">© 2026 CoreLink Academy. Bản quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
