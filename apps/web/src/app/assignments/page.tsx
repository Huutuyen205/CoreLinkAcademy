'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AssignmentItem {
  id: string;
  title: string;
  kind: string;
  instructions?: string;
  dueAt?: string;
  timeLimitMin?: number;
  attemptsAllowed: number;
  publishedAt?: string;
  isPublished?: boolean;
  classes?: { id: string; name: string; code: string };
  _count?: { assignment_questions: number; attempts: number };
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'todo' | 'submitted' | 'graded'>('todo');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/v1/assessment/assignments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error('Lỗi tải bài tập:', err);
    } finally {
      setLoading(false);
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'homework':
        return { label: 'Bài về nhà', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'test':
        return { label: 'Kiểm tra', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'practice':
        return { label: 'Luyện tập', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'placement':
        return { label: 'Xếp lớp', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Đánh giá', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const filterAssignments = () => {
    if (activeTab === 'todo') {
      return assignments.filter((a) => !a.publishedAt);
    }
    if (activeTab === 'graded') {
      return assignments.filter((a) => !!a.publishedAt);
    }
    return assignments;
  };

  const filtered = filterAssignments();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                Màn hình S13
              </span>
              <span className="text-xs text-slate-500">Giai đoạn 1</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Bài tập & Đề thi của tôi</h1>
            <p className="text-sm text-slate-600 mt-1">
              Theo dõi danh sách bài tập được giao, làm bài trực tuyến và xem kết quả chấm điểm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAssignments}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('todo')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'todo'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Cần làm ({assignments.filter((a) => !a.publishedAt).length})
          </button>
          <button
            onClick={() => setActiveTab('graded')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'graded'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Đã công bố ({assignments.filter((a) => !!a.publishedAt).length})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'submitted'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Tất cả ({assignments.length})
          </button>
        </div>

        {/* Assignment Cards List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Đang tải danh sách bài tập...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
            Không có bài tập nào trong mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((asg) => {
              const kind = getKindLabel(asg.kind);
              const isDueSoon =
                asg.dueAt &&
                new Date(asg.dueAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 &&
                new Date(asg.dueAt).getTime() > Date.now();

              return (
                <div
                  key={asg.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${kind.bg}`}
                      >
                        {kind.label}
                      </span>
                      {asg.classes?.name && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {asg.classes.name}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 line-clamp-2">{asg.title}</h2>

                    {asg.instructions && (
                      <p className="text-xs text-slate-600 line-clamp-2">{asg.instructions}</p>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {asg.dueAt && (
                        <div className="flex justify-between">
                          <span>Hạn nộp:</span>
                          <span className={isDueSoon ? 'font-bold text-amber-600' : 'font-medium'}>
                            {new Date(asg.dueAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {asg.timeLimitMin && (
                        <div className="flex justify-between">
                          <span>Thời gian:</span>
                          <span className="font-medium">{asg.timeLimitMin} phút</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Số lần cho phép:</span>
                        <span className="font-medium">{asg.attemptsAllowed} lần</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    {asg.publishedAt ? (
                      <Link
                        href={`/assignments/${asg.id}/results`}
                        className="w-full text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
                      >
                        Xem kết quả & Đáp án
                      </Link>
                    ) : (
                      <Link
                        href={`/assignments/${asg.id}/take`}
                        className="w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
                      >
                        Vào làm bài
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
