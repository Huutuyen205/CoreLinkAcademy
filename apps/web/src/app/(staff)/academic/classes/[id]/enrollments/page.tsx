'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, ArrowLeft, UserPlus, ArrowRightLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

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
      const res = await fetch(`/api/v1/academic/classes/${classId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.id,
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
      <div className="min-h-screen bg-[#F7F9FC] text-slate-500 p-12 text-center text-xs">
        Đang tải hồ sơ lớp học và danh sách học viên...
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-slate-800 p-8 text-center font-sans">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Không tìm thấy thông tin lớp học</h2>
        <Link href="/academic/classes" className="text-blue-600 underline text-sm font-semibold">
          Quay lại danh sách lớp học
        </Link>
      </div>
    );
  }

  const activeEnrollments = cls.enrollments || [];
  const activeCount = activeEnrollments.length;
  const isFull = activeCount >= cls.capacity;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto mb-6">
        <Link
          href="/academic/classes"
          className="text-xs text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1.5 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Cây Lớp học</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                {cls.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">Khóa: {cls.programs?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{cls.name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Phòng: <strong className="text-slate-700">{cls.rooms?.name || 'Chưa gán'}</strong> • Giảng viên:{' '}
              <strong className="text-slate-700">{cls.teachers?.users?.full_name || 'Chưa gán'}</strong> • Hình thức:{' '}
              <span className="uppercase font-semibold text-blue-600">{cls.mode}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Sĩ số lớp</div>
              <div className="text-xl font-black">
                <span className={isFull ? 'text-red-600' : 'text-emerald-700'}>{activeCount}</span>
                <span className="text-slate-400 font-semibold"> / {cls.capacity}</span>
              </div>
            </div>

            <button
              disabled={isFull}
              onClick={() => setShowEnrollModal(true)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isFull
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isFull ? 'Lớp đã đầy sĩ số' : 'Ghi danh học viên'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Danh sách học sinh */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800">
            Danh Sách Học Sinh Đang Theo Học ({activeCount})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Mã lớp: {cls.code}</span>
        </div>

        {activeEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic">
            Chưa có học sinh nào được ghi danh vào lớp học này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Mã HS</th>
                  <th className="px-5 py-3">Họ và tên</th>
                  <th className="px-5 py-3">Trường học</th>
                  <th className="px-5 py-3">Ngày ghi danh</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEnrollments.map((enr: any) => (
                  <tr key={enr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-blue-700 font-bold">
                      {enr.students?.code}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {enr.students?.users?.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {enr.students?.school_name || 'Chưa cập nhật'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(enr.enrolled_on).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Đang học
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedEnrollment(enr);
                          setShowTransferModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                        <span>Chuyển lớp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chuyển Lớp */}
      {showTransferModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 mb-1">Chuyển Lớp Cho Học Sinh</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Học sinh: <strong className="text-slate-800">{selectedEnrollment.students?.users?.full_name}</strong> (Mã:{' '}
              {selectedEnrollment.students?.code}). Toàn bộ hồ sơ điểm số và điểm danh sẽ được giữ nguyên theo quy chuẩn bảo lưu.
            </p>

            <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Chọn lớp muốn chuyển tới *</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                <label className="block text-slate-700 mb-1 font-semibold">Lý do chuyển lớp</label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ví dụ: Đổi ca học, điều chỉnh cấp độ theo đề xuất của ban cố vấn..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
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
