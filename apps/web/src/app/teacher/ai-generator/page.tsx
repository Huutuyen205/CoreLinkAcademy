'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AiQuestion {
  id: string;
  topic: string;
  skill: string;
  framework: string;
  difficulty: number;
  stem: string;
  options: { id: string; text: string }[];
  answerKey: string;
  explanation: string;
  status: 'draft' | 'approved';
  approvedBy?: string;
  createdAt: string;
}

export default function TeacherAiGeneratorPage() {
  const [topic, setTopic] = useState('Present Perfect vs Past Simple');
  const [skill, setSkill] = useState('grammar');
  const [framework, setFramework] = useState('CEFR');
  const [difficulty, setDifficulty] = useState(3);
  const [count, setCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'draft' | 'approved'>('all');

  const [questions, setQuestions] = useState<AiQuestion[]>([
    {
      id: 'ai-q-101',
      topic: 'Present Perfect Tense',
      skill: 'grammar',
      framework: 'CEFR',
      difficulty: 3,
      stem: '[AI Generated] Câu hỏi ôn tập chủ đề Present Perfect Tense #1: Choose the correct sentence to complete the conversation.',
      options: [
        { id: 'A', text: 'I have seen that movie yesterday afternoon.' },
        { id: 'B', text: 'I have already seen that movie twice.' },
        { id: 'C', text: 'I see that movie since two years.' },
        { id: 'D', text: 'I had see that movie last week.' },
      ],
      answerKey: 'B',
      explanation:
        'Phương án B chính xác vì sử dụng thì Hiện tại hoàn thành với trạng từ "already" để chỉ trải nghiệm đã từng xảy ra. Phương án A sai vì có mốc thời gian quá khứ xác định ("yesterday").',
      status: 'draft', // TC-091: Mặc định chờ duyệt
      createdAt: '10 phút trước',
    },
    {
      id: 'ai-q-102',
      topic: 'Travel Vocabulary & Phrasal Verbs',
      skill: 'vocabulary',
      framework: 'CEFR',
      difficulty: 2,
      stem: '[AI Generated] Choose the word that best fits: "We need to ______ early in the morning to avoid the heavy traffic."',
      options: [
        { id: 'A', text: 'set out' },
        { id: 'B', text: 'check off' },
        { id: 'C', text: 'bring about' },
        { id: 'D', text: 'turn down' },
      ],
      answerKey: 'A',
      explanation:
        'Phrasal verb "set out" (hoặc "set off") có nghĩa là khởi hành chuyến đi. Các từ còn lại không phù hợp ngữ cảnh giao thông.',
      status: 'approved',
      approvedBy: 'Thầy Hoàng Nam (TCH-01)',
      createdAt: '1 giờ trước',
    },
  ]);

  const handleGenerateQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newItems: AiQuestion[] = Array.from({ length: count }).map((_, idx) => ({
        id: `ai-gen-${Date.now()}-${idx + 1}`,
        topic,
        skill,
        framework,
        difficulty,
        stem: `[AI Generated] Câu hỏi ôn tập chủ đề ${topic} #${idx + 1}: Which option correctly completes the sentence context?`,
        options: [
          { id: 'A', text: `Phương án A cho ${topic}` },
          { id: 'B', text: `Phương án B (Đáp án chính xác nhất)` },
          { id: 'C', text: `Phương án C` },
          { id: 'D', text: `Phương án D` },
        ],
        answerKey: 'B',
        explanation: `Giải thích chi tiết cấu trúc ngữ pháp và từ vựng cho chủ đề "${topic}". Phương án B là đáp án chính xác theo chuẩn ${framework}.`,
        status: 'draft', // TC-091: Mặc định draft, giáo viên phải duyệt
        createdAt: 'Vừa xong',
      }));

      setQuestions((prev) => [...newItems, ...prev]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleApproveQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'approved',
              approvedBy: 'Thầy Hoàng Nam (Giáo viên phụ trách)',
            }
          : q,
      ),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterTab === 'draft') return q.status === 'draft';
    if (filterTab === 'approved') return q.status === 'approved';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Công cụ Giảng viên • FR-604 (TC-091)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              AI Sinh Đề & Hàng Đợi Phê Duyệt 🪄
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Tự động tạo câu hỏi trắc nghiệm, bài nói, giải thích chi tiết • Duyệt vào ngân hàng câu hỏi
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/teacher/questions"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/20 backdrop-blur-sm"
            >
              Ngân hàng câu hỏi 📚
            </Link>
            <Link
              href="/teacher/assignments"
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs transition-all shadow-md"
            >
              Giao bài cho lớp ✍️
            </Link>
          </div>
        </div>

        {/* Generator Form & Queue Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Generator Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>✨</span> Thiết lập thông số AI
            </h2>

            <form onSubmit={handleGenerateQuestions} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chủ đề bài học (Topic):</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Passive Voice, Family, IELTS Task 1..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kỹ năng:</label>
                  <select
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="grammar">Ngữ pháp (Grammar)</option>
                    <option value="vocabulary">Từ vựng (Vocabulary)</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="speaking">Nói (Speaking)</option>
                    <option value="listening">Nghe (Listening)</option>
                    <option value="writing">Viết (Writing)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Khung đánh giá:</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CEFR">CEFR</option>
                    <option value="YLE">Cambridge YLE</option>
                    <option value="GDPT2018">GDPT 2018</option>
                    <option value="IELTS">IELTS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Độ khó (Tier 1-5):
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>Cấp 1 (A1 - Dễ)</option>
                    <option value={2}>Cấp 2 (A2 - Cơ bản)</option>
                    <option value={3}>Cấp 3 (B1 - Trung cấp)</option>
                    <option value={4}>Cấp 4 (B2 - Khá)</option>
                    <option value={5}>Cấp 5 (C1 - Nâng cao)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số lượng câu:</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1 câu</option>
                    <option value={2}>2 câu</option>
                    <option value={3}>3 câu</option>
                    <option value={5}>5 câu</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI đang soạn thảo đề thi...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Sinh câu hỏi bằng AI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 leading-relaxed text-[11px]">
                <span className="font-bold">⚠️ Quy định kiểm duyệt (TC-091):</span> Mọi câu hỏi do AI tạo ra mặc định ở trạng thái <span className="font-semibold">Chờ duyệt (draft)</span>. Giáo viên phải kiểm tra nội dung và bấm duyệt trước khi đưa vào bài tập giao cho học sinh.
              </div>
            </form>
          </div>

          {/* Question List & Approval Queue (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center justify-between text-xs">
              <div className="flex gap-1">
                {(['all', 'draft', 'approved'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                      filterTab === tab
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'all' && `Tất cả (${questions.length})`}
                    {tab === 'draft' &&
                      `Chờ duyệt (${questions.filter((q) => q.status === 'draft').length})`}
                    {tab === 'approved' &&
                      `Đã duyệt (${questions.filter((q) => q.status === 'approved').length})`}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 pr-2">Hiển thị {filteredQuestions.length} câu hỏi</span>
            </div>

            {/* Questions list */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  Không có câu hỏi nào trong danh mục này.
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all space-y-3 ${
                      q.status === 'draft' ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            q.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {q.status === 'draft' ? '⏳ Chờ duyệt (Draft)' : '✅ Đã duyệt vào ngân hàng'}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{q.topic}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 uppercase">{q.framework} Cấp {q.difficulty}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{q.createdAt}</span>
                    </div>

                    {/* Question Stem */}
                    <div className="font-semibold text-slate-800 text-sm">{q.stem}</div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            opt.id === q.answerKey
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                              opt.id === q.answerKey
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-700 block mb-0.5">💡 Lời giải thích từ AI:</span>
                      {q.explanation}
                    </div>

                    {/* Actions bar */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <div className="text-slate-500 text-[11px]">
                        {q.approvedBy ? (
                          <span className="text-emerald-700 font-medium">Người duyệt: {q.approvedBy}</span>
                        ) : (
                          <span className="text-amber-700">Chưa được duyệt (Không thể giao bài)</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {q.status === 'draft' ? (
                          <button
                            onClick={() => handleApproveQuestion(q.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <span>✓</span>
                            <span>Duyệt câu hỏi này</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
                          >
                            Đã thêm vào ngân hàng
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 transition-all"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
