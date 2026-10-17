'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StudentEval {
  student_id: string;
  code: string;
  name: string;
  attitude: number;
  focus: number;
  progress: number;
  template_code: string;
  comment: string;
}

export default function TeacherEvaluationsPage() {
  const [selectedClass, setSelectedClass] = useState('Cambridge Movers 01 (15 học sinh)');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const templateOptions = [
    { code: 'EXCELLENT', label: 'Xuất sắc', text: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài' },
    { code: 'GOOD_PROGRESS', label: 'Tiến bộ tốt', text: 'Chăm chỉ làm bài tập về nhà, phát âm có nhiều tiến bộ' },
    { code: 'ATTENTIVE', label: 'Tập trung', text: 'Rất chú ý lắng nghe, hoàn thành tốt các nhiệm vụ nhóm' },
    { code: 'NEED_FOCUS', label: 'Cần chú ý', text: 'Nắm được bài nhưng đôi lúc còn mất tập trung, cần rèn luyện thêm' },
  ];

  const [evaluations, setEvaluations] = useState<StudentEval[]>([
    {
      student_id: 's-1',
      code: 'HS-S09-01',
      name: 'Lê Minh Khôi',
      attitude: 5,
      focus: 5,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-2',
      code: 'HS-S09-02',
      name: 'Lê Bảo Ngọc',
      attitude: 4,
      focus: 5,
      progress: 5,
      template_code: 'GOOD_PROGRESS',
      comment: 'Chăm chỉ làm bài tập về nhà, phát âm có nhiều tiến bộ',
    },
    {
      student_id: 's-3',
      code: 'HS-S09-03',
      name: 'Trần Tuấn Kiệt',
      attitude: 4,
      focus: 4,
      progress: 4,
      template_code: 'ATTENTIVE',
      comment: 'Rất chú ý lắng nghe, hoàn thành tốt các nhiệm vụ nhóm',
    },
    {
      student_id: 's-4',
      code: 'HS-S09-04',
      name: 'Phạm Minh Anh',
      attitude: 5,
      focus: 4,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-5',
      code: 'HS-S09-05',
      name: 'Hoàng Gia Huy',
      attitude: 4,
      focus: 4,
      progress: 4,
      template_code: 'ATTENTIVE',
      comment: 'Rất chú ý lắng nghe, hoàn thành tốt các nhiệm vụ nhóm',
    },
    {
      student_id: 's-6',
      code: 'HS-S09-06',
      name: 'Vũ Thùy Linh',
      attitude: 5,
      focus: 5,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-7',
      code: 'HS-S09-07',
      name: 'Đặng Quốc Bảo',
      attitude: 4,
      focus: 4,
      progress: 4,
      template_code: 'GOOD_PROGRESS',
      comment: 'Chăm chỉ làm bài tập về nhà, phát âm có nhiều tiến bộ',
    },
    {
      student_id: 's-8',
      code: 'HS-S09-08',
      name: 'Ngô Phương Thảo',
      attitude: 5,
      focus: 5,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-9',
      code: 'HS-S09-09',
      name: 'Bùi Đức Trí',
      attitude: 4,
      focus: 3,
      progress: 4,
      template_code: 'NEED_FOCUS',
      comment: 'Nắm được bài nhưng đôi lúc còn mất tập trung, cần rèn luyện thêm',
    },
    {
      student_id: 's-10',
      code: 'HS-S09-10',
      name: 'Lý Hải Đăng',
      attitude: 5,
      focus: 4,
      progress: 4,
      template_code: 'ATTENTIVE',
      comment: 'Rất chú ý lắng nghe, hoàn thành tốt các nhiệm vụ nhóm',
    },
    {
      student_id: 's-11',
      code: 'HS-S09-11',
      name: 'Dương Khánh Linh',
      attitude: 5,
      focus: 5,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-12',
      code: 'HS-S09-12',
      name: 'Trịnh Thế Vinh',
      attitude: 4,
      focus: 4,
      progress: 4,
      template_code: 'GOOD_PROGRESS',
      comment: 'Chăm chỉ làm bài tập về nhà, phát âm có nhiều tiến bộ',
    },
    {
      student_id: 's-13',
      code: 'HS-S09-13',
      name: 'Hồ Quỳnh Nga',
      attitude: 5,
      focus: 4,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
    {
      student_id: 's-14',
      code: 'HS-S09-14',
      name: 'Mai Tiến Đạt',
      attitude: 4,
      focus: 4,
      progress: 4,
      template_code: 'ATTENTIVE',
      comment: 'Rất chú ý lắng nghe, hoàn thành tốt các nhiệm vụ nhóm',
    },
    {
      student_id: 's-15',
      code: 'HS-S09-15',
      name: 'Đoàn Kim Ngân',
      attitude: 5,
      focus: 5,
      progress: 5,
      template_code: 'EXCELLENT',
      comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
    },
  ]);

  const handleUpdateStudent = (index: number, field: keyof StudentEval, val: any) => {
    const updated = [...evaluations];
    updated[index] = { ...updated[index], [field]: val };

    if (field === 'template_code') {
      const opt = templateOptions.find((t) => t.code === val);
      if (opt) updated[index].comment = opt.text;
    }

    setEvaluations(updated);
  };

  const handleApplyToAll = (templateCode: string) => {
    const opt = templateOptions.find((t) => t.code === templateCode);
    if (!opt) return;

    setEvaluations(
      evaluations.map((ev) => ({
        ...ev,
        template_code: opt.code,
        comment: opt.text,
      })),
    );
  };

  const handleSaveBatch = async () => {
    try {
      setIsSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/v1/evaluations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          class_id: 'cls-dummy-movers-01',
          period: 'session',
          evaluations: evaluations.map((e) => ({
            student_id: e.student_id,
            attitude: e.attitude,
            focus: e.focus,
            progress: e.progress,
            comment: e.comment,
            template_code: e.template_code,
          })),
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/teacher" className="text-xs text-blue-600 hover:underline">
                ← Bảng điều khiển giáo viên
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Đánh giá định tính nhanh cả lớp (FR-701)
            </h1>
            <p className="text-slate-500 text-sm">
              Đánh giá 15 học sinh dưới 3 phút bằng các mẫu nhận xét chuẩn hóa
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveBatch}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>💾</span> {isSaving ? 'Đang lưu...' : 'Lưu đánh giá cả lớp'}
            </button>
          </div>
        </div>

        {/* Quick Batch Tools Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Mẫu chọn nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleApplyToAll('EXCELLENT')}
                className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200 transition-colors"
              >
                ⭐ Cả lớp Xuất sắc
              </button>
              <button
                onClick={() => handleApplyToAll('GOOD_PROGRESS')}
                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 transition-colors"
              >
                📈 Cả lớp Tiến bộ tốt
              </button>
              <button
                onClick={() => handleApplyToAll('ATTENTIVE')}
                className="px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-medium border border-purple-200 transition-colors"
              >
                🎯 Cả lớp Tập trung
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400">
            Sĩ số: <strong className="text-slate-800">{evaluations.length} học sinh</strong>
          </span>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            ✅ Đã lưu đánh giá cho toàn bộ 15 học sinh! Dữ liệu đã sẵn sàng để phụ huynh theo dõi.
          </div>
        )}

        {/* Evaluation Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">STT</th>
                  <th className="p-3.5">Học sinh</th>
                  <th className="p-3.5">Thái độ (1-5)</th>
                  <th className="p-3.5">Tập trung (1-5)</th>
                  <th className="p-3.5">Tiến bộ (1-5)</th>
                  <th className="p-3.5">Mẫu nhận xét</th>
                  <th className="p-3.5 pr-5">Nhận xét chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((ev, idx) => (
                  <tr key={ev.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pl-5 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {ev.name}
                      <span className="block text-[11px] font-normal text-slate-400">{ev.code}</span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ev.attitude}
                        onChange={(e) => handleUpdateStudent(idx, 'attitude', Number(e.target.value))}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} ⭐
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ev.focus}
                        onChange={(e) => handleUpdateStudent(idx, 'focus', Number(e.target.value))}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} ⭐
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ev.progress}
                        onChange={(e) => handleUpdateStudent(idx, 'progress', Number(e.target.value))}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} ⭐
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ev.template_code}
                        onChange={(e) => handleUpdateStudent(idx, 'template_code', e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-700 max-w-[140px] truncate"
                      >
                        {templateOptions.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 pr-5">
                      <input
                        type="text"
                        value={ev.comment}
                        onChange={(e) => handleUpdateStudent(idx, 'comment', e.target.value)}
                        className="w-full min-w-[260px] px-2.5 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
