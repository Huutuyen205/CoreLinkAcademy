'use client';

import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  type: string;
  stem: string;
  skill: string;
  difficulty: number;
  framework: string;
  levelCode: string;
  topic?: string;
  points: number;
  isAi: boolean;
  status: string;
}

export default function TeacherQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (TC-076)
  const [filterSkill, setFilterSkill] = useState('');
  const [filterFramework, setFilterFramework] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newType, setNewType] = useState('single_choice');
  const [newStem, setNewStem] = useState('');
  const [newSkill, setNewSkill] = useState('reading');
  const [newDifficulty, setNewDifficulty] = useState(2);
  const [newFramework, setNewFramework] = useState('CEFR');
  const [newLevel, setNewLevel] = useState('A2');
  const [newAnswerKey, setNewAnswerKey] = useState('A');
  const [newExplanation, setNewExplanation] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [filterSkill, filterFramework, filterLevel, filterDifficulty, filterStatus]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const params = new URLSearchParams();
      if (filterSkill) params.append('skill', filterSkill);
      if (filterFramework) params.append('framework', filterFramework);
      if (filterLevel) params.append('levelCode', filterLevel);
      if (filterDifficulty) params.append('difficulty', filterDifficulty);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`/api/v1/assessment/questions?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.items || []);
      }
    } catch (err) {
      console.error('Lỗi tải câu hỏi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/assessment/questions/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Lỗi không thể xóa câu hỏi');
      } else {
        alert('Đã xóa câu hỏi');
        fetchQuestions();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/assessment/questions/${id}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        alert('Đã phê duyệt câu hỏi AI thành công');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newStem.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/assessment/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: newType,
          stem: newStem.trim(),
          skill: newSkill,
          difficulty: Number(newDifficulty),
          framework: newFramework,
          levelCode: newLevel,
          answerKey: { correct: newAnswerKey },
          explanation: newExplanation,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewStem('');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
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
                Màn hình S30 — Quản lý & Tạo đề
              </span>
              <span className="text-xs text-slate-500">Giai đoạn 1</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Ngân hàng câu hỏi</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Phân loại 9 dạng câu hỏi, gắn nhãn kỹ năng, khung chuẩn và duyệt câu hỏi AI.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition"
          >
            + Thêm câu hỏi mới
          </button>
        </div>

        {/* Filters Toolbar (TC-076) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Kỹ năng:</label>
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Tất cả kỹ năng</option>
              <option value="listening">Listening (Nghe)</option>
              <option value="reading">Reading (Đọc)</option>
              <option value="writing">Writing (Viết)</option>
              <option value="grammar">Grammar (Ngữ pháp)</option>
              <option value="vocabulary">Vocabulary (Từ vựng)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Khung chuẩn:</label>
            <select
              value={filterFramework}
              onChange={(e) => setFilterFramework(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Tất cả khung</option>
              <option value="CEFR">CEFR</option>
              <option value="YLE">Cambridge YLE</option>
              <option value="IELTS">IELTS</option>
              <option value="GDPT2018">GDPT 2018</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Cấp độ:</label>
            <input
              type="text"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              placeholder="VD: A2, B1, 6.5..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Độ khó (1-5):</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Tất cả độ khó</option>
              <option value="1">1 - Rất dễ</option>
              <option value="2">2 - Dễ</option>
              <option value="3">3 - Trung bình</option>
              <option value="4">4 - Khó</option>
              <option value="5">5 - Rất khó</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Tất cả</option>
              <option value="approved">Đã duyệt</option>
              <option value="draft">Bản nháp (AI)</option>
            </select>
          </div>
        </div>

        {/* Question Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải danh sách câu hỏi...</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Không tìm thấy câu hỏi phù hợp với bộ lọc.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div key={q.id} className="p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1.5 flex-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                        {q.skill}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
                        {q.framework} - {q.levelCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800">
                        Độ khó: {q.difficulty}/5
                      </span>
                      {q.isAi && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                          AI sinh
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          q.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {q.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{q.stem}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(q.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Phê duyệt
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Create Question */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900">Thêm câu hỏi mới vào ngân hàng</h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dạng câu hỏi:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="multi_choice">Trắc nghiệm nhiều đáp án</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="fill_blank">Điền khuyết</option>
                    <option value="matching">Nối cặp</option>
                    <option value="ordering">Sắp xếp</option>
                    <option value="listening">Nghe</option>
                    <option value="essay">Tự luận</option>
                    <option value="file_upload">Nộp file</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kỹ năng:</label>
                  <select
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                    <option value="grammar">Grammar</option>
                    <option value="vocabulary">Vocabulary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nội dung câu hỏi (Stem):</label>
                <textarea
                  rows={3}
                  value={newStem}
                  onChange={(e) => setNewStem(e.target.value)}
                  placeholder="Nhập câu hỏi tại đây..."
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Khung:</label>
                  <select
                    value={newFramework}
                    onChange={(e) => setNewFramework(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="CEFR">CEFR</option>
                    <option value="YLE">Cambridge YLE</option>
                    <option value="IELTS">IELTS</option>
                    <option value="GDPT2018">GDPT 2018</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cấp độ:</label>
                  <input
                    type="text"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Độ khó (1-5):</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Đáp án đúng (Answer Key):</label>
                <input
                  type="text"
                  value={newAnswerKey}
                  onChange={(e) => setNewAnswerKey(e.target.value)}
                  placeholder="VD: A hoặc True..."
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Giải thích lời giải:</label>
                <textarea
                  rows={2}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Giải thích vì sao chọn đáp án này..."
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Lưu vào ngân hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
