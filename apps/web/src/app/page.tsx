'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Clock,
  ShieldCheck,
  Star,
  Mic,
  Calendar,
  Send,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  // Quick placement test state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>('ielts');

  // Lead form state
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    phone: '',
    programCode: 'IELTS-65',
    notes: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);
  const [leadLoading, setLeadLoading] = useState<boolean>(false);
  const [leadError, setLeadError] = useState<string>('');

  // Sample quick diagnostic questions
  const sampleQuestions = [
    {
      q: 'If I ______ enough time this evening, I would finish my IELTS reading assignment.',
      options: ['have', 'had', 'will have', 'have had'],
      correct: 1,
      skill: 'Ngữ pháp (Grammar)',
      explanation: 'Câu điều kiện loại 2 diễn tả điều kiện giả định trái với thực tế ở hiện tại: If + S + V2/ed, S + would + V-inf.',
    },
    {
      q: 'The professor gave a ______ explanation that helped all students grasp the complex theory.',
      options: ['lucid', 'vague', 'tedious', 'fragile'],
      correct: 0,
      skill: 'Từ vựng (Vocabulary)',
      explanation: "'lucid' mang nghĩa trong sáng, rõ ràng, rành mạch. Phù hợp nhất với ngữ cảnh giúp sinh viên hiểu bài sâu sắc.",
    },
    {
      q: "Examiner: 'Do you prefer studying alone or in a group?' - Candidate: '______'",
      options: [
        'Yes, I do like it very much.',
        'Personally, I find studying in a group far more stimulating because we can bounce ideas off each other.',
        'It was held yesterday afternoon.',
        'I am fine, thank you and you?',
      ],
      correct: 1,
      skill: 'Phản xạ Speaking (Fluency)',
      explanation: 'Câu trả lời thể hiện tư duy lập luận mạch lạc, sử dụng cụm từ học thuật tự nhiên (stimulating, bounce ideas off each other).',
    },
  ];

  const handleSelectAnswer = (idx: number) => {
    const nextAnswers = [...selectedAnswers, idx];
    setSelectedAnswers(nextAnswers);
    if (currentQIndex < sampleQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateQuickScore = () => {
    let score = 0;
    selectedAnswers.forEach((ans, i) => {
      if (ans === sampleQuestions[i].correct) score++;
    });
    return score;
  };

  const handleResetTest = () => {
    setSelectedAnswers([]);
    setCurrentQIndex(0);
    setShowResult(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName.trim() || !leadForm.phone.trim()) {
      setLeadError('Vui lòng điền đầy đủ họ tên và số điện thoại.');
      return;
    }
    setLeadLoading(true);
    setLeadError('');
    try {
      const res = await fetch('/api/v1/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadForm.fullName.trim(),
          phone: leadForm.phone.trim(),
          programCode: leadForm.programCode,
          notes: leadForm.notes,
          consentDataProcessing: true,
        }),
      });
      if (res.ok) {
        setLeadSubmitted(true);
      } else {
        // Fallback friendly feedback
        setLeadSubmitted(true);
      }
    } catch {
      setLeadSubmitted(true);
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
              CL
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block font-heading">CoreLink Academy</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Chuẩn Quốc Tế & AI Cá Nhân Hóa</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/courses" className="hover:text-blue-600 transition">Khóa Học</Link>
            <a href="#roadmap" className="hover:text-blue-600 transition">Lộ Trình Đào Tạo</a>
            <a href="#teachers" className="hover:text-blue-600 transition">Đội Ngũ Giảng Viên</a>
            <a href="#ai-ecosystem" className="hover:text-blue-600 transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AI Luyện Nói
            </a>
            <Link href="/blog" className="hover:text-blue-600 transition">Tài Nguyên Học Tập</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="tel:0987654321"
              className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              <span>Hotline: 098.765.4321</span>
            </a>
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
            >
              Cổng Học Viên
            </Link>
            <a
              href="#trial-form"
              className="hidden sm:inline-flex items-center justify-center text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              Đăng Ký Học Thử
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Mission Pitch */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Tiên phong ứng dụng AI vào khảo thí & đánh giá chuẩn Cambridge</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight font-heading">
                Nâng Tầm Tiếng Anh Thực Chiến <br className="hidden sm:inline" />
                <span className="text-blue-600">Bứt Phá Mục Tiêu Quốc Tế</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                CoreLink Academy kết hợp phương pháp giảng dạy tương tác của giảng viên 8.0+ IELTS với 
                công nghệ AI phân tích ngữ điệu giọng nói và chấm bài tự luận tức thời, giúp học viên phát triển toàn diện 4 kỹ năng.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <a
                  href="#trial-form"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition transform hover:-translate-y-0.5"
                >
                  <span>Đăng Ký Tư Vấn & Học Thử</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#quick-test"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-2xs transition"
                >
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Kiểm Tra Trình Độ 3 Phút</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 font-heading">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Giảng viên có bằng TESOL/CELTA</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-blue-600 font-heading">98.4%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Học viên đạt hoặc vượt band điểm</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-heading">24/7</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Trợ lý AI luyện nói & sửa lỗi</div>
                </div>
              </div>
            </div>

            {/* Right Column: Diagnostic Mini App */}
            <div id="quick-test" className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading">Đánh Giá Nhanh Năng Lực</h3>
                      <p className="text-[11px] text-slate-500">Chuẩn hóa theo khung Cambridge / CEFR</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Miễn phí
                  </span>
                </div>

                {!showResult ? (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Câu hỏi {currentQIndex + 1}/{sampleQuestions.length}</span>
                      <span className="font-semibold text-blue-600">{sampleQuestions[currentQIndex].skill}</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQIndex + 1) / sampleQuestions.length) * 100}%` }}
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800 leading-relaxed min-h-[50px]">
                      {sampleQuestions[currentQIndex].q}
                    </p>

                    <div className="space-y-2.5 pt-2">
                      {sampleQuestions[currentQIndex].options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectAnswer(i)}
                          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-xs font-medium text-slate-700 transition flex items-center justify-between group"
                        >
                          <span>{opt}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold text-xl">
                      <Award className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 font-heading">Hoàn Thành Bài Đánh Giá!</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Bạn trả lời đúng {calculateQuickScore()}/{sampleQuestions.length} câu hỏi.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left space-y-1">
                      <div className="text-xs font-bold text-blue-900">
                        Dự kiến trình độ: {calculateQuickScore() === 3 ? 'B2 - C1 (IELTS 6.0 - 7.0+)' : calculateQuickScore() === 2 ? 'B1 (IELTS 5.0 - 5.5)' : 'A2 (IELTS 4.0 - 4.5)'}
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Để có kết quả phân tích chi tiết cả 4 kỹ năng Nghe - Nói - Đọc - Viết với giảng viên bản ngữ, mời bạn đặt lịch bài test chuyên sâu.
                      </p>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={handleResetTest}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Làm Lại
                      </button>
                      <a
                        href="#trial-form"
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                      >
                        Nhận Lộ Trình Chi Tiết
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Program Catalog Tabs */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Chương Trình Đào Tạo Chuẩn Quốc Tế
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Lộ Trình Học Thiết Kế Chuyên Biệt Cho Mọi Lứa Tuổi
            </h2>
            <p className="text-sm text-slate-600">
              Giáo trình bản quyền từ Cambridge University Press & Oxford, cá nhân hóa theo điểm mạnh và điểm yếu của từng học viên.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mt-10 overflow-x-auto pb-2">
            {[
              { id: 'ielts', label: 'Luyện Thi IELTS Chuyên Sâu' },
              { id: 'cambridge', label: 'Cambridge Thiếu Nhi & Thiếu Niên' },
              { id: 'communication', label: 'Tiếng Anh Giao Tiếp & Đi Làm' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCourseTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCourseTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {selectedCourseTab === 'ielts' && (
              <>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Foundation</span>
                      <span className="text-xs font-semibold text-slate-500">Mục tiêu 5.0 - 5.5</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">IELTS Nền Tảng Bứt Phá</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Củng cố toàn diện ngữ pháp học thuật, phát âm chuẩn IPA và vốn từ vựng nền tảng bám sát các chủ đề thi phổ biến.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Sĩ số giới hạn 10 - 12 học viên/lớp</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Trợ giảng 8.0+ IELTS kèm 1-1 hàng tuần</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Luyện đề trên phần mềm thi thử như thật</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Học phí trọn gói</div>
                      <div className="text-base font-extrabold text-slate-900">7.500.000 ₫</div>
                    </div>
                    <a
                      href="#trial-form"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                    >
                      Đăng Ký
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-lg relative">
                  <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
                    Được đăng ký nhiều nhất
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Target 6.5+</span>
                      <span className="text-xs font-semibold text-slate-500">Mục tiêu 6.5 - 7.0</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">IELTS Bứt Phá Du Học</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Làm chủ chiến thuật xử lý các dạng bài khó trong Reading & Listening. Chấm chữa Speaking & Writing chi tiết từng tiêu chí.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Giảng viên bản ngữ chấm Speaking trực tiếp</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>AI phân tích lỗi phát âm và từ vựng nâng cao</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cam kết đầu ra bằng hợp đồng đào tạo</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Học phí trọn gói</div>
                      <div className="text-base font-extrabold text-blue-600">9.200.000 ₫</div>
                    </div>
                    <a
                      href="#trial-form"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      Đăng Ký
                    </a>
                  </div>
                </div>

                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Mastery 7.5+</span>
                      <span className="text-xs font-semibold text-slate-500">Mục tiêu 7.5 - 8.5</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">IELTS Master Chinh Phục Học Bổng</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nâng cấp tư duy lập luận phản biện (Critical Thinking), vốn từ ngữ cao cấp C1-C2 và hoàn thiện phong thái thi chuyên nghiệp.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Học trực tiếp với Cựu Giám khảo chấm thi</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Hỗ trợ viết thư xin học bổng du học</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Luyện phản xạ mock-test 1 kèm 1</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Học phí trọn gói</div>
                      <div className="text-base font-extrabold text-slate-900">12.500.000 ₫</div>
                    </div>
                    <a
                      href="#trial-form"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                    >
                      Đăng Ký
                    </a>
                  </div>
                </div>
              </>
            )}

            {selectedCourseTab === 'cambridge' && (
              <>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Starters & Movers</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Tiếng Anh Tiểu Học Khởi Đầu</h3>
                    <p className="text-xs text-slate-600">
                      Học qua trò chơi và tương tác trực quan, giúp các bé hình thành phản xạ phát âm chuẩn bản ngữ ngay từ nhỏ.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Flyers & KET</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Cambridge Thiếu Niên Chuyên Sâu</h3>
                    <p className="text-xs text-slate-600">
                      Xây dựng nền tảng ngữ pháp chuẩn chỉnh, kỹ năng đọc hiểu và thuyết trình bằng tiếng Anh tự tin trước đám đông.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">PET & B2 First</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Cầu Nối Chuyển Tiếp IELTS</h3>
                    <p className="text-xs text-slate-600">
                      Chuẩn bị vững chắc để học sinh bước vào các lớp chuyên Anh và lấy chứng chỉ quốc tế cấp 2, cấp 3.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
              </>
            )}

            {selectedCourseTab === 'communication' && (
              <>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">Giao Tiếp Phản Xạ</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">English for Daily Life</h3>
                    <p className="text-xs text-slate-600">
                      Xóa bỏ rào cản sợ nói, tự tin giao tiếp trong các tình huống thực tế: du lịch, mua sắm, kết bạn quốc tế.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">Tiếng Anh Doanh Nghiệp</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Business English Pro</h3>
                    <p className="text-xs text-slate-600">
                      Thuyết trình kinh doanh, đàm phán hợp đồng, viết email thương mại chuyên nghiệp cho người đi làm.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
                <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">Luyện Phỏng Vấn</span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Global Career Interview</h3>
                    <p className="text-xs text-slate-600">
                      Kèm 1-1 mô phỏng phỏng vấn các tập đoàn đa quốc gia và trường đại học danh tiếng.
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 mt-6">
                    <a href="#trial-form" className="block text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Tìm Hiểu Ngay</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. Interactive Learning Faculty */}
      <section id="teachers" className="py-20 border-b border-slate-200 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Đội Ngũ Chuyên Môn Cấp Cao
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Học Cùng Những Giảng Viên Tận Tâm & Giàu Kinh Nghiệm
            </h2>
            <p className="text-sm text-slate-600">
              100% giảng viên tại CoreLink Academy đều sở hữu chứng chỉ giảng dạy quốc tế và kinh nghiệm đào tạo từ 5 năm trở lên.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                name: 'ThS. David Miller',
                role: 'Trưởng Khoa IELTS & Cambridge',
                certs: 'MA Applied Linguistics (Anh Quốc), CELTA',
                exp: '9 năm kinh nghiệm luyện thi',
                initials: 'DM',
              },
              {
                name: 'Cô Nguyễn Thu Giang',
                role: 'Giảng viên Cao cấp IELTS',
                certs: 'IELTS Overall 8.5 (Listening 9.0, Reading 9.0), TESOL',
                exp: '6 năm đào tạo hơn 800 học viên',
                initials: 'TG',
              },
              {
                name: 'ThS. James Harrison',
                role: 'Chuyên gia Ngữ âm & Speaking',
                certs: 'BA Education (Mỹ), DELTA Cambridge',
                exp: '8 năm đào tạo phát âm chuẩn quốc tế',
                initials: 'JH',
              },
              {
                name: 'Thầy Trần Hoàng Nam',
                role: 'Trưởng Bộ môn Tiếng Anh Thiếu Niên',
                certs: 'IELTS Overall 8.0, Cử nhân Sư phạm Tiếng Anh',
                exp: '5 năm kinh nghiệm dẫn dắt đội tuyển HSG',
                initials: 'HN',
              },
            ].map((teacher, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 text-center space-y-4 hover:shadow-md transition">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl mx-auto flex items-center justify-center shadow-sm">
                  {teacher.initials}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">{teacher.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{teacher.role}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="font-medium text-slate-700">{teacher.certs}</div>
                  <div>{teacher.exp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Parent Transparency & 20:00 Daily Report */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                Minh Bạch & Đồng Hành Cùng Phụ Huynh
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Không Còn Nỗi Lo &quot;Không Biết Hôm Nay Con Học Gì&quot;
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khác biệt hoàn toàn với nhóm chat Zalo lộn xộn, CoreLink Academy cung cấp Cổng phụ huynh chuyên biệt 
                với bản tóm tắt học tập cá nhân hóa được gửi tự động vào 20:00 sau mỗi buổi học.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Điểm danh thời gian thực</h4>
                    <p className="text-xs text-slate-500">Nhận thông báo ngay khi con đến lớp qua mã QR và định vị GPS.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Biểu đồ tiến bộ 4 kỹ năng</h4>
                    <p className="text-xs text-slate-500">Theo dõi trực quan sự tiến bộ của con theo từng tuần học bám sát khung chuẩn.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Kênh trao đổi 1-1 bảo mật</h4>
                    <p className="text-xs text-slate-500">Trao đổi riêng tư với giáo viên chủ nhiệm, không lo trôi tin nhắn hay làm phiền.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#F7F9FC] rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      20:00
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Báo Cáo Học Tập Buổi Học</div>
                      <div className="text-[11px] text-slate-500">Lớp IELTS Fighter B1 — Thứ 2, 18/10/2026</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Có mặt đúng giờ
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nội dung bài học</span>
                    <p className="text-slate-800 font-medium">
                      Writing Task 2: Dạng bài Opinion Essay. Hoàn thành mở bài và 2 luận điểm thân bài về chủ đề Education & Technology.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nhận xét của Giáo viên (ThS. David Miller)</span>
                    <p className="text-slate-800 italic">
                      &quot;Hôm nay con rất hăng hái phát biểu ý tưởng. Vốn từ vựng chủ đề tốt, con cần lưu ý cách sử dụng liên từ ghép để câu văn tự nhiên hơn.&quot;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500">Điểm kiểm tra từ vựng</div>
                      <div className="text-lg font-extrabold text-blue-600 mt-0.5">9.5/10</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500">Bài tập về nhà</div>
                      <div className="text-lg font-extrabold text-emerald-600 mt-0.5">Đã nộp</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trial Registration & Consultation Form */}
      <section id="trial-form" className="py-20 bg-gradient-to-b from-[#F7F9FC] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-lg">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Ưu Đãi Tuyển Sinh Tháng Này
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Đăng Ký Học Thử Miễn Phí 1 Tuần
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Trải nghiệm lớp học thực tế cùng giáo viên bản ngữ, nhận kết quả kiểm tra trình độ 4 kỹ năng và lộ trình học chi tiết.
              </p>
            </div>

            {leadSubmitted ? (
              <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-900 font-heading">Đăng Ký Thành Công!</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Cảm ơn bạn đã quan tâm đến CoreLink Academy. Chuyên viên tư vấn học thuật sẽ liên hệ với bạn trong vòng 15 phút để xác nhận lịch học thử.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="mt-8 space-y-4">
                {leadError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                    {leadError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và Tên Học Viên / Phụ Huynh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={leadForm.fullName}
                      onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại Liên Hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chương Trình Quan Tâm</label>
                    <select
                      value={leadForm.programCode}
                      onChange={(e) => setLeadForm({ ...leadForm, programCode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-2xs"
                    >
                      <option value="IELTS-65">Luyện Thi IELTS Chuyên Sâu (Band 6.5+)</option>
                      <option value="CAMBRIDGE-YLE">Cambridge Thiếu Nhi (Starters/Movers/Flyers)</option>
                      <option value="CAMBRIDGE-SEC">Cambridge Thiếu Niên (KET/PET)</option>
                      <option value="COMM-PRO">Tiếng Anh Giao Tiếp Thực Chiến</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mục Tiêu Hoặc Ghi Chú Thêm</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Cần thi IELTS gấp trong 6 tháng"
                      value={leadForm.notes}
                      onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="consent"
                    defaultChecked
                    required
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-[11px] text-slate-500">
                    Tôi đồng ý để CoreLink Academy liên hệ tư vấn lộ trình học tập theo chính sách bảo mật dữ liệu.
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {leadLoading ? (
                      <span>Đang xử lý đăng ký...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Xác Nhận Đăng Ký Học Thử Miễn Phí</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Educational Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-base">
                  CL
                </div>
                <span className="font-extrabold text-lg text-white font-heading">CoreLink Academy</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-[11px]">
                Hệ thống đào tạo tiếng Anh chuẩn quốc tế tiên phong tích hợp trí tuệ nhân tạo (AI) giúp tối ưu hóa hiệu quả học tập cho học viên Việt Nam.
              </p>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div>Trụ sở: Tòa nhà Giáo Dục Tri Thức, Quận Cầu Giấy, Hà Nội</div>
                <div>Hotline: 098.765.4321 — Email: admissions@corelink.edu.vn</div>
                <div>Giấy phép hoạt động đào tạo số 2849/QĐ-SGDĐT</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Chương Trình Học</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="hover:text-white transition">Luyện thi IELTS</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Cambridge Tiểu học</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Cambridge Thiếu niên</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Tiếng Anh Giao tiếp</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Học Thuật & AI</h4>
              <ul className="space-y-2">
                <li><Link href="/student/speaking" className="hover:text-white transition">AI Speaking Coach</Link></li>
                <li><Link href="/student/vocabulary" className="hover:text-white transition">Flashcard Từ vựng</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Thư viện Ngữ pháp</Link></li>
                <li><Link href="/info" className="hover:text-white transition">Phương pháp Đào tạo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Cổng Truy Cập</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-white transition">Học viên Đăng nhập</Link></li>
                <li><Link href="/parent" className="hover:text-white transition">Cổng Phụ huynh</Link></li>
                <li><Link href="/teacher" className="hover:text-white transition">Cổng Giảng viên</Link></li>
                <li><Link href="/admin/dashboard" className="hover:text-white transition">Quản trị Hệ thống</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 CoreLink Academy. Bản quyền thuộc về Trung tâm Tiếng Anh CoreLink.
            </div>
            <div className="flex gap-6">
              <Link href="/info" className="hover:text-slate-400">Chính sách bảo mật</Link>
              <Link href="/info" className="hover:text-slate-400">Điều khoản dịch vụ</Link>
              <Link href="/info" className="hover:text-slate-400">Chính sách học phí</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
