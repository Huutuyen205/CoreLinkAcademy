'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RubricCriterion {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
  quote?: string;
}

export default function AiGradingAssistPage() {
  const [mode, setMode] = useState<'writing' | 'speaking'>('writing');
  const [isBlurry, setIsBlurry] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [teacherScore, setTeacherScore] = useState<number>(8.5);
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    'Bài viết hoàn chỉnh, lập luận sắc bén và cấu trúc liên từ rất tốt. Giáo viên đã điều chỉnh điểm lên 8.5.',
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Mẫu bài viết
  const sampleEssay =
    'In recent years, protecting the environment has become an essential responsibility for everyone. To reduce plastic pollution, governments should encourage recycling programs and ban single-use plastic bags. Furthermore, schools must educate students about conserving energy.';

  const handleRunAiGrading = () => {
    setIsGrading(true);
    setIsConfirmed(false);

    setTimeout(() => {
      if (isBlurry) {
        // TC-093: Ảnh mờ không đọc được
        setGradingResult({
          is_unreadable: true,
          error_code: 'IMAGE_BLURRY_UNREADABLE',
          message:
            'Ảnh chụp bài viết bị mờ hoặc thiếu độ tương phản, không thể nhận dạng ký tự viết tay. Vui lòng chụp lại ảnh rõ nét hơn.',
        });
      } else {
        // TC-092: Bài rõ nét -> OCR và chấm theo rubric
        setGradingResult({
          is_unreadable: false,
          transcript: sampleEssay,
          ai_points: 7.8,
          criteria: [
            {
              name: 'Task Achievement',
              score: 8.0,
              maxScore: 10,
              comment: 'Đạt yêu cầu đề bài, giải pháp bảo vệ môi trường thuyết phục.',
              quote: 'protecting the environment has become an essential responsibility for everyone',
            },
            {
              name: 'Coherence & Cohesion',
              score: 7.5,
              maxScore: 10,
              comment: 'Chuyển ý tự nhiên, sử dụng liên từ mạch lạc.',
              quote: 'Furthermore, schools must educate students about conserving energy',
            },
            {
              name: 'Lexical Resource',
              score: 8.0,
              maxScore: 10,
              comment: 'Từ vựng môi trường phong phú, đúng ngữ cảnh.',
              quote: 'reduce plastic pollution, ban single-use plastic bags',
            },
            {
              name: 'Grammatical Accuracy',
              score: 7.5,
              maxScore: 10,
              comment: 'Cấu trúc câu phong phú, không có lỗi ngữ pháp nghiêm trọng.',
              quote: 'governments should encourage recycling programs and ban single-use plastic bags',
            },
          ],
        });
        setTeacherScore(8.0);
      }
      setIsGrading(false);
    }, 1200);
  };

  const handleConfirmGrade = () => {
    setIsConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Trợ lý AI Giảng viên • FR-607 (TC-092, TC-093)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              AI Trợ Giảng Chấm Bài Tự Động 📝
            </h1>
            <p className="text-purple-100 text-sm mt-1">
              Nhận dạng chữ viết tay & âm thanh • Chấm theo tiêu chí Rubric • Giáo viên xác nhận điểm cuối
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/teacher/grading"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/20 backdrop-blur-sm"
            >
              ← Danh sách bài nộp
            </Link>
            <Link
              href="/teacher/monthly-reports"
              className="px-4 py-2 rounded-xl bg-white text-purple-900 font-bold text-xs transition-all shadow-md"
            >
              Duyệt báo cáo tháng 📊
            </Link>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Submission Info & Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Bài làm của học sinh</h2>
                <p className="text-xs text-slate-500">Học viên: Phạm Minh Châu (Lớp IELTS B1)</p>
              </div>
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <button
                  onClick={() => setMode('writing')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    mode === 'writing' ? 'bg-white shadow-sm text-purple-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  Viết (Writing)
                </button>
                <button
                  onClick={() => setMode('speaking')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    mode === 'speaking' ? 'bg-white shadow-sm text-purple-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  Nói (Speaking)
                </button>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3 text-xs">
              <div className="font-semibold text-purple-900 flex items-center justify-between">
                <span>🧪 Giả lập chất lượng bài nộp:</span>
                <span className="text-[11px] text-purple-700">Kiểm thử TC-093</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blurOption"
                    checked={!isBlurry}
                    onChange={() => setIsBlurry(false)}
                    className="text-purple-600"
                  />
                  <span className="text-slate-700 font-medium">Ảnh rõ nét (TC-092)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blurOption"
                    checked={isBlurry}
                    onChange={() => setIsBlurry(true)}
                    className="text-purple-600"
                  />
                  <span className="text-red-600 font-medium">Ảnh chụp mờ (TC-093)</span>
                </label>
              </div>
            </div>

            {/* Student Submission Display */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">Ảnh bài viết tay học sinh:</span>
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isBlurry
                    ? 'border-red-300 bg-red-50/40 filter blur-[1px]'
                    : 'border-slate-300 bg-slate-50'
                }`}
              >
                <div className="text-3xl mb-2">{isBlurry ? '🌫️' : '📄'}</div>
                <div className="text-xs font-mono text-slate-700 font-medium leading-relaxed">
                  {sampleEssay}
                </div>
                {isBlurry && (
                  <div className="mt-2 text-xs font-bold text-red-600 bg-red-100 py-1 rounded">
                    [MÔ PHỎNG: ẢNH BỊ RUNG & MỜ]
                  </div>
                )}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleRunAiGrading}
              disabled={isGrading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isGrading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI đang phân tích và đối soát Rubric...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Chấm bài bằng AI (Analyze with Gemini)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Grading Results & Teacher Confirmation (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {gradingResult ? (
              gradingResult.is_unreadable ? (
                /* TC-093 Blurry Error Display */
                <div className="bg-red-50 border border-red-300 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-base">
                    <span>⚠️</span>
                    <span>Từ chối chấm bài: Ảnh mờ không thể nhận dạng (TC-093)</span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Hệ thống kiểm tra chất lượng ảnh phát hiện ảnh bài nộp bị mờ hoặc thiếu độ tương phản, không đủ tiêu chuẩn để chạy OCR nhận dạng chữ viết.
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-red-200 text-xs font-mono text-red-900">
                    Mã lỗi: {gradingResult.error_code} • AI Points: NULL (Không đưa điểm giả định)
                  </div>
                  <div className="text-xs text-slate-600">
                    💡 Khuyến nghị: Giáo viên yêu cầu học sinh chụp lại ảnh bài viết hoặc nhập bản gõ trực tiếp.
                  </div>
                </div>
              ) : (
                /* TC-092 Success Grading Display */
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <span>📊</span> Kết quả Chấm điểm AI & Phân tích Rubric
                      </h3>
                      <p className="text-xs text-slate-500">Chuẩn khung IELTS / CEFR Rubric Breakdown</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Điểm AI đề xuất</span>
                      <span className="text-2xl font-black text-purple-700 font-mono">
                        {gradingResult.ai_points} / 10
                      </span>
                    </div>
                  </div>

                  {/* Rubric Criteria Cards */}
                  <div className="space-y-3">
                    {gradingResult.criteria.map((crit: RubricCriterion, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{crit.name}</span>
                          <span className="text-purple-700 font-mono">{crit.score} / {crit.maxScore}</span>
                        </div>
                        <p className="text-slate-600">{crit.comment}</p>
                        {crit.quote && (
                          <div className="mt-1 p-2 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 font-mono text-[11px]">
                            <span className="font-semibold text-purple-700">Trích dẫn bài làm: </span>
                            "{crit.quote}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Teacher Adjustment & Confirmation Box */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="font-bold text-purple-900 text-sm flex items-center justify-between">
                      <span>✏️ Giáo viên xác nhận & Chốt điểm cuối cùng:</span>
                      {isConfirmed && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          ✓ Đã chốt điểm chính thức
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Điểm chính thức (0-10):</label>
                        <input
                          type="number"
                          step="0.1"
                          max="10"
                          min="0"
                          value={teacherScore}
                          onChange={(e) => setTeacherScore(Number(e.target.value))}
                          disabled={isConfirmed}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono text-purple-800 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-slate-600 font-semibold block mb-1">Nhận xét của giáo viên:</label>
                        <input
                          type="text"
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          disabled={isConfirmed}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    {!isConfirmed && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleConfirmGrade}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md"
                        >
                          Xác nhận & Lưu điểm cuối cùng
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-2">
                <div className="text-4xl">🤖</div>
                <h3 className="font-bold text-slate-800 text-base">Sẵn sàng chấm điểm</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Bấm nút "Chấm bài bằng AI" ở khung bên trái để trợ lý AI bắt đầu nhận dạng và đối soát theo tiêu chuẩn Rubric.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
