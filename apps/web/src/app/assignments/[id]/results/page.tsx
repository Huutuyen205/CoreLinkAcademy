'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface AttemptResultData {
  attemptId: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName?: string;
  startedAt: string;
  submittedAt?: string;
  submitMode?: string;
  isPublished: boolean;
  finalScore?: number;
  maxScore?: number;
  teacherFeedback?: string;
  answers: Array<{
    id: string;
    questionId: string;
    stem: string;
    type: string;
    options?: any;
    response?: any;
    answerKey?: any;
    explanation?: string;
    isCorrect?: boolean;
    pointsEarned?: number;
  }>;
  regradeRequest?: {
    id: string;
    reason: string;
    status: string;
    oldScore?: number;
    newScore?: number;
    response?: string;
    createdAt: string;
  };
  isReadOnly?: boolean;
}

export default function AssignmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  const [result, setResult] = useState<AttemptResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegradeModal, setShowRegradeModal] = useState(false);
  const [regradeReason, setRegradeReason] = useState('');
  const [submittingRegrade, setSubmittingRegrade] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [assignmentId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

      // Tìm attempt gần nhất của assignment này
      const asgRes = await fetch(`/api/v1/assessment/assignments/${assignmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!asgRes.ok) throw new Error('Không tìm thấy bài làm');

      // Ở đây ta có thể lấy attemptId từ assignment attempts hoặc API
      // Giả sử có endpoint GET /assessment/assignments/:id/my-attempt
      // Nếu chưa có, ta lấy trực tiếp qua endpoint results
      const res = await fetch(`/api/v1/assessment/assignments/${assignmentId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const attempt = await res.json();
        const detailRes = await fetch(`/api/v1/assessment/attempts/${attempt.id}/results`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (detailRes.ok) {
          const data = await detailRes.json();
          setResult(data);
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải kết quả:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegrade = async () => {
    if (!result?.attemptId || !regradeReason.trim()) {
      alert('Vui lòng nhập lý do giải trình yêu cầu phúc khảo');
      return;
    }

    setSubmittingRegrade(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/assessment/attempts/${result.attemptId}/regrade-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reason: regradeReason.trim() }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        alert('Đã gửi yêu cầu chấm lại thành công. Giáo viên sẽ xử lý trong vòng 3 ngày làm việc.');
        setShowRegradeModal(false);
        fetchResults();
      } else {
        alert(data.message || 'Lỗi gửi yêu cầu chấm lại');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi yêu cầu');
    } finally {
      setSubmittingRegrade(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-600 font-medium animate-pulse">Đang tải kết quả bài làm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
              Màn hình S15 — Kết quả & Phúc khảo
            </span>
            <Link
              href="/assignments"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              ← Quay lại danh sách bài tập
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{result?.assignmentTitle}</h1>

          {/* Score & Publication Status Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                {result?.isPublished ? 'KẾT QUẢ ĐÃ CÔNG BỐ' : 'ĐANG CHỜ CÔNG BỐ CHÍNH THỨC'}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {result?.finalScore !== undefined ? (
                  <>
                    <span className="text-4xl font-extrabold text-indigo-600">
                      {result.finalScore}
                    </span>
                    <span className="text-slate-500 font-medium">/ {result?.maxScore ?? 10} điểm</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-600">
                    Điểm số sẽ hiển thị sau khi giáo viên hoàn tất chấm bài và công bố.
                  </span>
                )}
              </div>
            </div>

            {/* Regrade action */}
            {result?.isPublished && !result.regradeRequest && (
              <button
                onClick={() => setShowRegradeModal(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-semibold border border-indigo-200 rounded-xl text-sm shadow-sm transition"
              >
                Yêu cầu chấm lại (7 ngày)
              </button>
            )}
          </div>

          {/* Regrade Status Card if active */}
          {result?.regradeRequest && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Trạng thái phúc khảo:{' '}
                  {result.regradeRequest.status === 'pending'
                    ? 'Đang chờ giáo viên xử lý (tối đa 3 ngày làm việc)'
                    : result.regradeRequest.status === 'accepted'
                    ? 'Đã chấp nhận cập nhật điểm'
                    : 'Đã từ chối phúc khảo'}
                </span>
                <span className="text-xs text-amber-700">
                  {new Date(result.regradeRequest.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-sm italic">"Lý do: {result.regradeRequest.reason}"</p>
              {result.regradeRequest.response && (
                <p className="text-sm font-medium text-amber-800">
                  Phản hồi từ giáo viên: {result.regradeRequest.response}
                </p>
              )}
            </div>
          )}

          {/* Teacher Overall Feedback */}
          {result?.teacherFeedback && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-600">Nhận xét của giáo viên:</span>
              <p className="text-sm text-slate-800">{result.teacherFeedback}</p>
            </div>
          )}
        </div>

        {/* Detailed Question Answers & Explanations */}
        {result?.isPublished ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Chi tiết bài làm & Lời giải</h2>
            {result.answers.map((ans, idx) => (
              <div
                key={ans.id}
                className={`bg-white rounded-2xl p-6 border shadow-sm space-y-3 ${
                  ans.isCorrect
                    ? 'border-emerald-200'
                    : ans.isCorrect === false
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Câu {idx + 1}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${
                      ans.isCorrect
                        ? 'bg-emerald-50 text-emerald-700'
                        : ans.isCorrect === false
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ans.pointsEarned ?? 0} điểm
                  </span>
                </div>

                <p className="text-sm text-slate-900 font-medium">{ans.stem}</p>

                {/* Student response */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <span className="text-slate-500 font-semibold">Câu trả lời của bạn:</span>
                  <div className="text-slate-800 font-medium">
                    {typeof ans.response === 'object'
                      ? JSON.stringify(ans.response)
                      : String(ans.response || '(Chưa trả lời)')}
                  </div>
                </div>

                {/* Answer key & Explanation */}
                {ans.answerKey && (
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
                    <span className="text-emerald-800 font-semibold">Đáp án chính xác:</span>
                    <div className="text-emerald-900 font-bold">
                      {typeof ans.answerKey === 'object'
                        ? JSON.stringify(ans.answerKey)
                        : String(ans.answerKey)}
                    </div>
                  </div>
                )}

                {ans.explanation && (
                  <div className="text-xs text-slate-600 pt-1">
                    <span className="font-bold">Giải thích:</span> {ans.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <span className="text-3xl">🔒</span>
            <h3 className="text-base font-bold text-slate-800">Đáp án chi tiết đang được bảo mật</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Theo quy định học vụ (TC-085), đáp án và thang điểm chi tiết chỉ được mở sau khi giáo
              viên hoàn tất chấm bài và công bố kết quả toàn lớp.
            </p>
          </div>
        )}

        {/* Modal Yêu cầu chấm lại */}
        {showRegradeModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Yêu cầu chấm lại bài làm</h3>
              <p className="text-xs text-slate-500">
                Lưu ý: Mỗi bài thi chỉ được yêu cầu chấm lại 1 lần duy nhất trong vòng 7 ngày kể từ
                khi công bố kết quả (FR-609).
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Lý do giải trình:</label>
                <textarea
                  rows={4}
                  value={regradeReason}
                  onChange={(e) => setRegradeReason(e.target.value)}
                  placeholder="Nêu rõ câu hỏi cần xem xét lại và lý do giải trình..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegradeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submittingRegrade || !regradeReason.trim()}
                  onClick={handleSendRegrade}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
                >
                  {submittingRegrade ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
