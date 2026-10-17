'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  PhoneCall,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Award,
  Filter,
} from 'lucide-react';

interface EarlyWarningItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  riskLevel: 'high' | 'medium' | 'low';
  reasons: string[];
  suggestedAction: string;
  lastScoreTrend: string;
  absenceCount: number;
  detectedAt: string;
}

interface PlacementSuggestionItem {
  id: string;
  studentId: string;
  studentName: string;
  targetLevel: string;
  suggestedClassId: string;
  suggestedClassName: string;
  suggestedTeacherId: string;
  suggestedTeacherName: string;
  reason: string;
  scoreMatch: number;
  status: 'pending' | 'applied';
}

export default function EarlyWarningDashboardPage() {
  const [activeTab, setActiveTab] = useState<'early_warning' | 'placement_suggestions'>('early_warning');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const [warnings, setWarnings] = useState<EarlyWarningItem[]>([
    {
      id: 'ew-001',
      studentId: 'stu-risk-01',
      studentName: 'Trần Minh Quân',
      studentCode: 'HS-2026-089',
      className: 'Tiếng Anh Giao Tiếp A2 - K12',
      riskLevel: 'high',
      reasons: [
        'Điểm Đọc (Reading) giảm 3 bài liên tiếp: 7.5 → 6.0 → 5.0',
        'Vắng 2 buổi học liên tiếp không phép (12/10 và 15/10)',
        'Chưa nộp 3 bài tập về nhà gần nhất',
      ],
      suggestedAction:
        'Giáo viên chủ nhiệm cần gọi điện trao đổi trực tiếp với phụ huynh và bố trí 1 buổi phụ đạo 1-1 kỹ năng Đọc hiểu.',
      lastScoreTrend: 'Giảm 33%',
      absenceCount: 2,
      detectedAt: 'Hôm nay, 08:30',
    },
    {
      id: 'ew-002',
      studentId: 'stu-risk-02',
      studentName: 'Lê Thảo My',
      studentCode: 'HS-2026-112',
      className: 'Luyện thi IELTS Foundation - F03',
      riskLevel: 'medium',
      reasons: [
        'Điểm bài kiểm tra Nói (Speaking) tuần này đạt 4.0/9.0 (thấp hơn mục tiêu 5.5)',
        'Tỷ lệ chuyên cần tháng đạt 78% (ngưỡng an toàn là 85%)',
      ],
      suggestedAction:
        'Cấp quyền truy cập gói ôn luyện thông minh AI Tutor và gửi bài luyện phát âm tăng cường.',
      lastScoreTrend: 'Giảm 1.5 band',
      absenceCount: 1,
      detectedAt: 'Hôm qua, 16:45',
    },
    {
      id: 'ew-003',
      studentId: 'stu-risk-03',
      studentName: 'Phạm Đức Anh',
      studentCode: 'HS-2026-045',
      className: 'Tiếng Anh Thiếu Nhi Starters - S02',
      riskLevel: 'low',
      reasons: [
        'Tương tác trong giờ học giảm sút trong 2 buổi gần đây',
        'Thời gian hoàn thành bài tập trên ứng dụng chậm hơn 50% so với tốc độ trung bình lớp',
      ],
      suggestedAction:
        'Giáo viên tăng cường khen thưởng qua huy hiệu sao tương tác và động viên học sinh trong giờ.',
      lastScoreTrend: 'Chậm nhịp',
      absenceCount: 0,
      detectedAt: '2 ngày trước',
    },
  ]);

  const [suggestions, setSuggestions] = useState<PlacementSuggestionItem[]>([
    {
      id: 'plc-001',
      studentId: 'stu-new-01',
      studentName: 'Nguyễn Đăng Khôi',
      targetLevel: 'CEFR A2 (Điểm test 84/100)',
      suggestedClassId: 'cls-a2-eve',
      suggestedClassName: 'Tiếng Anh Thiếu Niên A2 (Tối T3-T5)',
      suggestedTeacherId: 'tch-01',
      suggestedTeacherName: 'Thầy Nguyễn Văn An',
      reason:
        'Học sinh có điểm Placement Test A2 xuất sắc (84/100). Lớp T3-T5 còn 2 chỗ trống. Thầy Nguyễn Văn An có điểm khảo sát 4.85/5 và thế mạnh về Ngữ pháp phù hợp với học sinh.',
      scoreMatch: 95,
      status: 'pending',
    },
    {
      id: 'plc-002',
      studentId: 'stu-new-02',
      studentName: 'Hoàng Diệu Vy',
      targetLevel: 'IELTS Band 5.5 Pre',
      suggestedClassId: 'cls-ielts-pre',
      suggestedClassName: 'IELTS Intensive Foundation (Sáng T7-CN)',
      suggestedTeacherId: 'tch-02',
      suggestedTeacherName: 'Cô Trần Thị Mai',
      reason:
        'Lịch rảnh của học sinh trùng khớp với khung giờ cuối tuần. Cô Mai có tỷ lệ học sinh tăng điểm Speaking cao nhất trung tâm (98%).',
      scoreMatch: 92,
      status: 'pending',
    },
  ]);

  const handleApplySuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((sug) => (sug.id === id ? { ...sug, status: 'applied' } : sug)),
    );
    alert('✅ Admin đã phê duyệt xếp lớp và phân công giáo viên thành công! Thông báo đã gửi tới học viên và giáo viên.');
  };

  const filteredWarnings = warnings.filter((w) => {
    if (filterRisk === 'all') return true;
    return w.riskLevel === filterRisk;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Link href="/admin/dashboard" className="hover:underline">
                Quản trị Admin
              </Link>
              <span>/</span>
              <span>Cảnh báo sớm & Xếp lớp AI</span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
              Cảnh Báo Sớm Nguy Cơ Tụt Điểm & Bỏ Học (FR-705)
            </h1>
            <p className="text-rose-100 text-xs mt-1">
              AI-10 theo dõi liên tục tiến độ, điểm số và chuyên cần. Báo động tự động cho Giáo viên và Giáo vụ kèm giải pháp can thiệp kịp thời.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/executive-assistant"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-950 shadow-md hover:bg-rose-50 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Trợ Lý Hỏi Đáp Số Liệu AI →
            </Link>
          </div>
        </div>

        {/* Tab Selector & Stats Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('early_warning')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'early_warning'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚠️ Cảnh báo sớm học sinh ({warnings.length})
            </button>
            <button
              onClick={() => setActiveTab('placement_suggestions')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'placement_suggestions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ Gợi ý xếp lớp & Phân công GV ({suggestions.length})
            </button>
          </div>

          {activeTab === 'early_warning' && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Mức độ rủi ro:</span>
              {(['all', 'high', 'medium', 'low'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] transition-all ${
                    filterRisk === r
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === 'all' ? 'Tất cả' : r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: Early Warnings List (FR-705 / AI-10) */}
        {activeTab === 'early_warning' && (
          <div className="space-y-4">
            {filteredWarnings.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs space-y-4 ${
                  item.riskLevel === 'high'
                    ? 'border-rose-300 hover:border-rose-400'
                    : item.riskLevel === 'medium'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1 ${
                        item.riskLevel === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : item.riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Nguy cơ {item.riskLevel}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.studentName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.studentCode} • {item.className}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Phát hiện:</span>
                    <span className="font-semibold text-slate-700">{item.detectedAt}</span>
                  </div>
                </div>

                {/* Specific Reasons */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">Lý do cụ thể phát hiện bởi AI (FR-705):</p>
                  <ul className="space-y-1">
                    {item.reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-rose-800 flex items-start gap-2 bg-rose-50/60 p-2 rounded-xl"
                      >
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Recommendation */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Hành động đề xuất can thiệp:
                    </span>
                    <p className="text-slate-600">{item.suggestedAction}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alert(`📞 Đã tạo lịch hẹn trao đổi với phụ huynh học sinh ${item.studentName}`)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs transition-all flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Gọi phụ huynh
                    </button>
                    <button
                      onClick={() => alert(`📅 Đã phân công giáo viên phụ đạo 1-1 cho ${item.studentName}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Xếp lịch phụ đạo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Placement & Teacher Allocation Suggestions (FR-307 / AI-11) */}
        {activeTab === 'placement_suggestions' && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-900 flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">Thuật toán phân bổ lớp học & giáo viên (FR-307):</span>{' '}
                Gợi ý dựa trên điểm kiểm tra năng lực đầu vào, sĩ số lớp còn trống, lịch rảnh và chỉ số khảo sát chất lượng của giáo viên. Quyết định cuối cùng do Admin phê duyệt.
              </div>
            </div>

            {suggestions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        {item.targetLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Độ tương thích {item.scoreMatch}%
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Học sinh: {item.studentName}</h3>
                  </div>

                  {item.status === 'applied' ? (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Admin phê duyệt áp dụng
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplySuggestion(item.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Duyệt & Áp Dụng (Admin)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 block mb-1">Lớp học đề xuất:</span>
                    <p className="font-bold text-slate-800 text-sm">{item.suggestedClassName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 block mb-1">Giáo viên phụ trách đề xuất:</span>
                    <p className="font-bold text-slate-800 text-sm">{item.suggestedTeacherName}</p>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold">Lý do gợi ý (AI-11):</span> {item.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
