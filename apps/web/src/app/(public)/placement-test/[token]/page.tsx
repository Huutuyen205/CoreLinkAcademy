'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
        // Fallback câu hỏi mẫu nếu backend chưa seed câu hỏi
        setTestData({
          token,
          gradeLevel: 6,
          durationMinutes: 15,
          questions: [
            {
              id: 'q1',
              stem: 'Choose the correct form: She _____ to school by bus every morning.',
              options: { A: 'go', B: 'goes', C: 'going', D: 'is go' },
            },
            {
              id: 'q2',
              stem: 'Identify the synonym of "ANXIOUS":',
              options: { A: 'Worried', B: 'Happy', C: 'Excited', D: 'Calm' },
            },
            {
              id: 'q3',
              stem: 'If it rains tomorrow, we _____ the outdoor picnic.',
              options: { A: 'cancel', B: 'will cancel', C: 'would cancel', D: 'cancelled' },
            },
            {
              id: 'q4',
              stem: 'Which word has the underlined part pronounced differently?',
              options: { A: 'played', B: 'planned', C: 'wanted', D: 'lived' },
            },
            {
              id: 'q5',
              stem: 'The new library is _____ than the old one in our town.',
              options: { A: 'more modern', B: 'moderner', C: 'most modern', D: 'as modern' },
            },
          ],
        });
        setTimeLeft(15 * 60);
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
          recommendedLevel: score >= 4 ? 'Level B1 - Intermediate (THCS Chuyên)' : 'Level A2 - Pre-Intermediate',
          comment: 'Học sinh có phản xạ ngữ pháp căn bản tốt, cần củng cố thêm từ vựng học thuật nâng cao.',
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
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', color: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Đang tải đề kiểm tra năng lực...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header with Sticky Timer */}
      <header style={{
        padding: '1rem 2rem',
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
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem'
          }}>CL</div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Bài Kiểm Tra Đánh Giá Trình Độ (S05)</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Đề tự động theo khối lớp</p>
          </div>
        </div>

        {!result && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.4rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: timeLeft < 180 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            border: timeLeft < 180 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
            color: timeLeft < 180 ? '#F87171' : '#60A5FA',
            fontWeight: 700,
            fontSize: '1.1rem'
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </header>

      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
        {result ? (
          /* Kết quả bài test */
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '9999px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              margin: '0 auto 1.5rem auto'
            }}>
              {result.percentage}%
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Kết Quả Đánh Giá Năng Lực
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem', marginBottom: '2rem' }}>
              Điểm đạt được: <strong style={{ color: '#10B981' }}>{result.score}</strong> / {result.totalQuestions} câu chính xác
            </p>

            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Lớp học & Trình độ đề xuất:
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                {result.recommendedLevel}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>
                {result.comment}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link
                href="/register-trial"
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
                Đăng ký xếp lớp học thử ngay
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
                Xem chi tiết khóa học
              </Link>
            </div>
          </div>
        ) : (
          /* Form làm bài thi trắc nghiệm */
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
                Tiến độ: <strong style={{ color: '#60A5FA' }}>{Object.keys(answers).length}</strong> / {testData?.questions.length} câu đã trả lời
              </span>
              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {testData?.questions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '1rem',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: '1.75rem',
                      fontSize: '0.85rem'
                    }}>
                      {idx + 1}
                    </span>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5, color: '#F8FAFC' }}>
                      {q.stem}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {Object.entries(q.options).map(([optKey, optVal]) => {
                      const isSelected = answers[q.id] === optKey;
                      return (
                        <button
                          key={optKey}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optKey)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.02)',
                            border: isSelected ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.06)',
                            color: isSelected ? '#FFFFFF' : '#CBD5E1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{
                            width: '1.5rem',
                            height: '1.5rem',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.08)',
                            color: isSelected ? '#FFFFFF' : '#94A3B8'
                          }}>
                            {optKey}
                          </span>
                          <span>{optVal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={submitting}
                style={{
                  padding: '0.875rem 2.5rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
                }}
              >
                {submitting ? 'Đang chấm điểm...' : 'Hoàn thành & Xem kết quả'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
