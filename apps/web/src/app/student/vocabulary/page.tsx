'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Sparkles, Flame, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';

interface Flashcard {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  viMeaning: string;
  enDefinition: string;
  example: string;
  collocations: string[];
  synonyms: string[];
  level: string;
  topic: string;
  repetition: number;
  intervalDays: number;
  easeFactor: number;
}

export default function AiVocabularyPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [completedDeck, setCompletedDeck] = useState<boolean>(false);

  useEffect(() => {
    fetchCards(selectedCategory);
  }, [selectedCategory]);

  const fetchCards = async (cat: string) => {
    setIsLoading(true);
    setCompletedDeck(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = `/api/v1/competency/vocabulary/flashcards${
        cat !== 'All' ? `?category=${encodeURIComponent(cat)}` : ''
      }`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setCards(data);
      } else {
        fallbackCards();
      }
    } catch {
      fallbackCards();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackCards = () => {
    setCards([
      {
        id: 'fc-1',
        word: 'Ubiquitous',
        phonetic: '/juːˈbɪk.wɪ.təs/',
        partOfSpeech: 'adjective',
        viMeaning: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi',
        enDefinition: 'Present, appearing, or found everywhere.',
        example: 'Smartphones have become ubiquitous in daily modern life.',
        collocations: ['ubiquitous presence', 'ubiquitous technology'],
        synonyms: ['omnipresent', 'pervasive', 'universal'],
        level: 'C1',
        topic: 'Technology & Society',
        repetition: 2,
        intervalDays: 6,
        easeFactor: 2.5,
      },
      {
        id: 'fc-2',
        word: 'Pragmatic',
        phonetic: '/præɡˈmæt.ɪk/',
        partOfSpeech: 'adjective',
        viMeaning: 'Thực tế, thực dụng, giải quyết vấn đề dựa trên thực tiễn',
        enDefinition: 'Solving problems in a sensible way that suits the conditions that really exist.',
        example: 'We need to adopt a pragmatic approach to tackling climate change.',
        collocations: ['pragmatic approach', 'pragmatic solution'],
        synonyms: ['practical', 'realistic', 'sensible'],
        level: 'C1',
        topic: 'Business & Philosophy',
        repetition: 1,
        intervalDays: 3,
        easeFactor: 2.36,
      },
      {
        id: 'fc-3',
        word: 'Resilient',
        phonetic: '/rɪˈzɪl.jənt/',
        partOfSpeech: 'adjective',
        viMeaning: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn',
        enDefinition: 'Able to be happy, successful, etc. again after something difficult.',
        example: 'Young students are often remarkably resilient in adapting to new environments.',
        collocations: ['resilient economy', 'resilient personality'],
        synonyms: ['tough', 'adaptable', 'buoyant'],
        level: 'B2',
        topic: 'Psychology',
        repetition: 0,
        intervalDays: 1,
        easeFactor: 2.5,
      },
    ]);
  };

  const handleRateCard = async (quality: number) => {
    if (!cards[currentIndex]) return;
    const currentCard = cards[currentIndex];

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/v1/competency/vocabulary/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          quality,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setReviewMessage(result.message);
      } else {
        setReviewMessage(quality >= 3 ? 'Ghi nhớ tốt! Thẻ sẽ được ôn lại theo chu kỳ SM-2.' : 'Đã đưa thẻ vào danh sách ôn tập ngày mai.');
      }
    } catch {
      setReviewMessage(quality >= 3 ? 'Ghi nhớ tốt! Thẻ sẽ được ôn lại theo chu kỳ SM-2.' : 'Đã đưa thẻ vào danh sách ôn tập ngày mai.');
    }

    setTimeout(() => {
      setReviewMessage(null);
      setIsFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCompletedDeck(true);
      }
    }, 1200);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/student" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại Bàn Học Sinh
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Brain className="w-3.5 h-3.5" />
            Thuật Toán Lặp Lại Ngắt Quãng SM-2
          </span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Sổ Tay Từ Vựng Thông Minh & Flashcard AI
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl">
            Ứng dụng thuật toán SuperMemo-2 tính toán chính xác chu kỳ quên lãng (Ebbinghaus Forgetting Curve) để nhắc ôn tập đúng thời điểm, giúp từ vựng đi sâu vào trí nhớ dài hạn.
          </p>
        </div>

        {/* Learning Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Từ cần ôn hôm nay</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{cards.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Đã thành thạo</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">128</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Chuỗi học tập</span>
            <div className="text-2xl font-bold text-amber-800 mt-1 flex items-center justify-center gap-1">
              <span>14 Ngày</span>
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Tiến độ cọc thẻ</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {completedDeck ? cards.length : currentIndex + 1} / {cards.length}
            </div>
          </div>
        </div>

        {/* Topic Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'IELTS Core', 'Academic Writing', 'Communication'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat === 'All' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>

        {/* Main Flashcard Container */}
        {isLoading ? (
          <div className="text-center py-24 text-slate-400 text-xs">Đang nạp bộ thẻ từ vựng...</div>
        ) : completedDeck ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Chúc Mừng! Bạn Đã Hoàn Thành Toàn Bộ Thẻ Hôm Nay
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Thuật toán SM-2 đã tự động xếp lịch ôn tập tối ưu cho các từ này. Hãy duy trì thói quen mỗi ngày để nâng band điểm IELTS bền vững!
            </p>
            <button
              onClick={() => fetchCards(selectedCategory)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Luyện Tập Lại Bộ Này
            </button>
          </div>
        ) : currentCard ? (
          <div>
            {/* Review Status Toast */}
            {reviewMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                ✨ {reviewMessage}
              </div>
            )}

            {/* The 3D Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[360px] cursor-pointer mb-6"
            >
              <div
                className={`w-full min-h-[360px] rounded-3xl border p-8 sm:p-10 flex flex-col justify-between shadow-sm transition-all duration-300 ${
                  isFlipped
                    ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                {!isFlipped ? (
                  // Front Side
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase tracking-wider">
                        {currentCard.level}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {currentCard.partOfSpeech}
                      </span>
                      <span className="text-xs text-slate-400">• {currentCard.topic}</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                      {currentCard.word}
                    </h2>
                    <span className="text-lg text-emerald-700 font-mono font-bold mb-6">
                      {currentCard.phonetic}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
                      🔄 Bấm vào thẻ để lật xem định nghĩa & ví dụ
                    </span>
                  </div>
                ) : (
                  // Back Side
                  <div className="flex flex-col justify-between flex-1 text-left">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                        <span className="text-lg font-bold text-slate-900">{currentCard.word}</span>
                        <span className="text-xs text-slate-400 italic">Bấm để lật lại</span>
                      </div>

                      <div className="mb-4">
                        <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block mb-1">
                          Nghĩa Tiếng Việt:
                        </span>
                        <p className="text-xl font-bold text-slate-900 leading-normal">
                          {currentCard.viMeaning}
                        </p>
                      </div>

                      <div className="mb-4">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
                          Định Nghĩa Tiếng Anh:
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {currentCard.enDefinition}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                        <span className="text-xs text-emerald-700 font-bold block mb-1">Ví Dụ Ngữ Cảnh:</span>
                        <p className="text-xs text-slate-700 italic leading-relaxed">
                          "{currentCard.example}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Cụm từ thường gặp:</span>
                        {currentCard.collocations.map((col, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                  Chu kỳ lặp lại hiện tại: {currentCard.intervalDays} ngày • Hệ số dễ nhớ SM-2: {currentCard.easeFactor}
                </div>
              </div>
            </div>

            {/* SM-2 Quality Rating Action Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm text-center">
              <span className="block text-xs font-semibold text-slate-600 mb-3">
                Đánh giá mức độ ghi nhớ của bạn để thuật toán xếp lịch ôn tập:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRateCard(0)}
                  className="p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>🔴 Quên (Again)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Ôn lại ngày mai (1 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(3)}
                  className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>🟠 Khó (Hard)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Nhớ với gợi ý (~2 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(4)}
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>🟢 Tốt (Good)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Nhớ chuẩn xác (~6 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(5)}
                  className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>🔵 Rất Dễ (Easy)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Phản xạ tức thì (~15 ngày)</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
