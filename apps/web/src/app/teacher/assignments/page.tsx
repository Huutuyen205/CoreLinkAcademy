'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AssignmentItem {
  id: string;
  title: string;
  kind: string;
  dueAt?: string;
  timeLimitMin?: number;
  attemptsAllowed: number;
  publishedAt?: string;
  classes?: { id: string; name: string };
  _count?: { assignment_questions: number; attempts: number };
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create assignment
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('homework');
  const [timeLimitMin, setTimeLimitMin] = useState<number | ''>(30);
  const [dueAt, setDueAt] = useState('');
  const [targetType, setTargetType] = useState<'class' | 'student'>('class');
  const [targetId, setTargetId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchQuestions();
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/v1/assessment/questions?status=approved', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableQuestions(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async () => {
    if (!title.trim() || selectedQuestions.length === 0) {
      alert('Vui lòng nhập tiêu đề bài tập và chọn ít nhất một câu hỏi');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const targets = [
        {
          targetType,
          classId: targetType === 'class' ? targetId || undefined : undefined,
          studentId: targetType === 'student' ? targetId || undefined : undefined,
        },
      ];

      const res = await fetch('/api/v1/assessment/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          kind,
          timeLimitMin: timeLimitMin ? Number(timeLimitMin) : undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          questionIds: selectedQuestions,
          targets,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Tạo và giao bài tập thành công!');
        setShowModal(false);
        setTitle('');
        setSelectedQuestions([]);
        fetchAssignments();
      } else {
        alert(data.message || 'Lỗi giao bài tập');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">
                Màn hình S31 — Giao bài tập
              </span>
              <span className="text-xs text-slate-500">Giai đoạn 1</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý bài tập & Đề thi</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Giao bài cho cả lớp, nhóm học tập hoặc học sinh cá nhân; thiết lập hạn nộp và thời gian làm bài.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition"
          >
            + Giao bài tập mới
          </button>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải danh sách bài tập...</div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Chưa có bài tập nào được tạo.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 uppercase">
                        {asg.kind}
                      </span>
                      {asg.classes && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                          {asg.classes.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {asg._count?.assignment_questions ?? 0} câu hỏi
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900">{asg.title}</h2>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {asg.dueAt && <span>Hạn: {new Date(asg.dueAt).toLocaleString('vi-VN')}</span>}
                      {asg.timeLimitMin && <span>Thời gian: {asg.timeLimitMin} phút</span>}
                      <span>Đã nộp: {asg._count?.attempts ?? 0} lượt</span>
                      {asg.publishedAt ? (
                        <span className="text-emerald-600 font-bold">✓ Đã công bố kết quả</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">● Chưa công bố</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/teacher/grading?assignmentId=${asg.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Chấm bài & Công bố
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Giao bài */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900">Thiết lập bài tập & đề thi mới</h3>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700">Tiêu đề bài thi / bài tập:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bài kiểm tra 15 phút Unit 3 - Reading & Vocabulary"
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Loại bài:</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="homework">Bài tập về nhà</option>
                    <option value="practice">Luyện tập tự do</option>
                    <option value="test">Bài kiểm tra chính thức</option>
                    <option value="placement">Đánh giá xếp lớp</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Thời gian làm (phút):</label>
                  <input
                    type="number"
                    value={timeLimitMin}
                    onChange={(e) => setTimeLimitMin(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="VD: 30"
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hạn nộp bài:</label>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đối tượng giao:</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="class">Cả lớp</option>
                    <option value="student">Cá nhân học sinh</option>
                  </select>
                </div>
              </div>

              {/* Question Selection Palette */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    Chọn câu hỏi ({selectedQuestions.length} đã chọn):
                  </span>
                  <span className="text-slate-400">Chỉ câu hỏi đã được phê duyệt</span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
                  {availableQuestions.map((q) => {
                    const isSelected = selectedQuestions.includes(q.id);
                    return (
                      <label key={q.id} className="flex items-start gap-2 pt-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedQuestions((prev) => prev.filter((id) => id !== q.id));
                            } else {
                              setSelectedQuestions((prev) => [...prev, q.id]);
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-800">[{q.type}] </span>
                          <span className="text-slate-600 line-clamp-1">{q.stem}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateAssignment}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Xác nhận giao bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
