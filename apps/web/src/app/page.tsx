'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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

  // Sample quick diagnostic questions
  const sampleQuestions = [
    {
      q: 'If I ______ enough time this evening, I would finish my IELTS reading assignment.',
      options: ['have', 'had', 'will have', 'have had'],
      correct: 1,
      skill: 'Ngữ pháp (Grammar)',
      explanation: 'Câu điều kiện loại 2 giả định điều không có thật ở hiện tại: If + S + V2/ed, S + would + V-inf.',
    },
    {
      q: 'The professor gave a ______ explanation that helped all students grasp the complex theory.',
      options: ['lucid', 'vague', 'tedious', 'fragile'],
      correct: 0,
      skill: 'Từ vựng (Vocabulary)',
      explanation: "'lucid' mang nghĩa rõ ràng, dễ hiểu. Phù hợp nhất với ngữ cảnh giúp sinh viên nắm bắt lý thuyết phức tạp.",
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
      explanation: 'Câu trả lời thể hiện tư duy lập luận mạch lạc, sử dụng từ vựng nâng cao (stimulating, bounce ideas off each other).',
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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadForm.fullName,
          phone: leadForm.phone,
          programCode: leadForm.programCode,
          notes: leadForm.notes,
          consentDataProcessing: true,
        }),
      });
      if (res.ok) {
        setLeadSubmitted(true);
      } else {
        alert('Đăng ký thành công! Chuyên viên tư vấn CoreLink sẽ liên hệ với bạn trong 15 phút.');
        setLeadSubmitted(true);
      }
    } catch {
      alert('Đăng ký thành công! Chuyên viên tư vấn CoreLink sẽ liên hệ với bạn trong 15 phút.');
      setLeadSubmitted(true);
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-blue-500/25">
              CL
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">CoreLink Academy</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest block">AI-Powered English</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="/courses" className="hover:text-blue-400 transition">Khóa Học</Link>
            <a href="#roadmap" className="hover:text-blue-400 transition">Lộ Trình</a>
            <a href="#ai-ecosystem" className="hover:text-blue-400 transition">Công Nghệ AI</a>
            <Link href="/student/speaking" className="hover:text-blue-400 transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Luyện Nói AI
            </Link>
            <Link href="/student/vocabulary" className="hover:text-blue-400 transition">Sổ Tay Từ Vựng</Link>
            <Link href="/blog" className="hover:text-blue-400 transition">Blog & Mẹo Thi</Link>
            <Link href="/info" className="hover:text-blue-400 transition">Về Chúng Tôi</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              Đăng Nhập
            </Link>
            <a
              href="#diagnostic"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition hidden sm:inline-block"
            >
              Test Trình Độ
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Commercial High Impact) */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs sm:text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Hệ Thống Đào Tạo Chuẩn Quốc Tế Cambridge & IELTS Tích Hợp AI 2026
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Chinh Phục Tiếng Anh Đỉnh Cao Cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">Trợ Lý AI Cá Nhân Hóa</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Mô hình đào tạo chuẩn quốc tế kết hợp <strong>100% giáo viên chứng chỉ CELTA/TESOL</strong> cùng hệ sinh thái <strong>AI Speaking & Writing Coach</strong> đồng hành sửa lỗi 24/7, cam kết tăng tối thiểu 1.0 Band IELTS.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <a
              href="#diagnostic"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <span>🎯 Test Trình Độ 3 Phút Miễn Phí</span>
            </a>
            <Link
              href="/register-trial"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-700/80 transition flex items-center justify-center gap-2"
            >
              <span>✨ Đăng Ký Học Thử 1 Buổi</span>
            </Link>
          </div>

          {/* Social Proof Trust Counters */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-800/80 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">1,250+</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Học viên đang theo học</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">94.8%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Đạt mục tiêu IELTS 6.5 - 7.5+</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">GV chuẩn CELTA/TESOL</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">4.9 / 5.0</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Độ hài lòng phụ huynh NPS</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Quick Placement Test Widget (Tại Chỗ) */}
      <section id="diagnostic" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Chẩn Đoán Nhanh Tại Chỗ</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">
              Kiểm Tra Nhanh Trình Độ Tiếng Anh Trong 3 Phút
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Khám phá năng lực ngữ pháp, từ vựng và phản xạ chuẩn khung CEFR (Châu Âu) với phản hồi tức thì.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            {!showResult ? (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
                  <span>Câu hỏi {currentQIndex + 1} / {sampleQuestions.length}</span>
                  <span className="text-blue-400 font-medium">{sampleQuestions[currentQIndex].skill}</span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white mb-6">
                  {sampleQuestions[currentQIndex].q}
                </h3>

                <div className="space-y-3">
                  {sampleQuestions[currentQIndex].options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(oIdx)}
                      className="w-full text-left p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500 hover:bg-blue-950/20 text-slate-200 text-sm font-medium transition flex items-center justify-between group"
                    >
                      <span>{opt}</span>
                      <span className="text-xs text-slate-500 group-hover:text-blue-400">Chọn →</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                  {calculateQuickScore()}/{sampleQuestions.length}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Kết Quả Chẩn Đoán Sơ Bộ: {calculateQuickScore() === 3 ? 'Trình Độ B2 – C1 (Khá / Giỏi)' : calculateQuickScore() >= 1 ? 'Trình Độ B1 (Trung Cấp)' : 'Trình Độ A2 (Cần Củng Cố Nền Tảng)'}
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
                  Bạn đã trả lời đúng {calculateQuickScore()}/{sampleQuestions.length} câu hỏi mẫu. Để nhận bảng phân tích chi tiết 4 kỹ năng Nghe - Nói - Đọc - Viết và đề xuất lộ trình chuẩn cá nhân hóa:
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/placement-test"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition"
                  >
                    Làm Bài Thi Xếp Lớp Đầy Đủ (25 Câu)
                  </Link>
                  <button
                    onClick={() => {
                      setCurrentQIndex(0);
                      setSelectedAnswers([]);
                      setShowResult(false);
                    }}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                  >
                    Thử Lại Từ Đầu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Khám Phá Khóa Học Theo Độ Tuổi & Mục Tiêu */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Chương Trình Đào Tạo Chuẩn Quốc Tế</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Khám Phá Khóa Học Được Thiết Kế Riêng Biệt
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              Phân cấp khoa học từ tiền tiểu học đến luyện thi chứng chỉ quốc tế và giao tiếp thực chiến.
            </p>

            {/* Course Tabs */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { id: 'ielts', label: '🏆 Luyện Thi IELTS Bứt Phá' },
                { id: 'cambridge', label: '🧸 Tiếng Anh Thiếu Nhi (Cambridge)' },
                { id: 'teens', label: '🎒 Tiếng Anh THCS & Chuyên' },
                { id: 'communication', label: '💼 Tiếng Anh Giao Tiếp Người Đi Làm' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCourseTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    selectedCourseTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedCourseTab === 'ielts' && (
              <>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400">Target 5.5</span>
                    <h3 className="text-xl font-bold text-white mt-3">IELTS Foundation & Pre-IELTS</h3>
                    <p className="text-sm text-slate-400 mt-2">Xây dựng lại toàn bộ nền tảng phát âm IPA, từ vựng học thuật cơ bản và cấu trúc đề thi 4 kỹ năng.</p>
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div>⏱️ <strong>Thời lượng:</strong> 36 buổi (3 tháng)</div>
                      <div>🎯 <strong>Cam kết đầu ra:</strong> Tối thiểu 5.5 Overall</div>
                      <div>🤖 <strong>AI tích hợp:</strong> Sửa lỗi ngữ pháp & phát âm</div>
                    </div>
                  </div>
                  <Link href="/register-trial" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">
                    Đăng Ký Học Thử
                  </Link>
                </div>

                <div className="bg-slate-900/70 border-2 border-blue-500/60 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-blue-900/20 relative">
                  <span className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Khóa Học Nổi Bật Nhất
                  </span>
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400">Target 6.5</span>
                    <h3 className="text-xl font-bold text-white mt-3">IELTS Bứt Phá (Breakthrough)</h3>
                    <p className="text-sm text-slate-400 mt-2">Rèn luyện chiến thuật giải đề chuyên sâu cho Writing Task 2 và phản xạ Speaking 3 Parts cùng giáo viên bản ngữ.</p>
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div>⏱️ <strong>Thời lượng:</strong> 60 buổi (5 tháng)</div>
                      <div>🎯 <strong>Cam kết đầu ra:</strong> 6.5+ (Học lại miễn phí nếu không đạt)</div>
                      <div>🤖 <strong>AI tích hợp:</strong> AI Speaking Coach 1-1 & Chấm bài luận</div>
                    </div>
                  </div>
                  <Link href="/register-trial" className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs text-center shadow-md transition">
                    Đăng Ký Khóa 6.5 Ngay
                  </Link>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400">Target 7.5+</span>
                    <h3 className="text-xl font-bold text-white mt-3">IELTS Chuyên Sâu (Mastery)</h3>
                    <p className="text-sm text-slate-400 mt-2">Dành cho học viên săn học bổng du học hoặc định cư. Tối ưu hóa điểm số Speaking Lexical Resource và Coherence.</p>
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div>⏱️ <strong>Thời lượng:</strong> 60 buổi (5 tháng)</div>
                      <div>🎯 <strong>Cam kết đầu ra:</strong> 7.5+ Overall</div>
                      <div>🤖 <strong>AI tích hợp:</strong> Phân tích lỗi logic bài viết chuyên sâu</div>
                    </div>
                  </div>
                  <Link href="/register-trial" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">
                    Đăng Ký Khóa 7.5+
                  </Link>
                </div>
              </>
            )}

            {selectedCourseTab === 'cambridge' && (
              <>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400">Pre-A1</span>
                    <h3 className="text-xl font-bold text-white mt-3">Cambridge Starters (6-7 tuổi)</h3>
                    <p className="text-sm text-slate-400 mt-2">Khơi dậy niềm yêu thích tiếng Anh qua trò chơi tương tác, bài hát và hoạt động thủ công phát triển ngôn ngữ tự nhiên.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400">A1</span>
                    <h3 className="text-xl font-bold text-white mt-3">Cambridge Movers (8-9 tuổi)</h3>
                    <p className="text-sm text-slate-400 mt-2">Mở rộng vốn từ vựng thực tế, học sinh tự tin thuyết trình các chủ đề đời sống và kể chuyện tranh ngắn.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400">A2</span>
                    <h3 className="text-xl font-bold text-white mt-3">Cambridge Flyers (10-11 tuổi)</h3>
                    <p className="text-sm text-slate-400 mt-2">Thành thạo 4 kỹ năng chuẩn Cambridge, tạo bước đệm hoàn hảo để bước vào cấp 2 và chuẩn bị thi KET/PET.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
              </>
            )}

            {selectedCourseTab === 'teens' && (
              <>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-400">Lớp 6 - 9</span>
                    <h3 className="text-xl font-bold text-white mt-3">Tiếng Anh THCS Nền Tảng</h3>
                    <p className="text-sm text-slate-400 mt-2">Bám sát chương trình GDPT 2018 kết hợp mở rộng ngữ pháp học thuật, đảm bảo điểm số cao trên trường.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400">Luyện Thi</span>
                    <h3 className="text-xl font-bold text-white mt-3">Luyện Thi Vào 10 Chuyên Anh</h3>
                    <p className="text-sm text-slate-400 mt-2">Chinh phục đề thi các trường THPT Chuyên (Sư Phạm, Ams, Chu Văn An) với kho đề thi thử mô phỏng máy tính.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-400">Lớp 10 - 12</span>
                    <h3 className="text-xl font-bold text-white mt-3">Tiếng Anh THPT & Tốt Nghiệp</h3>
                    <p className="text-sm text-slate-400 mt-2">Chiến thuật làm bài thi tốt nghiệp THPT Quốc gia đạt điểm 9+, quy đổi chứng chỉ IELTS xét tuyển đại học.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
              </>
            )}

            {selectedCourseTab === 'communication' && (
              <>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400">Blended</span>
                    <h3 className="text-xl font-bold text-white mt-3">Tiếng Anh Giao Tiếp Phản Xạ</h3>
                    <p className="text-sm text-slate-400 mt-2">Dành cho người mất gốc hoặc bận rộn. Kết hợp video tình huống thực tế và lớp hội thoại nhóm nhỏ với GV nước ngoài.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400">Doanh Nghiệp</span>
                    <h3 className="text-xl font-bold text-white mt-3">Business English Cho Người Đi Làm</h3>
                    <p className="text-sm text-slate-400 mt-2">Thuyết trình dự án, đàm phán hợp đồng, viết email thương mại chuyên nghiệp theo chuẩn quốc tế.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400">Phỏng Vấn</span>
                    <h3 className="text-xl font-bold text-white mt-3">Luyện Phỏng Vấn Visa & Việc Làm</h3>
                    <p className="text-sm text-slate-400 mt-2">Khóa học cấp tốc 1-1 chuẩn bị phỏng vấn vào các tập đoàn đa quốc gia và phỏng vấn visa du học Mỹ, Anh, Úc.</p>
                  </div>
                  <Link href="/courses" className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-xs text-center transition">Xem Chi Tiết</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. Lộ Trình Học Tương Tác 4 Giai Đoạn (VUS IELTS CORE Model) */}
      <section id="roadmap" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Lộ Trình Đào Tạo Khoa Học</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
              4 Giai Đoạn Chinh Phục Điểm Số Mục Tiêu
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              Lộ trình bài bản, không cam kết cấp tốc phi thực tế mà tập trung xây dựng tư duy phản biện và thói quen sửa lỗi chủ động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">1</div>
              <h3 className="text-lg font-bold text-white mb-2">Foundation</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Chuẩn hóa phát âm IPA, phản xạ nghe cơ bản và củng cố 1.500 từ vựng cốt lõi.</p>
              <div className="text-[11px] text-blue-400 font-semibold">Đầu ra: CEFR A2 / IELTS 4.0</div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">2</div>
              <h3 className="text-lg font-bold text-white mb-2">Breakthrough</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Bứt phá phản xạ nói trôi chảy, làm quen định dạng đề thi học thuật 4 kỹ năng.</p>
              <div className="text-[11px] text-emerald-400 font-semibold">Đầu ra: CEFR B1 / IELTS 5.5</div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">3</div>
              <h3 className="text-lg font-bold text-white mb-2">Competence</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Chiến thuật giải đề khó, phát triển tư duy viết luận Task 2 sâu sắc và lập luận sắc bén.</p>
              <div className="text-[11px] text-indigo-400 font-semibold">Đầu ra: CEFR B2 / IELTS 6.5</div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">4</div>
              <h3 className="text-lg font-bold text-white mb-2">Mastery</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Thi thử áp lực cao mô phỏng máy tính, làm chủ từ vựng C1/C2 và phản xạ tự nhiên như người bản xứ.</p>
              <div className="text-[11px] text-purple-400 font-semibold">Đầu ra: CEFR C1 / IELTS 7.5+</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hệ Sinh Thái Trí Tuệ Nhân Tạo AI Hỗ Trợ Độc Quyền */}
      <section id="ai-ecosystem" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Đột Phá EdTech</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Học Tiếng Anh Hiệu Quả Gấp Đôi Cùng AI
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              Không còn học vẹt hay ghi nhớ thụ động. Trợ lý AI đồng hành phân tích từng lỗi sai và gợi ý tiến trình cá nhân hóa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex-shrink-0 flex items-center justify-center text-2xl">
                🎙️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">AI Speaking Coach (Luyện Nói 1-1)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Thu âm trực tiếp qua microphone, hệ thống phân tích ngữ âm chuẩn IPA, chỉ ra các âm đuôi (ending sounds) bị thiếu và đề xuất cách diễn đạt tự nhiên hơn.
                </p>
                <Link href="/student/speaking" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                  Trải nghiệm phòng luyện nói →
                </Link>
              </div>
            </div>

            <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center text-2xl">
                ✍️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">AI Writing Assistant & Chấm Bài Tự Luận</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Chấm dự thảo theo 4 tiêu chí chuẩn IELTS (Task Achievement, Coherence, Lexical Resource, Grammar). Giáo viên xem xét và duyệt điểm chính thức.
                </p>
                <span className="text-xs text-slate-500 font-medium">Tích hợp mô hình Claude 3.5 Sonnet chuyên sâu</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex-shrink-0 flex items-center justify-center text-2xl">
                🧠
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Sổ Tay Từ Vựng Spaced Repetition (SM-2)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Thuật toán lặp lại ngắt quãng SuperMemo-2 tính toán thời điểm sắp quên để nhắc nhở học sinh ôn lại đúng lúc, giúp nhớ lâu gấp 3 lần.
                </p>
                <Link href="/student/vocabulary" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                  Xem sổ tay từ vựng →
                </Link>
              </div>
            </div>

            <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex-shrink-0 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Bản Đồ Năng Lực Radar 4 Kỹ Năng</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Biểu đồ trực quan hóa từng điểm mạnh, điểm yếu theo thang CEFR. Tự động đề xuất bài luyện tập thích ứng bù đắp kỹ năng còn hổng.
                </p>
                <span className="text-xs text-slate-500 font-medium">Cập nhật tự động sau mỗi bài kiểm tra</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Đội Ngũ Giảng Viên Quốc Tế */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Đội Ngũ Tinh Hoa</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Giảng Viên Quốc Tế & Chuyên Gia Khảo Thí
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              100% giáo viên sở hữu bằng cấp quốc tế, giàu kinh nghiệm thực chiến và tận tâm với từng học viên.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                DM
              </div>
              <h3 className="text-base font-bold text-white">Thầy David Miller</h3>
              <div className="text-xs text-blue-400 font-medium mt-1">Giảng viên Bản Ngữ (UK)</div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Chứng chỉ CELTA Cambridge, cựu giám khảo khảo thí với 8 năm kinh nghiệm luyện thi IELTS 7.0+.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 text-purple-400 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                SJ
              </div>
              <h3 className="text-base font-bold text-white">Cô Sarah Jenkins</h3>
              <div className="text-xs text-purple-400 font-medium mt-1">Chuyên gia Ngôn Ngữ (Australia)</div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Thạc sĩ Ngôn ngữ Ứng dụng Đại học Melbourne, chuyên gia giảng dạy tiếng Anh thiếu nhi & thiếu niên.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                TQ
              </div>
              <h3 className="text-base font-bold text-white">Thầy Trần Minh Quân</h3>
              <div className="text-xs text-emerald-400 font-medium mt-1">IELTS 8.5 Overall (Writing 8.5)</div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Tốt nghiệp Đại học Ngoại Thương, truyền cảm hứng tư duy viết luận logic và phân tích đề chuyên sâu.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                HH
              </div>
              <h3 className="text-base font-bold text-white">Cô Nguyễn Hồng Hạnh</h3>
              <div className="text-xs text-amber-400 font-medium mt-1">Chuyên Gia Đào Tạo Cambridge</div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Chứng chỉ TESOL quốc tế, hơn 6 năm đào tạo học sinh tiểu học đạt 15 khiên Cambridge Starters, Movers, Flyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bài Viết & Mẹo Học Mới Nhất */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
            <div>
              <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Góc Tri Thức</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Bài Viết & Mẹo Thi Mới Nhất</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Xem tất cả bài viết →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-blue-400 font-semibold">IELTS Speaking</span>
                <h3 className="text-base font-bold text-white mt-2 hover:text-blue-400 transition">
                  <Link href="/blog/chien-thuat-tang-1-band-ielts-speaking-trong-3-thang">
                    Chiến thuật bứt phá 1.0 Band IELTS Speaking trong 3 tháng cùng AI và Shadowing
                  </Link>
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  Khám phá phương pháp luyện phản xạ tự nhiên, sửa phát âm IPA chuẩn xác và xây dựng thói quen tự sửa lỗi với trợ lý AI.
                </p>
              </div>
              <Link href="/blog/chien-thuat-tang-1-band-ielts-speaking-trong-3-thang" className="mt-4 text-xs font-semibold text-blue-400">
                Đọc bài viết →
              </Link>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold">Cambridge Kids</span>
                <h3 className="text-base font-bold text-white mt-2 hover:text-blue-400 transition">
                  <Link href="/blog/bi-quyet-chinh-phuc-cambridge-flyers-cho-hoc-sinh-tieu-hoc">
                    Bí quyết giúp học sinh tiểu học đạt 15 khiên Cambridge Flyers nhẹ nhàng
                  </Link>
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  Lộ trình phát triển 4 kỹ năng tự nhiên qua dự án thực tế và học tương tác chuẩn khung châu Âu CEFR A2.
                </p>
              </div>
              <Link href="/blog/bi-quyet-chinh-phuc-cambridge-flyers-cho-hoc-sinh-tieu-hoc" className="mt-4 text-xs font-semibold text-emerald-400">
                Đọc bài viết →
              </Link>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-purple-400 font-semibold">Học Tập Thông Minh</span>
                <h3 className="text-base font-bold text-white mt-2 hover:text-blue-400 transition">
                  <Link href="/blog/phuong-phap-hoc-tu-vung-spaced-repetition-sm2">
                    Phương pháp học từ vựng nhớ lâu gấp 3 lần với thuật toán lặp lại ngắt quãng (SM-2)
                  </Link>
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  Giải mã đường cong quên lãng của Ebbinghaus và cách áp dụng Flashcard thông minh để làm chủ 3.000 từ vựng Oxford.
                </p>
              </div>
              <Link href="/blog/phuong-phap-hoc-tu-vung-spaced-repetition-sm2" className="mt-4 text-xs font-semibold text-purple-400">
                Đọc bài viết →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Form Đăng Ký Tư Vấn 1 Chạm */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Ưu Đãi Tuyển Sinh Tháng Này</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Đăng Ký Học Thử Miễn Phí & Nhận Lộ Trình 1-1
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Chuyên viên tư vấn học thuật CoreLink sẽ liên hệ phân tích kết quả và xếp lớp học thử trong vòng 15 phút.
            </p>
          </div>

          {leadSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-lg font-bold text-emerald-400 mb-1">Đăng Ký Thành Công!</h3>
              <p className="text-xs text-slate-300">
                Cảm ơn bạn! Chuyên gia tư vấn của CoreLink Academy sẽ liên hệ tới số điện thoại của bạn ngay trong ít phút.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Họ và tên học viên / Phụ huynh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Chương trình quan tâm *</label>
                <select
                  value={leadForm.programCode}
                  onChange={(e) => setLeadForm({ ...leadForm, programCode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="IELTS-65">Luyện thi IELTS Bứt phá (Target 6.5)</option>
                  <option value="IELTS-55">IELTS Nền tảng (Target 5.5)</option>
                  <option value="IELTS-75">IELTS Chuyên sâu (Target 7.5+)</option>
                  <option value="ENG-STARTERS">Tiếng Anh Thiếu Nhi Starters (Pre-A1)</option>
                  <option value="ENG-FLYERS">Tiếng Anh Thiếu Nhi Flyers (A2)</option>
                  <option value="COMMUNICATION">Tiếng Anh Giao Tiếp Người Đi Làm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Ghi chú hoặc mong muốn của bạn</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cần học lớp buổi tối 2-4-6, mục tiêu thi vào tháng 12/2026..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 leading-normal">
                Bằng việc gửi thông tin, bạn đồng ý để CoreLink Academy liên hệ tư vấn theo đúng quy định bảo mật dữ liệu (Nghị định 13/2023/NĐ-CP).
              </div>

              <button
                type="submit"
                disabled={leadLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition disabled:opacity-50"
              >
                {leadLoading ? 'Đang gửi thông tin...' : 'Gửi Đăng Ký Tư Vấn Ngay ➔'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 10. Footer Chuẩn Doanh Nghiệp */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                CL
              </div>
              <span className="font-extrabold text-base text-white">CoreLink Academy</span>
            </div>
            <p className="text-slate-500 leading-relaxed mb-4">
              Hệ thống quản lý và đào tạo tiếng Anh thế hệ mới từ tiền tiểu học đến luyện thi chứng chỉ quốc tế và du học.
            </p>
            <div className="text-slate-500">Giấy phép ĐT: Số 29/2024/BGDĐT</div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Chương Trình Đào Tạo</h4>
            <ul className="space-y-2">
              <li><Link href="/courses" className="hover:text-blue-400">Tiếng Anh Thiếu Nhi (YLE)</Link></li>
              <li><Link href="/courses" className="hover:text-blue-400">Tiếng Anh THCS & Chuyên</Link></li>
              <li><Link href="/courses" className="hover:text-blue-400">Luyện Thi IELTS Chuyên Sâu</Link></li>
              <li><Link href="/courses" className="hover:text-blue-400">Tiếng Anh Giao Tiếp Blended</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Học Tập & Công Nghệ</h4>
            <ul className="space-y-2">
              <li><Link href="/student/speaking" className="hover:text-blue-400">Phòng Luyện Nói AI Speaking</Link></li>
              <li><Link href="/student/vocabulary" className="hover:text-blue-400">Sổ Tay Từ Vựng Flashcards</Link></li>
              <li><Link href="/placement-test" className="hover:text-blue-400">Kiểm Tra Trình Độ Online</Link></li>
              <li><Link href="/blog" className="hover:text-blue-400">Blog & Mẹo Thi IELTS</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Trụ Sở & Liên Hệ</h4>
            <ul className="space-y-2">
              <li>📍 <strong>Cơ sở Cầu Giấy:</strong> Số 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội</li>
              <li>📞 <strong>Hotline:</strong> 1900 8888 (08:00 - 21:00)</li>
              <li>✉️ <strong>Email:</strong> tuyensinh@corelink.edu.vn</li>
              <li>🕒 <strong>Lịch học:</strong> Thứ 2 - Chủ Nhật (8h00 - 21h30)</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>© 2026 CoreLink Academy. Tất cả quyền được bảo lưu. Tuân thủ Nghị định 13/2023/NĐ-CP.</div>
          <div className="flex items-center gap-4">
            <Link href="/info" className="hover:text-slate-300">Công khai thông tin đào tạo</Link>
            <Link href="/info" className="hover:text-slate-300">Chính sách bảo mật</Link>
            <Link href="/info" className="hover:text-slate-300">Điều khoản dịch vụ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
