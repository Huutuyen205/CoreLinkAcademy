'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AssignmentRow {
  id: string;
  title: string;
  kind: string;
  dueAt: string;
  score?: number;
  maxScore?: number;
  status: 'todo' | 'submitted' | 'graded';
  gradedAt?: string;
  teacherFeedback?: string;
  canRegrade?: boolean;
}

export default function ParentAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<'todo' | 'submitted' | 'graded'>('graded');
  const [selectedChild, setSelectedChild] = useState('Lê Minh Khôi (Con A)');

  const assignments: AssignmentRow[] = [
    {
      id: 'asg-1',
      title: 'Kiểm tra giữa kỳ Unit 4: Family & Hobbies',
      kind: 'test',
      dueAt: '18/10/2026',
      score: 8.5,
      maxScore: 10,
      status: 'graded',
      gradedAt: '18/10/2026',
      teacherFeedback: 'Con làm rất tốt phần ngữ pháp và đọc hiểu, cần chú ý thêm thì hiện tại tiếp diễn ở câu 5.',
      canRegrade: true,
    },
    {
      id: 'asg-2',
      title: 'Bài tập về nhà: Writing short paragraph about your best friend',
      kind: 'homework',
      dueAt: '15/10/2026',
      score: 9.0,
      maxScore: 10,
      status: 'graded',
      gradedAt: '16/10/2026',
      teacherFeedback: 'Từ vựng phong phú, sử dụng đúng cấu trúc câu mô tả.',
      canRegrade: false,
    },
    {
      id: 'asg-3',
      title: 'Luyện tập phát âm: Pronunciation drill -ing ending',
      kind: 'practice',
      dueAt: '20/10/2026',
      status: 'todo',
    },
  ];

  const filtered = assignments.filter((a) => a.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/parent" className="text-xs text-blue-600 hover:underline">
                ← Tổng quan của con
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Bài tập & Kết quả học tập</h1>
            <p className="text-slate-500 text-sm">
              Theo dõi chi tiết bài tập cần làm, điểm số và nhận xét từ giáo viên
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <span>👤 Học sinh:</span>
            <span className="text-blue-700">{selectedChild}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('graded')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'graded'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Đã chấm & Kết quả (2)
          </button>
          <button
            onClick={() => setActiveTab('todo')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'todo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Cần hoàn thành (1)
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'submitted'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Đang chấm (0)
          </button>
        </div>

        {/* Assignment Cards List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {item.kind === 'test' ? 'Bài kiểm tra' : item.kind === 'homework' ? 'Bài về nhà' : 'Luyện tập'}
                      </span>
                      <span className="text-xs text-slate-400">Hạn nộp: {item.dueAt}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  </div>

                  {item.status === 'graded' && (
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Điểm số</span>
                        <span className="text-xl font-extrabold text-blue-700">
                          {item.score} <span className="text-xs text-slate-400 font-normal">/ {item.maxScore}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {item.teacherFeedback && (
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs text-slate-700 space-y-1">
                    <span className="font-semibold text-slate-900 block">Nhận xét của giáo viên:</span>
                    <p className="italic leading-relaxed">"{item.teacherFeedback}"</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">
                    {item.gradedAt ? `Công bố ngày ${item.gradedAt}` : 'Chưa nộp bài'}
                  </span>

                  <div className="flex gap-2">
                    <Link
                      href={`/assignments/${item.id}/results`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    >
                      Xem đáp án chi tiết
                    </Link>
                    {item.canRegrade && (
                      <Link
                        href={`/assignments/${item.id}/results?regrade=true`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        Yêu cầu chấm lại
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Không có bài tập nào trong mục này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
