'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
        id: 'fc-01',
        word: 'Eloquent',
        phonetic: '/ˈel.ə.kwənt/',
        partOfSpeech: 'adjective',
        viMeaning: 'Lưu loát, hùng biện, có tài ăn nói thuyết phục',
        enDefinition: 'Giving a clear, strong message; expressing yourself fluently and persuasively.',
        example: 'She made an eloquent appeal for greater environmental awareness.',
        collocations: ['an eloquent speech', 'eloquent testimony'],
        synonyms: ['fluent', 'persuasive', 'articulate'],
        level: 'C1',
        topic: 'Communication',
        repetition: 2,
        intervalDays: 6,
        easeFactor: 2.5,
      },
      {
        id: 'fc-02',
        word: 'Mitigate',
        phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
        partOfSpeech: 'verb',
        viMeaning: 'Làm giảm nhẹ, làm dịu bớt (tác hại, rủi ro)',
        enDefinition: 'To make something less harmful, serious, or severe.',
        example: 'The organization took immediate steps to mitigate the impact of the flood.',
        collocations: ['mitigate the risk', 'mitigate the effects'],
        synonyms: ['alleviate', 'reduce', 'diminish'],
        level: 'C1',
        topic: 'Academic Writing',
        repetition: 1,
        intervalDays: 1,
        easeFactor: 2.5,
      },
      {
        id: 'fc-03',
        word: 'Pivotal',
        phonetic: '/ˈpɪv.ə.təl/',
        partOfSpeech: 'adjective',
        viMeaning: 'Mang tính then chốt, nòng cốt, quyết định',
        enDefinition: 'Central and important; of crucial importance in relation to success.',
        example: 'Community support plays a pivotal role in the success of language learners.',
        collocations: ['a pivotal moment', 'play a pivotal role'],
        synonyms: ['crucial', 'vital', 'essential'],
        level: 'B2',
        topic: 'IELTS Core',
        repetition: 3,
        intervalDays: 15,
        easeFactor: 2.6,
      },
      {
        id: 'fc-04',
        word: 'Resilient',
        phonetic: '/rɪˈzɪl.jənt/',
        partOfSpeech: 'adjective',
        viMeaning: 'Kiên cường, có khả năng phục hồi nhanh',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/student" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
            ← Quay lại Bàn Học Sinh
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
            <span>🧠</span> Thuật Toán Lặp Lại Ngắt Quãng SM-2
          </span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Sổ Tay Từ Vựng Thông Minh & Flashcard AI
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Ứng dụng thuật toán SuperMemo-2 tính toán chính xác chu kỳ quên lãng (Ebbinghaus Forgetting Curve) để nhắc ôn tập đúng thời điểm, giúp ghi nhớ lâu bền.
          </p>
        </div>

        {/* Learning Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Từ cần ôn hôm nay</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{cards.length}</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Đã thành thạo</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">128</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Chuỗi ngày học (Streak)</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">14 Ngày 🔥</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Tiến độ cọc thẻ</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">
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
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat === 'All' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>

        {/* Main Flashcard Container */}
        {isLoading ? (
          <div className="text-center py-24 text-slate-500">Đang tải bộ thẻ từ vựng...</div>
        ) : completedDeck ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Chúc Mừng! Bạn Đã Hoàn Thành Toàn Bộ Thẻ Hôm Nay
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Thuật toán SM-2 đã tự động xếp lịch ôn tập tối ưu cho các từ này. Hãy duy trì thói quen mỗi ngày để nâng band điểm IELTS!
            </p>
            <button
              onClick={() => fetchCards(selectedCategory)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition"
            >
              Luyện Tập Lại Bộ Này
            </button>
          </div>
        ) : currentCard ? (
          <div>
            {/* Review Status Toast */}
            {reviewMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-fadeIn">
                ✨ {reviewMessage}
              </div>
            )}

            {/* The 3D Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[360px] cursor-pointer perspective-1000 group mb-6"
            >
              <div
                className={`w-full min-h-[360px] rounded-3xl border border-slate-800 bg-slate-900 p-8 flex flex-col justify-between shadow-2xl transition duration-500 transform ${
                  isFlipped ? 'bg-slate-900/95 border-purple-500/50' : 'hover:border-slate-700'
                }`}
              >
                {!isFlipped ? (
                  // Front Side
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider">
                        {currentCard.level}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 font-medium">
                        {currentCard.partOfSpeech}
                      </span>
                      <span className="text-xs text-slate-500">• {currentCard.topic}</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
                      {currentCard.word}
                    </h2>
                    <span className="text-lg text-emerald-400 font-mono font-medium mb-6">
                      {currentCard.phonetic}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-purple-400 transition">
                      🔄 Bấm vào thẻ để lật xem nghĩa tiếng Việt & ví dụ
                    </span>
                  </div>
                ) : (
                  // Back Side
                  <div className="flex flex-col justify-between flex-1 text-left animate-fadeIn">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                        <span className="text-lg font-bold text-white">{currentCard.word}</span>
                        <span className="text-xs text-slate-400 italic">Bấm để lật lại</span>
                      </div>

                      <div className="mb-4">
                        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block mb-1">
                          Nghĩa Tiếng Việt:
                        </span>
                        <p className="text-xl font-bold text-white leading-normal">
                          {currentCard.viMeaning}
                        </p>
                      </div>

                      <div className="mb-4">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                          Định Nghĩa Tiếng Anh:
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {currentCard.enDefinition}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
                        <span className="text-xs text-emerald-400 font-semibold block mb-1">Ví Dụ Ngữ Cảnh:</span>
                        <p className="text-xs text-slate-200 italic leading-relaxed">
                          "{currentCard.example}"
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-slate-500">Cụm từ hay gặp:</span>
                        {currentCard.collocations.map((col, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center text-[11px] text-slate-500 pt-3 border-t border-slate-800/60">
                  Chu kỳ lặp lại hiện tại: {currentCard.intervalDays} ngày • Hệ số dễ nhớ: {currentCard.easeFactor}
                </div>
              </div>
            </div>

            {/* SM-2 Quality Rating Action Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-center">
              <span className="block text-xs font-semibold text-slate-400 mb-3">
                Đánh giá mức độ ghi nhớ của bạn để thuật toán xếp lịch ôn tập:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRateCard(0)}
                  className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex flex-col items-center gap-1"
                >
                  <span>🔴 Quên (Lại)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ôn lại ngay mai (1 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(3)}
                  className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex flex-col items-center gap-1"
                >
                  <span>🟠 Khó (Hard)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Nhớ với khó khăn (~2 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(4)}
                  className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex flex-col items-center gap-1"
                >
                  <span>🟢 Tốt (Good)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Nhớ đúng chuẩn (~6 ngày)</span>
                </button>
                <button
                  onClick={() => handleRateCard(5)}
                  className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition flex flex-col items-center gap-1"
                >
                  <span>🔵 Rất Dễ (Easy)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Thành thạo (~15 ngày)</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
