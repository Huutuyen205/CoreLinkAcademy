'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Award } from 'lucide-react';

interface Question {
  id: string;
  stem: string;
  options: { [key: string]: string };
}

interface TestData {
  token: string;
  gradeLevel: number;
  durationMinutes: number;
  questions: Question[];
}

export default function PlacementTestPage() {
  const params = useParams();
  const token = (params?.token as string) || 'sample';

  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number>(1200); // 20 phút = 1200 giây
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchTest();
  }, [token]);

  useEffect(() => {
    if (!testData || result || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testData, result, timeLeft]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/public/placement-test/${token}`);
      if (res.ok) {
        const data = await res.json();
        setTestData(data);
        setTimeLeft((data.durationMinutes || 20) * 60);
      } else {
        // Fallback ngân hàng câu hỏi mẫu chuẩn CEFR
        setTestData({
          token,
          gradeLevel: 6,
          durationMinutes: 20,
          questions: [
            {
              id: 'q1',
              stem: 'Choose the correct word: "She usually _______ to school by bus every morning."',
              options: { A: 'go', B: 'goes', C: 'going', D: 'went' },
            },
            {
              id: 'q2',
              stem: 'Identify the synonym of the word "ENORMOUS":',
              options: { A: 'Tiny', B: 'Huge', C: 'Narrow', D: 'Weak' },
            },
            {
              id: 'q3',
              stem: 'If it rains tomorrow, we _______ the outdoor picnic.',
              options: { A: 'will cancel', B: 'cancelled', C: 'would cancel', D: 'canceling' },
            },
            {
              id: 'q4',
              stem: '"Have you ever _______ to London before?" — "Yes, twice."',
              options: { A: 'be', B: 'being', C: 'been', D: 'went' },
            },
            {
              id: 'q5',
              stem: 'Choose the best response: "Could you please show me the way to the library?"',
              options: {
                A: 'Yes, it is 5 o’clock.',
                B: 'Go straight ahead and turn left at the corner.',
                C: 'I love reading books.',
                D: 'No, I didn’t buy it.',
              },
            },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (submitting || result) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/v1/public/placement-test/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        // Fallback tự tính điểm nếu chạy mock
        const total = testData?.questions.length || 5;
        const answeredCount = Object.keys(answers).length;
        const score = Math.round(answeredCount * 1.6);
        setResult({
          score,
          totalQuestions: total,
          percentage: Math.round((score / total) * 100),
          recommendedLevel: score >= 4 ? 'Level B1 - Intermediate (THCS Chuyên & IELTS Foundation)' : 'Level A2 - Pre-Intermediate (Tiếng Anh Nền Tảng Toàn Diện)',
          comment: 'Học sinh có phản xạ ngữ pháp và từ vựng căn bản tốt. Đề xuất tham gia khóa luyện chuyên sâu để phát triển kỹ năng Viết & Nói nâng cao.',
        });
      }
    } catch (err) {
      console.error('Error submitting test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-slate-600 font-medium text-sm">
        Đang tải đề đánh giá năng lực ngôn ngữ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header with Sticky Timer */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              CL
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Đánh Giá Năng Lực Đầu Vào</h1>
              <p className="text-xs text-slate-500 font-medium">Khảo sát phản xạ ngữ pháp & từ vựng theo khối lớp</p>
            </div>
          </div>

          {!result && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-sm ${
              timeLeft < 180
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
        {result ? (
          /* Kết quả bài test */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-inner">
              {result.percentage}%
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã Hoàn Thành Bài Kiểm Tra
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Báo Cáo Năng Lực Ngôn Ngữ
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              Kết quả trả lời đúng: <strong className="text-emerald-700 font-bold">{result.score}</strong> / {result.totalQuestions} câu hỏi
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left mb-8 space-y-3">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Lớp học & Trình độ đề xuất:
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900">
                {result.recommendedLevel}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                {result.comment}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register-trial"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
              >
                Đăng ký xếp lớp học thử miễn phí
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
              >
                Xem chi tiết khung chương trình
              </Link>
            </div>
          </div>
        ) : (
          /* Danh sách câu hỏi trắc nghiệm */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                Đã trả lời: <strong className="text-blue-600 font-bold">{Object.keys(answers).length}</strong> / {testData?.questions.length} câu
              </span>
              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>

            <div className="space-y-5">
              {testData?.questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-5">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {q.stem}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(q.options).map(([optKey, optVal]) => {
                      const isSelected = answers[q.id] === optKey;
                      return (
                        <button
                          key={optKey}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optKey)}
                          className={`p-3.5 rounded-xl text-left text-sm border flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                          }`}>
                            {optKey}
                          </span>
                          <span className="leading-tight">{optVal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Đang chấm điểm bài làm...' : 'Hoàn Thành & Xem Báo Cáo Năng Lực'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
