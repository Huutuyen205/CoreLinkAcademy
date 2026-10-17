'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ClassEnrollmentsPage() {
  const params = useParams();
  const classId = params.id as string;

  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [conflictAckReason, setConflictAckReason] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchClassDetail();
    fetchOtherClasses();
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/academic/classes/${classId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCls(data);
      }
    } catch (err) {
      console.error('Lỗi tải thông tin lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherClasses = async () => {
    try {
      const res = await fetch('/api/v1/academic/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableClasses(data.filter((c: any) => c.id !== classId));
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/academic/classes/${classId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          studentId,
          conflictAckReason: conflictAckReason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Lỗi khi ghi danh học sinh');
        return;
      }

      setSuccessMsg(data.message || 'Ghi danh học sinh thành công!');
      setShowEnrollModal(false);
      fetchClassDetail();
    } catch (err) {
      setErrorMsg('Lỗi kết nối khi ghi danh');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/academic/enrollments/${selectedEnrollment.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          targetClassId,
          reason: transferReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Lỗi khi chuyển lớp');
        return;
      }

      setSuccessMsg(data.message || 'Chuyển lớp thành công!');
      setShowTransferModal(false);
      fetchClassDetail();
    } catch (err) {
      setErrorMsg('Lỗi kết nối khi chuyển lớp');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 p-12 text-center">
        Đang tải hồ sơ lớp học và danh sách học viên...
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Không tìm thấy thông tin lớp học</h2>
        <Link href="/academic/classes" className="text-indigo-400 underline text-sm">
          Quay lại danh sách lớp học
        </Link>
      </div>
    );
  }

  const activeEnrollments = cls.enrollments || [];
  const activeCount = activeEnrollments.length;
  const isFull = activeCount >= cls.capacity;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto mb-6">
        <Link
          href="/academic/classes"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mb-3"
        >
          <span>←</span>
          <span>Quay lại Cây Lớp học</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                {cls.code}
              </span>
              <span className="text-xs text-slate-400">Khóa: {cls.programs?.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{cls.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Phòng: {cls.rooms?.name || 'Chưa gán'} • GV: {cls.teachers?.users?.full_name || 'Chưa gán'} • Lịch:{' '}
              {cls.mode}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Sĩ số lớp</div>
              <div className="text-xl font-bold">
                <span className={isFull ? 'text-rose-400' : 'text-emerald-400'}>{activeCount}</span>
                <span className="text-slate-500"> / {cls.capacity}</span>
              </div>
            </div>

            <button
              disabled={isFull}
              onClick={() => setShowEnrollModal(true)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                isFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              <span>+</span>
              <span>{isFull ? 'Lớp đã đầy sĩ số' : 'Ghi danh học viên'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Danh sách học sinh */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">
            Danh Sách Học Sinh Đang Theo Học ({activeCount})
          </h2>
          <span className="text-xs text-slate-500">Lớp {cls.code}</span>
        </div>

        {activeEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Chưa có học sinh nào được ghi danh vào lớp học này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Mã HS</th>
                  <th className="px-5 py-3">Họ và tên</th>
                  <th className="px-5 py-3">Trường học</th>
                  <th className="px-5 py-3">Ngày ghi danh</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeEnrollments.map((enr: any) => (
                  <tr key={enr.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3 font-mono text-indigo-400 font-semibold">
                      {enr.students?.code}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-100">
                      {enr.students?.users?.full_name}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {enr.students?.school_name || 'Chưa cập nhật'}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(enr.enrolled_on).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        Đang học
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedEnrollment(enr);
                          setShowTransferModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        Chuyển lớp →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chuyển Lớp (FR-305, TC-049) */}
      {showTransferModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold mb-2">Chuyển Lớp Cho Học Sinh (FR-305)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Học sinh: <strong className="text-white">{selectedEnrollment.students?.users?.full_name}</strong> (Mã:{' '}
              {selectedEnrollment.students?.code}). Toàn bộ lịch sử điểm số và điểm danh sẽ được giữ nguyên.
            </p>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Chọn lớp muốn chuyển tới</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="">-- Chọn lớp học đích --</option>
                  {availableClasses.map((c: any) => (
                    <option key={c.id} value={c.id} disabled={c.activeStudents >= c.capacity}>
                      {c.name} ({c.code}) — {c.activeStudents}/{c.capacity} chỗ {c.activeStudents >= c.capacity ? '(ĐẦY)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lý do chuyển lớp</label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ví dụ: Đổi ca học, chuyển trình độ theo đề xuất của giáo viên..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Xác nhận chuyển lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
