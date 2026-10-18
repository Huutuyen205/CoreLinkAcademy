'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Calendar,
  Users,
  AlertTriangle,
  Plus,
  MapPin,
  User,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';

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
      const res = await fetch('/api/v1/academic/programs/tree', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTree(data);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục lớp học:', err);
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
          capacity,
          startDate,
          endDate,
          homeroomTeacherId: homeroomTeacherId || undefined,
          roomId: roomId || undefined,
          recurrenceRules: recurrence,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Lỗi tạo lớp học');
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
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <span>Quản Lý Đào Tạo</span>
            <span>•</span>
            <span>Cây Phân Cấp Khóa Học</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Cây Cấp Học & Lớp Học Toàn Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi sĩ số, công suất lấp đầy phòng học và cảnh báo lớp học dưới 50% theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/academic/schedule"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Thời khóa biểu tuần</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lớp học mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cây đào tạo */}
      <div className="max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải cấu trúc chương trình và lớp học...</div>
        ) : tree.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center text-slate-500 text-xs shadow-xs">
            Chưa có dữ liệu cấp học và lớp học. Vui lòng chạy lệnh <code className="text-blue-600 font-mono font-bold">pnpm seed:demo</code> để nạp dữ liệu mẫu chuẩn.
          </div>
        ) : (
          tree.map((level) => (
            <div key={level.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Level Title */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                  {level.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{level.name}</h2>
                <span className="text-xs text-slate-400">({level.programs.length} chương trình đào tạo)</span>
              </div>

              {/* Programs */}
              <div className="space-y-5">
                {level.programs.map((prog) => (
                  <div key={prog.id} className="rounded-xl bg-slate-50 border border-slate-200/90 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{prog.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-600 font-mono border border-slate-200 font-semibold">
                            {prog.code}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Khung chuẩn: {prog.framework} • Mục tiêu đầu ra: {prog.targetLevel} • {prog.totalSessions || 36} buổi học
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs self-start sm:self-auto">
                        {prog.classes.length} Lớp đang mở
                      </span>
                    </div>

                    {/* Classes Grid */}
                    {prog.classes.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-2">Chưa có lớp nào mở trong chương trình này.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {prog.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className={`rounded-xl p-4 border transition-all ${
                              cls.lowFillWarning
                                ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-100'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="font-mono text-xs text-blue-600 font-bold">{cls.code}</span>
                                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{cls.name}</h3>
                              </div>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  cls.mode === 'online'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {cls.mode}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1 mb-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{cls.roomName || 'Chưa xếp phòng'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{cls.teacherName || 'Chưa gán GV'}</span>
                              </div>
                            </div>

                            {/* Fill Rate Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500">Sĩ số:</span>
                                <span className="font-bold text-slate-800">
                                  {cls.activeStudents} / {cls.capacity} ({(cls.fillRate * 100).toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/80">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    cls.lowFillWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, cls.fillRate * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Warning Banner */}
                            {cls.lowFillWarning && (
                              <div className="mb-3 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                <span>Sĩ số dưới 50% — Cần tiếp thị</span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <Link
                                href={`/academic/classes/${cls.id}/enrollments`}
                                className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Học sinh ({cls.activeStudents})</span>
                              </Link>
                              <span className="text-[11px] text-slate-400">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Tạo Lớp Học Mới (Phân Công GV & Lịch)</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Chương trình đào tạo</label>
                <select
                  required
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  <label className="block text-slate-700 mb-1 font-semibold">Mã lớp</label>
                  <input
                    required
                    type="text"
                    placeholder="CLS-2026-X"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tên lớp học</label>
                  <input
                    required
                    type="text"
                    placeholder="Lớp IELTS Chuyên Sâu K1"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Hình thức học</label>
                  <select
                    value={classMode}
                    onChange={(e) => setClassMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="offline">Trực tiếp (Offline)</option>
                    <option value="online">Trực tuyến (Online Meet/Zoom)</option>
                    <option value="hybrid">Kết hợp (Hybrid)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Sức chứa tối đa (Capacity)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Ngày bắt đầu</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Ngày kết thúc</label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Lịch lặp tuần */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Lịch lặp hàng tuần (Recurrence)</span>
                  <span className="text-[11px] text-slate-400">Tự sinh lịch & trừ ngày lễ</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Thứ 3 (18:00 - 19:30)
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Thứ 5 (18:00 - 19:30)
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
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
