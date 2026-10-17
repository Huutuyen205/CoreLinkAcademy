'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StandardItem {
  code: string;
  framework: string;
  levelCode: string;
  skill: string;
  description: string;
  status: 'covered' | 'missing' | 'partially_covered';
  matchedLesson?: string;
}

interface SuggestionItem {
  id: string;
  targetUnit: string;
  proposedTitle: string;
  nodeType: 'objective' | 'lesson';
  standardCode: string;
  skill: string;
  cefrLevel: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  isAi: boolean;
  version: number;
}

export default function CurriculumSuggestionsPage() {
  const [selectedFramework, setSelectedFramework] = useState<'CEFR' | 'GDPT2018'>('CEFR');
  const [isScanning, setIsScanning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  // Chuẩn đầu ra chuẩn hóa (Standards Framework)
  const [standards, setStandards] = useState<StandardItem[]>([
    {
      code: 'CEFR-A2-S1',
      framework: 'CEFR',
      levelCode: 'A2',
      skill: 'Speaking',
      description: 'Miêu tả được các thành viên gia đình và cảm xúc cá nhân bằng câu đơn giản',
      status: 'covered',
      matchedLesson: 'Unit 1 Lesson 1.1: Describing People',
    },
    {
      code: 'CEFR-A2-W1',
      framework: 'CEFR',
      levelCode: 'A2',
      skill: 'Writing',
      description: 'Viết được đoạn văn ngắn (40-50 từ) về thói quen sinh hoạt hàng ngày',
      status: 'missing',
    },
    {
      code: 'CEFR-A2-L2',
      framework: 'CEFR',
      levelCode: 'A2',
      skill: 'Listening',
      description: 'Nghe hiểu được chỉ dẫn thời gian và địa điểm sinh hoạt gia đình trong đoạn hội thoại',
      status: 'missing',
    },
    {
      code: 'CEFR-A2-R1',
      framework: 'CEFR',
      levelCode: 'A2',
      skill: 'Reading',
      description: 'Đọc hiểu mẩu thông báo ngắn và tờ rơi về sự kiện cộng đồng',
      status: 'covered',
      matchedLesson: 'Unit 2 Lesson 2.1: Extreme Sports & Community Events',
    },
    {
      code: 'GDPT-THCS-01',
      framework: 'GDPT2018',
      levelCode: 'Grade 7',
      skill: 'Grammar',
      description: 'Vận dụng chuẩn xác thì Hiện tại đơn và Hiện tại tiếp diễn trong giao tiếp thực tế',
      status: 'covered',
      matchedLesson: 'Unit 1 Lesson 1.2: Present Simple for Routines',
    },
    {
      code: 'GDPT-THCS-02',
      framework: 'GDPT2018',
      levelCode: 'Grade 7',
      skill: 'Speaking',
      description: 'Thực hiện phỏng vấn bạn học về sở thích và thói quen giải trí cuối tuần',
      status: 'missing',
    },
  ]);

  // Danh sách đề xuất bổ sung mục tiêu của AI (TC-074)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([
    {
      id: 'sug-001',
      targetUnit: 'Unit 1: Family, Friends & Daily Life',
      proposedTitle: 'Objective: Viết đoạn văn 50 từ mô tả thói quen buổi sáng của gia đình',
      nodeType: 'objective',
      standardCode: 'CEFR-A2-W1',
      skill: 'Writing',
      cefrLevel: 'A2',
      reason: 'Thiếu chuẩn CEFR A2 kỹ năng Viết. Hiện Unit 1 chỉ có bài tập Nói và Ngữ pháp.',
      status: 'pending',
      isAi: true,
      version: 1,
    },
    {
      id: 'sug-002',
      targetUnit: 'Unit 1: Family, Friends & Daily Life',
      proposedTitle: 'Lesson 1.3: Nghe hiểu thời gian biểu gia đình qua audio thông báo',
      nodeType: 'lesson',
      standardCode: 'CEFR-A2-L2',
      skill: 'Listening',
      cefrLevel: 'A2',
      reason: 'Bổ sung kỹ năng Nghe hiểu chỉ dẫn thời gian thực tế phù hợp chuẩn A2.',
      status: 'pending',
      isAi: true,
      version: 1,
    },
    {
      id: 'sug-003',
      targetUnit: 'Unit 2: Hobbies & Sports',
      proposedTitle: 'Objective: Dự án phỏng vấn 3 bạn cùng lớp về môn thể thao yêu thích',
      nodeType: 'objective',
      standardCode: 'GDPT-THCS-02',
      skill: 'Speaking',
      cefrLevel: 'Grade 7',
      reason: 'Đáp ứng năng lực giao tiếp thực tiễn theo Chương trình GDPT 2018.',
      status: 'accepted',
      isAi: true,
      version: 2,
    },
  ]);

  const handleScanStandards = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      alert('✨ AI đã đối soát xong với khung chuẩn ' + selectedFramework + '! Tìm thấy 2 chuẩn còn thiếu cần bổ sung.');
    }, 1000);
  };

  const handleAcceptSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((sug) => {
        if (sug.id === id) {
          return {
            ...sug,
            status: 'accepted',
            version: sug.version + 1,
          };
        }
        return sug;
      }),
    );
  };

  const handleRejectSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((sug) => {
        if (sug.id === id) {
          return {
            ...sug,
            status: 'rejected',
          };
        }
        return sug;
      }),
    );
  };

  const filteredStandards = standards.filter((s) => s.framework === selectedFramework);
  const filteredSuggestions = suggestions.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const missingCount = filteredStandards.filter((s) => s.status === 'missing').length;
  const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Link href="/teacher/curriculum" className="hover:underline">
                Giáo trình M05
              </Link>
              <span>/</span>
              <span>Đối soát chuẩn đầu ra & Đề xuất AI</span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <span>🎯</span> AI Đề Xuất Bổ Sung Giáo Trình (TC-074)
            </h1>
            <p className="text-emerald-100 text-xs mt-1">
              Phân tích đối soát độ phủ mục tiêu theo khung CEFR và GDPT 2018. Trưởng bộ môn phê duyệt tích hợp vào phiên bản mới (v2).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher/curriculum"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              ← Quay lại Cây giáo trình
            </Link>
            <Link
              href="/teacher/curriculum/videos"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5"
            >
              <span>🎬</span> Video Bài Giảng AI →
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Khung chuẩn đầu ra</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-slate-800">{selectedFramework}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {filteredStandards.length} tiêu chí
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
            <p className="text-xs text-rose-600 font-medium">Chuẩn còn thiếu (Missing)</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-rose-600">{missingCount} chuẩn</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                Cần bổ sung
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
            <p className="text-xs text-amber-600 font-medium">Đề xuất chờ duyệt</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-amber-600">{pendingSuggestionsCount} đề xuất</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                Cần Trưởng BM
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <p className="text-xs text-emerald-600 font-medium">Đã chấp thuận & Nâng version</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-emerald-600">
                {suggestions.filter((s) => s.status === 'accepted').length} mục
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                v2 (is_ai: true)
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Standards Comparison vs AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Standards Table (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>📊</span> Khung Chuẩn Đầu Ra
                </h2>
                <p className="text-xs text-slate-500">Đối chiếu chuẩn khung năng lực</p>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedFramework('CEFR')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedFramework === 'CEFR'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  CEFR
                </button>
                <button
                  onClick={() => setSelectedFramework('GDPT2018')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedFramework === 'GDPT2018'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  GDPT 2018
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredStandards.map((st) => (
                <div
                  key={st.code}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    st.status === 'missing'
                      ? 'border-rose-200 bg-rose-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {st.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {st.skill}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        {st.levelCode}
                      </span>
                    </div>

                    {st.status === 'covered' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <span>✓</span> Đã có
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                        <span>⚠</span> Chưa phủ
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 leading-relaxed">{st.description}</p>

                  {st.matchedLesson && (
                    <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded border border-emerald-200/60 flex items-center gap-1">
                      <span>🔗 Khớp với:</span>
                      <span className="font-medium truncate">{st.matchedLesson}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleScanStandards}
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {isScanning ? 'AI đang quét đối chiếu...' : '🔍 Quét đối soát toàn bộ giáo trình'}
            </button>
          </div>

          {/* Right Column: AI Suggestions Review (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>✨</span> Đề Xuất Bổ Sung Tự Động (AI Suggestions)
                </h2>
                <p className="text-xs text-slate-500">
                  Dành cho Trưởng bộ môn (Academic Lead) phê duyệt trước khi cập nhật giáo trình
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      filterStatus === tab
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'all'
                      ? 'Tất cả'
                      : tab === 'pending'
                      ? 'Chờ duyệt'
                      : tab === 'accepted'
                      ? 'Đã duyệt'
                      : 'Đã từ chối'}
                  </button>
                ))}
              </div>
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Không có đề xuất nào trong danh mục này.</div>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {item.nodeType === 'objective' ? 'Mục tiêu (Objective)' : 'Bài học (Lesson)'}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.standardCode}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {item.skill} ({item.cefrLevel})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          v{item.version}
                        </span>
                        {item.status === 'pending' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Chờ Trưởng BM duyệt
                          </span>
                        )}
                        {item.status === 'accepted' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span>✓</span> Đã chấp thuận (is_ai: true)
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            Đã từ chối
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.proposedTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Thuộc: {item.targetUnit}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Lý do AI đề xuất:</span> {item.reason}
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectSuggestion(item.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all"
                        >
                          ✕ Từ chối đề xuất
                        </button>
                        <button
                          onClick={() => handleAcceptSuggestion(item.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                        >
                          ✓ Chấp thuận & Cập nhật v2
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
