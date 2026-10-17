'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClassItem {
  id: string;
  code: string;
  name: string;
  mode: 'offline' | 'online' | 'hybrid';
  capacity: number;
  activeStudents: number;
  fillRate: number;
  lowFillWarning: boolean;
  roomName: string | null;
  teacherName: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface ProgramItem {
  id: string;
  code: string;
  name: string;
  framework: string;
  targetLevel: string;
  totalSessions: number;
  classes: ClassItem[];
}

interface LevelItem {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  programs: ProgramItem[];
}

export default function AcademicClassesPage() {
  const [tree, setTree] = useState<LevelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');
  const [classMode, setClassMode] = useState<'offline' | 'online' | 'hybrid'>('offline');
  const [capacity, setCapacity] = useState(12);
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-01-31');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [recurrence, setRecurrence] = useState([
    { weekday: 2, start: '18:00', end: '19:30' },
    { weekday: 4, start: '18:00', end: '19:30' },
  ]);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/academic/tree', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTree(data);
      }
    } catch (err) {
      console.error('Lỗi tải cây đào tạo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/v1/academic/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          programId: selectedProgramId,
          code: classCode,
          name: className,
          mode: classMode,
          capacity: Number(capacity),
          startDate,
          endDate,
          recurrence,
          homeroomTeacherId,
          roomId: roomId || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setErrorMsg(`[Xung đột lịch] ${data.message || 'Phòng học hoặc giáo viên đã bị trùng lịch với lớp khác'}`);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.message || 'Không thể tạo lớp học');
        return;
      }

      setSuccessMsg(`Tạo lớp ${data.code} thành công với ${data.totalSessions} buổi học tự động!`);
      setShowCreateModal(false);
      fetchTree();
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ khi tạo lớp');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-indigo-400 font-semibold mb-1">
            <span>QUẢN LÝ ĐÀO TẠO</span>
            <span>•</span>
            <span>S38 / M03</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Cây Cấp Học & Lớp Học
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi sĩ số, tỷ lệ lấp đầy (fill rate) và cảnh báo lớp học dưới 50% theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/academic/schedule"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition flex items-center gap-2"
          >
            <span>📅</span>
            <span>Thời khóa biểu tuần</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
          >
            <span>+</span>
            <span>Tạo lớp học mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cây đào tạo */}
      <div className="max-w-7xl mx-auto space-y-8">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải cấu trúc chương trình và lớp học...</div>
        ) : tree.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-slate-400">
            Chưa có dữ liệu cấp học và lớp học. Vui lòng chạy lệnh <code className="text-indigo-400 font-mono">pnpm seed:demo</code> để nạp dữ liệu mẫu.
          </div>
        ) : (
          tree.map((level) => (
            <div key={level.id} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur">
              {/* Level Title */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                  {level.code}
                </span>
                <h2 className="text-xl font-bold text-white">{level.name}</h2>
                <span className="text-xs text-slate-400">({level.programs.length} chương trình)</span>
              </div>

              {/* Programs */}
              <div className="space-y-6">
                {level.programs.map((prog) => (
                  <div key={prog.id} className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{prog.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {prog.code}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Khung: {prog.framework} • Mục tiêu: {prog.targetLevel} • {prog.totalSessions || 36} buổi
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                        {prog.classes.length} Lớp học
                      </span>
                    </div>

                    {/* Classes Grid */}
                    {prog.classes.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-2">Chưa có lớp nào mở trong chương trình này.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prog.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className={`rounded-xl p-4 border transition ${
                              cls.lowFillWarning
                                ? 'bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="font-mono text-xs text-indigo-400 font-semibold">{cls.code}</span>
                                <h3 className="font-bold text-sm text-slate-200 line-clamp-1">{cls.name}</h3>
                              </div>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  cls.mode === 'online'
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {cls.mode}
                              </span>
                            </div>

                            <div className="text-xs text-slate-400 space-y-1 mb-3">
                              <div className="flex items-center gap-1">
                                <span>📍</span>
                                <span>{cls.roomName || 'Chưa xếp phòng'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>👨‍🏫</span>
                                <span>{cls.teacherName || 'Chưa gán GV'}</span>
                              </div>
                            </div>

                            {/* Fill Rate Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-400">Sĩ số:</span>
                                <span className="font-bold text-slate-200">
                                  {cls.activeStudents} / {cls.capacity} ({(cls.fillRate * 100).toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    cls.lowFillWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, cls.fillRate * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Warning Banner */}
                            {cls.lowFillWarning && (
                              <div className="mb-3 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span>Sĩ số dưới 50% — Cần đẩy mạnh tuyển sinh</span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <Link
                                href={`/academic/classes/${cls.id}/enrollments`}
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                <span>👥</span>
                                <span>Ghi danh & Học sinh ({cls.activeStudents})</span>
                              </Link>
                              <span className="text-[11px] text-slate-500">
                                {new Date(cls.startDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tạo Lớp Học Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold">Tạo Lớp Học Mới (FR-302)</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Chương trình đào tạo</label>
                <select
                  required
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {tree.flatMap((l) => l.programs).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mã lớp</label>
                  <input
                    required
                    type="text"
                    placeholder="CLS-2026-X"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tên lớp học</label>
                  <input
                    required
                    type="text"
                    placeholder="Lớp IELTS Chuyên Sâu K1"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Hình thức học</label>
                  <select
                    value={classMode}
                    onChange={(e) => setClassMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="offline">Trực tiếp (Offline)</option>
                    <option value="online">Trực tuyến (Online Meet/Zoom)</option>
                    <option value="hybrid">Kết hợp (Hybrid)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Sức chứa tối đa (Capacity)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Ngày bắt đầu</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Ngày kết thúc</label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Lịch lặp tuần */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Lịch lặp hàng tuần (Recurrence)</span>
                  <span className="text-[11px] text-slate-500">Tự sinh lịch & trừ ngày lễ</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Thứ 3 (18:00 - 19:30)
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Thứ 5 (18:00 - 19:30)
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Xác nhận & Tự sinh lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
