'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SkillScore {
  key: string;
  name: string;
  score: number; // 0 - 100
  level: string; // A1, A2, B1, B2...
  measuredAt: string;
  sourceAttemptId: string;
  assignmentTitle: string;
  tabLeaves: number;
  notes: string;
}

export default function StudentCompetencyRadarPage() {
  const [framework, setFramework] = useState<'CEFR' | 'YLE' | 'IELTS'>('CEFR');
  const [selectedSkill, setSelectedSkill] = useState<SkillScore | null>(null);

  const [skills, setSkills] = useState<SkillScore[]>([
    {
      key: 'listening',
      name: 'Nghe (Listening)',
      score: 82,
      level: 'B1',
      measuredAt: '15/10/2026',
      sourceAttemptId: 'att-cefr-01',
      assignmentTitle: 'Kiểm tra Giữa kỳ - Listening Comprehension Module',
      tabLeaves: 0,
      notes: 'Nghe hiểu tốt các đoạn hội thoại có ngữ điệu tự nhiên. Chú ý từ đồng âm.',
    },
    {
      key: 'speaking',
      name: 'Nói (Speaking)',
      score: 85,
      level: 'B1',
      measuredAt: '16/10/2026',
      sourceAttemptId: 'att-cefr-02',
      assignmentTitle: 'COMP-ASG-01: Kiểm tra năng lực Speaking & Reading',
      tabLeaves: 0,
      notes: 'Phát âm chuẩn xác, ngữ điệu phong phú, phản xạ nhanh khi trả lời câu hỏi mở.',
    },
    {
      key: 'reading',
      name: 'Đọc (Reading)',
      score: 48,
      level: 'A2',
      measuredAt: '17/10/2026',
      sourceAttemptId: 'att-cefr-03',
      assignmentTitle: 'Bài kiểm tra Đọc hiểu Chuyên sâu Unit 4',
      tabLeaves: 2,
      notes: 'Cần củng cố từ vựng chuyên đề gia đình & xã hội. Cần đọc kỹ câu hỏi trước khi chọn.',
    },
    {
      key: 'writing',
      name: 'Viết (Writing)',
      score: 75,
      level: 'A2+',
      measuredAt: '12/10/2026',
      sourceAttemptId: 'att-cefr-04',
      assignmentTitle: 'Short Essay: My Favorite Weekend Activity',
      tabLeaves: 0,
      notes: 'Bố cục bài viết mạch lạc, sử dụng liên từ tốt, cần hạn chế lỗi chia thì quá khứ.',
    },
    {
      key: 'grammar',
      name: 'Ngữ pháp (Grammar)',
      score: 88,
      level: 'B1',
      measuredAt: '14/10/2026',
      sourceAttemptId: 'att-cefr-05',
      assignmentTitle: 'Trắc nghiệm Ngữ pháp tổng hợp các thì cơ bản',
      tabLeaves: 1,
      notes: 'Nắm rất vững các thì hiện tại, quá khứ đơn và cấu trúc câu bị động.',
    },
    {
      key: 'vocabulary',
      name: 'Từ vựng (Vocabulary)',
      score: 78,
      level: 'B1',
      measuredAt: '13/10/2026',
      sourceAttemptId: 'att-cefr-06',
      assignmentTitle: 'Flashcard Quiz & Word Match 200 từ vựng cốt lõi',
      tabLeaves: 0,
      notes: 'Vốn từ mở rộng tốt, khả năng đoán nghĩa qua văn cảnh khá chính xác.',
    },
  ]);

  // SVG Radar Chart Math
  const totalPoints = skills.length;
  const radius = 130;
  const centerX = 175;
  const centerY = 175;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalPoints) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // Polygon points string
  const polygonPoints = skills
    .map((s, i) => {
      const coord = getCoordinates(i, s.score);
      return `${coord.x},${coord.y}`;
    })
    .join(' ');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              Báo cáo năng lực học viên • FR-702
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Biểu đồ Radar Năng lực Ngôn ngữ 📊
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Phân tích 6 kỹ năng cốt lõi • Truy vết nguồn gốc bài thi & đề xuất độ khó thích ứng
            </p>
          </div>

          <div className="flex gap-2">
            {(['CEFR', 'YLE', 'IELTS'] as const).map((fw) => (
              <button
                key={fw}
                onClick={() => setFramework(fw)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all border ${
                  framework === fw
                    ? 'bg-white text-indigo-700 border-white shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                }`}
              >
                Khung {fw}
              </button>
            ))}
            <Link
              href="/student/tutor"
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs transition-all shadow-md ml-2"
            >
              Hỏi Gia sư AI 🤖
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Radar Chart Visual (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🕸️</span> Biểu đồ Đa giác Năng lực (Spider/Radar Chart)
              </h2>
              <span className="text-xs text-slate-500 italic">Click vào đỉnh để xem bài thi gốc</span>
            </div>

            <div className="relative w-[350px] h-[350px] flex items-center justify-center">
              <svg width="350" height="350" className="overflow-visible">
                {/* Background Concentric Webs */}
                {[0.25, 0.5, 0.75, 1].map((scale, lvl) => (
                  <circle
                    key={lvl}
                    cx={centerX}
                    cy={centerY}
                    r={radius * scale}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={scale === 1 ? 'none' : '3 3'}
                  />
                ))}

                {/* Axis lines */}
                {skills.map((_, i) => {
                  const endCoord = getCoordinates(i, 100);
                  return (
                    <line
                      key={i}
                      x1={centerX}
                      y1={centerY}
                      x2={endCoord.x}
                      y2={endCoord.y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Score Area Polygon */}
                <polygon
                  points={polygonPoints}
                  fill="rgba(79, 70, 229, 0.25)"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />

                {/* Skill Nodes & Labels */}
                {skills.map((s, i) => {
                  const coord = getCoordinates(i, s.score);
                  const labelCoord = getCoordinates(i, 118);
                  const isSelected = selectedSkill?.key === s.key;
                  const isWeak = s.score < 50;

                  return (
                    <g key={s.key} className="cursor-pointer" onClick={() => setSelectedSkill(s)}>
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected ? 7 : 5}
                        fill={isWeak ? '#ef4444' : isSelected ? '#10b981' : '#4f46e5'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all hover:scale-125"
                      />
                      <text
                        x={labelCoord.x}
                        y={labelCoord.y}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fill={isSelected ? '#1e1b4b' : isWeak ? '#b91c1c' : '#475569'}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {s.name.split(' ')[0]} ({s.score}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick Skill Indicator Chips */}
            <div className="w-full mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {skills.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSkill(s)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedSkill?.key === s.key
                      ? 'bg-indigo-50 border-indigo-400 font-semibold shadow-sm'
                      : s.score < 50
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate">{s.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        s.score < 50 ? 'bg-red-200 text-red-800' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {s.level}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800">{s.score}/100</div>
                </button>
              ))}
            </div>
          </div>

          {/* Drill-down Detail Panel (TC-101, 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedSkill ? (
              <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{selectedSkill.name}</h3>
                      <p className="text-xs text-slate-500">Truy xuất bài test nguồn gốc (TC-101)</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedSkill.score < 50
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Band: {selectedSkill.level} ({selectedSkill.score}%)
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block mb-1">Bài test nguồn (Source Assignment):</span>
                    <span className="font-semibold text-slate-800 text-sm block">
                      {selectedSkill.assignmentTitle}
                    </span>
                    <div className="mt-2 flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <span>ID: {selectedSkill.sourceAttemptId}</span>
                      <span>•</span>
                      <span>Ngày nộp: {selectedSkill.measuredAt}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block mb-0.5">Số lần rời tab (TC-097):</span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          selectedSkill.tabLeaves > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {selectedSkill.tabLeaves === 0
                          ? '0 lần (Nghiêm túc)'
                          : `${selectedSkill.tabLeaves} lần cảnh báo`}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block mb-0.5">Khung quy chiếu:</span>
                      <span className="text-sm font-bold text-indigo-700">{framework} Standards</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <span className="text-indigo-900 font-semibold block mb-1">Nhận xét & Phân tích chuyên sâu:</span>
                    <p className="text-slate-700 leading-relaxed">{selectedSkill.notes}</p>
                  </div>

                  {selectedSkill.score < 50 && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-red-800">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <span>⚠️</span> Kỹ năng cần hỗ trợ gấp!
                      </div>
                      <p>
                        Điểm kỹ năng này dưới 50%. Hệ thống đã chuẩn bị sẵn bộ bài tập bổ trợ thích ứng từ ngân hàng câu hỏi đã duyệt.
                      </p>
                      <Link
                        href="/student/tutor"
                        className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
                      >
                        Nhận bài luyện kỹ năng yếu →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">👈</div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Chọn kỹ năng trên biểu đồ</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Bấm vào bất kỳ nhánh kỹ năng nào trên biểu đồ đa giác để xem chi tiết bài test nguồn và lịch sử đánh giá.
                </p>
              </div>
            )}

            {/* Adaptive Difficulty Card (FR-613) */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-mono">
                  FR-613 Adaptive Engine
                </span>
                <span className="text-xs text-indigo-300">Độ khó hiện tại: Cấp 2 (B1)</span>
              </div>
              <h4 className="font-bold text-base">Cá nhân hóa độ khó thông minh</h4>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Khi bạn đạt tỷ lệ đúng từ <span className="text-amber-300 font-bold">80% trở lên</span> ở bài kiểm tra kế tiếp, hệ thống sẽ tự động nâng cấp độ khó lên <span className="text-white font-bold">Cấp 3 (B2)</span> để tối ưu hóa lộ trình bứt phá!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
