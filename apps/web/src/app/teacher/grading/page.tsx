'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GradingContent() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`/api/v1/assessment/assignments/${assignmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAssignment(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn công bố kết quả bài thi này cho toàn lớp?')) return;
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/assessment/assignments/${assignmentId}/publish`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        alert('Đã công bố kết quả thành công! Học sinh và phụ huynh đã có thể xem điểm và đáp án.');
        fetchAssignment();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">
                Màn hình S32 — Chấm bài & Công bố
              </span>
              <span className="text-xs text-slate-500">Giai đoạn 1</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Chấm bài thi & Xử lý phúc khảo</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Chấm điểm câu hỏi tự luận theo rubric, ghi nhận xét và công bố điểm cho học sinh.
            </p>
          </div>

          {assignment && (
            <div className="flex items-center gap-3">
              {assignment.isPublished ? (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200">
                  ✓ Đã công bố kết quả
                </span>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition"
                >
                  {publishing ? 'Đang công bố...' : 'Công bố kết quả toàn lớp'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Assignment Info Card */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu bài thi...</div>
        ) : !assignmentId ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            Vui lòng chọn bài tập từ màn hình S31 để tiến hành chấm bài.
          </div>
        ) : assignment ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase">Đề thi</span>
              <h2 className="text-xl font-bold text-slate-900">{assignment.title}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t">
                <span>Số câu hỏi: {assignment.questions?.length ?? 0}</span>
                <span>Thời gian: {assignment.timeLimitMin ?? 'Không giới hạn'} phút</span>
                <span>Hạn nộp: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString('vi-VN') : 'Không có'}</span>
              </div>
            </div>

            {/* Rubric and Questions review */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Danh sách câu hỏi & Thang điểm</h3>
              <div className="space-y-3">
                {assignment.questions?.map((aq: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Câu {idx + 1} - [{aq.question.type}]</span>
                      <span className="font-semibold text-indigo-600">{aq.points} điểm</span>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">{aq.question.stem}</p>
                    {aq.question.answerKey && (
                      <div className="text-xs text-emerald-800 font-medium">
                        Đáp án chuẩn: {JSON.stringify(aq.question.answerKey)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TeacherGradingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
      <GradingContent />
    </Suspense>
  );
}
