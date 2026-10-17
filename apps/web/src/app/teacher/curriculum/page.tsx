'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CurriculumNode {
  id: string;
  title: string;
  nodeType: 'unit' | 'lesson' | 'objective';
  sourcePage: number;
  skill?: string;
  cefrLevel?: string;
  children?: CurriculumNode[];
  isExpanded?: boolean;
}

interface MaterialItem {
  id: string;
  type: 'worksheet' | 'vocabulary' | 'slides';
  title: string;
  status: 'draft' | 'published';
  isAi: boolean;
  createdAt: string;
}

export default function TeacherCurriculumPage() {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'materials'>('roadmap');
  const [isParsing, setIsParsing] = useState(false);
  const [copyrightSource, setCopyrightSource] = useState<'center' | 'third_party'>('center');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingNode, setEditingNode] = useState<CurriculumNode | null>(null);

  // Cây giáo trình 40 trang bóc tách bởi AI (TC-072)
  const [curriculumTree, setCurriculumTree] = useState<CurriculumNode[]>([
    {
      id: 'unit-1',
      title: 'Unit 1: Family, Friends & Daily Life',
      nodeType: 'unit',
      sourcePage: 1,
      isExpanded: true,
      children: [
        {
          id: 'les-1-1',
          title: 'Lesson 1.1: Core Vocabulary & Describing People',
          nodeType: 'lesson',
          sourcePage: 4,
          skill: 'Vocabulary',
          cefrLevel: 'A2',
          isExpanded: true,
          children: [
            {
              id: 'obj-1-1-1',
              title: 'Objective: Describe 5 family members using personality adjectives',
              nodeType: 'objective',
              sourcePage: 6,
              skill: 'Speaking',
              cefrLevel: 'A2',
            },
          ],
        },
        {
          id: 'les-1-2',
          title: 'Lesson 1.2: Present Simple for Routines & Habits',
          nodeType: 'lesson',
          sourcePage: 10,
          skill: 'Grammar',
          cefrLevel: 'A2',
          isExpanded: false,
          children: [
            {
              id: 'obj-1-2-1',
              title: 'Objective: Master third-person singular verbs in daily routines',
              nodeType: 'objective',
              sourcePage: 12,
              skill: 'Grammar',
              cefrLevel: 'A2',
            },
          ],
        },
      ],
    },
    {
      id: 'unit-2',
      title: 'Unit 2: Hobbies, Sports & Leisure Activities',
      nodeType: 'unit',
      sourcePage: 20,
      isExpanded: true,
      children: [
        {
          id: 'les-2-1',
          title: 'Lesson 2.1: Reading Comprehension: Extreme Sports in the World',
          nodeType: 'lesson',
          sourcePage: 24,
          skill: 'Reading',
          cefrLevel: 'B1',
        },
      ],
    },
  ]);

  // Danh sách học liệu đã tạo từ AI (TC-073)
  const [materials, setMaterials] = useState<MaterialItem[]>([
    {
      id: 'mat-01',
      type: 'worksheet',
      title: '[AI Draft] Phiếu bài tập củng cố: Unit 1 Family and Routine',
      status: 'draft',
      isAi: true,
      createdAt: '15 phút trước',
    },
    {
      id: 'mat-02',
      type: 'vocabulary',
      title: '[AI Draft] Danh sách 25 từ vựng trọng tâm: Unit 1 Family',
      status: 'published',
      isAi: true,
      createdAt: 'Hôm qua',
    },
  ]);

  const handleParseAi = () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      alert('AI đã phân tích và cập nhật cấu trúc giáo trình 40 trang thành công!');
    }, 1200);
  };

  const handleSaveNodeEdit = () => {
    if (!editingNode) return;
    setCurriculumTree((prev) =>
      prev.map((unit) => {
        if (unit.id === editingNode.id) {
          return { ...unit, title: editingNode.title, sourcePage: editingNode.sourcePage };
        }
        return {
          ...unit,
          children: unit.children?.map((les) => {
            if (les.id === editingNode.id) {
              return { ...les, title: editingNode.title, sourcePage: editingNode.sourcePage };
            }
            return {
              ...les,
              children: les.children?.map((obj) => {
                if (obj.id === editingNode.id) {
                  return { ...obj, title: editingNode.title, sourcePage: editingNode.sourcePage };
                }
                return obj;
              }),
            };
          }),
        };
      }),
    );
    setEditingNode(null);
  };

  const handleGenerateMaterials = () => {
    if (copyrightSource === 'third_party') {
      alert('⚠️ Tài liệu bản quyền bên thứ ba: Tính năng AI bị khóa để đảm bảo bản quyền!');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const newItems: MaterialItem[] = [
        {
          id: `mat-${Date.now()}-1`,
          type: 'worksheet',
          title: '[AI Draft] Phiếu bài tập mới: Thì hiện tại đơn Unit 1',
          status: 'draft',
          isAi: true,
          createdAt: 'Vừa xong',
        },
        {
          id: `mat-${Date.now()}-2`,
          type: 'slides',
          title: '[AI Draft] Slide bài giảng tương tác: Unit 1 Lesson 2',
          status: 'draft',
          isAi: true,
          createdAt: 'Vừa xong',
        },
      ];
      setMaterials((prev) => [...newItems, ...prev]);
      setIsGenerating(false);
    }, 1000);
  };

  const handlePublishMaterial = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'published' } : m)),
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Quản trị Học liệu & Chương trình • S29 (TC-072, TC-073)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Giáo Trình Thông Minh & Học Liệu AI 📚
            </h1>
            <p className="text-teal-100 text-sm mt-1">
              AI bóc tách cấu trúc giáo trình kèm trang nguồn • Tạo phiếu bài tập & slide từ giáo án
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-white text-teal-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Cây giáo trình & Lộ trình 🗺️
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'materials'
                  ? 'bg-white text-teal-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Tạo học liệu AI 📑
            </button>
          </div>
        </div>

        {/* Tab 1: Roadmap & Curriculum Structure Tree (TC-072) */}
        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tree Structure (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <span>🌳</span> Cây Cấu Trúc Giáo Trình (Curriculum Nodes)
                  </h2>
                  <p className="text-xs text-slate-500">Bóc tách từ file giáo trình PDF 40 trang</p>
                </div>
                <button
                  onClick={handleParseAi}
                  disabled={isParsing}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isParsing ? 'AI đang phân tích...' : '✨ Phân tích lại với AI'}
                </button>
              </div>

              {/* Tree View */}
              <div className="space-y-3">
                {curriculumTree.map((unit) => (
                  <div key={unit.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100/70 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span>📁</span>
                        <span>{unit.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono font-bold text-[11px]">
                          Trang {unit.sourcePage}
                        </span>
                        <button
                          onClick={() => setEditingNode(unit)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="p-3 space-y-2 bg-white">
                      {unit.children?.map((les) => (
                        <div key={les.id} className="pl-4 border-l-2 border-teal-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-700 font-semibold">
                              <span>📖</span>
                              <span>{les.title}</span>
                              {les.skill && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                                  {les.skill}
                                </span>
                              )}
                              {les.cefrLevel && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono text-[10px]">
                                  {les.cefrLevel}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                Trang {les.sourcePage}
                              </span>
                              <button
                                onClick={() => setEditingNode(les)}
                                className="text-slate-400 hover:text-slate-700 text-xs"
                              >
                                ✏️
                              </button>
                            </div>
                          </div>

                          {/* Objectives */}
                          {les.children?.map((obj) => (
                            <div
                              key={obj.id}
                              className="pl-4 py-1 flex items-center justify-between text-[11px] text-slate-600 italic bg-slate-50/50 rounded"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>🎯</span>
                                <span>{obj.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Trang {obj.sourcePage}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Roadmap & Edit Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Edit Node Modal Panel */}
              {editingNode && (
                <div className="bg-white border border-teal-300 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>✏️ Chỉnh sửa mục giáo trình (TC-072)</span>
                    <button
                      onClick={() => setEditingNode(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Tiêu đề:</label>
                    <input
                      type="text"
                      value={editingNode.title}
                      onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Số trang nguồn:</label>
                    <input
                      type="number"
                      value={editingNode.sourcePage}
                      onChange={(e) =>
                        setEditingNode({ ...editingNode, sourcePage: Number(e.target.value) })
                      }
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNode(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveNodeEdit}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-bold"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}

              {/* Roadmap Timeline Diagram */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>🗺️</span> Sơ đồ lộ trình học tập (Roadmap Timeline)
                </h3>
                <p className="text-xs text-slate-500">Hiển thị trực quan tiến trình các bài học theo tuần</p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow">
                      1
                    </div>
                    <div className="flex-1 bg-teal-50/60 p-3 rounded-xl border border-teal-200 text-xs">
                      <div className="font-bold text-teal-900">Unit 1: Family & Routine</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">2 Lessons • 1 Objective • CEFR A2</div>
                      <div className="mt-2 text-teal-700 font-mono text-[10px]">Trang 1 - 18</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow">
                      2
                    </div>
                    <div className="flex-1 bg-cyan-50/60 p-3 rounded-xl border border-cyan-200 text-xs">
                      <div className="font-bold text-cyan-900">Unit 2: Hobbies & Extreme Sports</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">1 Lesson • CEFR B1</div>
                      <div className="mt-2 text-cyan-700 font-mono text-[10px]">Trang 20 - 32</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Material Generator (TC-073) */}
        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Generator Form (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>✨</span> Sinh học liệu từ Giáo án đã duyệt
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chọn giáo án nguồn:</label>
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800">
                    <option>LP-S13-01: Giáo án Unit 1 Family and Routine (Đã duyệt)</option>
                    <option>LP-S13-02: Giáo án Unit 2 Hobbies (Đã duyệt)</option>
                  </select>
                </div>

                {/* Copyright Toggle Simulator (TC-073) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-700 block">Kiểm tra nguồn bản quyền (TC-073):</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cRight"
                        checked={copyrightSource === 'center'}
                        onChange={() => setCopyrightSource('center')}
                        className="text-teal-600"
                      />
                      <span className="text-emerald-700 font-medium">Bản quyền Trung tâm (Cho phép)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cRight"
                        checked={copyrightSource === 'third_party'}
                        onChange={() => setCopyrightSource('third_party')}
                        className="text-red-600"
                      />
                      <span className="text-red-700 font-medium">Bên thứ ba (Bị khóa)</span>
                    </label>
                  </div>
                </div>

                {copyrightSource === 'third_party' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] leading-relaxed">
                    ⚠️ <b>Cảnh báo vi phạm bản quyền:</b> Tài liệu đánh dấu bản quyền bên thứ ba (third_party) bị khóa tính năng AI để bảo vệ quyền sở hữu trí tuệ.
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleGenerateMaterials}
                    disabled={isGenerating || copyrightSource === 'third_party'}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                      copyrightSource === 'third_party'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI đang soạn thảo học liệu...</span>
                      </>
                    ) : (
                      <>
                        <span>🪄</span>
                        <span>Sinh học liệu tự động bằng AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Materials List (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  Kho học liệu đã sinh từ AI ({materials.length})
                </h3>
                <span className="text-xs text-slate-500">Chỉ học sinh thấy học liệu ĐÃ XUẤT BẢN</span>
              </div>

              <div className="space-y-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      m.status === 'draft' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                          AI GENERATED
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {m.status === 'draft' ? '⏳ Nháp (Draft)' : '✅ Đã xuất bản'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">{m.title}</div>
                      <div className="text-[11px] text-slate-400">{m.createdAt}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status === 'draft' ? (
                        <button
                          onClick={() => handlePublishMaterial(m.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
                        >
                          Xuất bản
                        </button>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => alert('Đang tải file PDF...')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                          >
                            PDF ⬇️
                          </button>
                          <button
                            onClick={() => alert('Đang tải file Word...')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                          >
                            Word ⬇️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
