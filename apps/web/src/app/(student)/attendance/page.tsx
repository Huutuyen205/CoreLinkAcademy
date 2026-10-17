'use client';

import React, { useState, useEffect } from 'react';

interface AttendanceRecord {
  attendanceId: string;
  sessionId: string;
  classCode: string;
  className: string;
  roomName: string;
  sessionNo: number;
  startsAt: string;
  status: 'present' | 'late' | 'excused' | 'absent';
  method?: string;
  checkinAt?: string;
  note?: string;
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [qrNonce, setQrNonce] = useState('');
  const [scanningSessionId, setScanningSessionId] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Absence Request Form Modal
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceSessionId, setAbsenceSessionId] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [submittingAbsence, setSubmittingAbsence] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('corelink_access_token');
      const res = await fetch('/api/v1/attendance/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentScanQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanningSessionId || !qrNonce) {
      setScanError('Vui lòng chọn buổi học và nhập mã QR Nonce');
      return;
    }

    try {
      setScanError(null);
      setScanMessage(null);
      const token = localStorage.getItem('corelink_access_token');
      const res = await fetch(`/api/v1/attendance/sessions/${scanningSessionId}/student-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nonce: qrNonce }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.message || 'Điểm danh thành công!');
        setQrNonce('');
        fetchHistory();
      } else {
        setScanError(data.message || 'Điểm danh QR thất bại');
      }
    } catch (err: any) {
      setScanError(err.message);
    }
  };

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceSessionId || !absenceReason.trim()) {
      alert('Vui lòng chọn buổi học và nhập lý do xin nghỉ');
      return;
    }

    try {
      setSubmittingAbsence(true);
      const token = localStorage.getItem('corelink_access_token');
      // Lấy thông tin user hiện tại
      const userStr = localStorage.getItem('corelink_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.studentId;

      const res = await fetch('/api/v1/attendance/absence-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId: absenceSessionId,
          studentId,
          reason: absenceReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Gửi đơn xin nghỉ học thành công!');
        setShowAbsenceModal(false);
        setAbsenceReason('');
        fetchHistory();
      } else {
        alert(data.message || 'Gửi đơn xin nghỉ thất bại.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAbsence(false);
    }
  };

  const totalSessions = history.length;
  const presentCount = history.filter((h) => h.status === 'present').length;
  const lateCount = history.filter((h) => h.status === 'late').length;
  const excusedCount = history.filter((h) => h.status === 'excused').length;
  const absentCount = history.filter((h) => h.status === 'absent').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chuyên cần &amp; Điểm danh học viên</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi lịch sử tham gia các buổi học và nộp đơn xin nghỉ học trực tuyến
          </p>
        </div>

        <button
          onClick={() => setShowAbsenceModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-1.5 self-start"
        >
          <span>📝</span> Nộp đơn xin nghỉ học
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Tỷ lệ chuyên cần</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{attendanceRate}%</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-emerald-600 font-medium">Có mặt</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{presentCount}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-amber-600 font-medium">Đi muộn</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{lateCount}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">Có phép</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{excusedCount}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-rose-600 font-medium">Vắng mặt</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Student Online QR Check-in Box (FR-404) */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 rounded-xl border border-indigo-100 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <span>📱</span> Điểm danh bằng mã QR (Học sinh quét mã tại lớp hoặc buổi online)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập mã Nonce hiển thị trên màn hình máy chiếu hoặc màn hình livestream buổi học để check-in.
        </p>

        {scanMessage && (
          <div className="mt-2 p-2.5 bg-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
            ✓ {scanMessage}
          </div>
        )}
        {scanError && (
          <div className="mt-2 p-2.5 bg-rose-100 text-rose-800 text-xs rounded-lg font-medium">
            ✕ {scanError}
          </div>
        )}

        <form onSubmit={handleStudentScanQr} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={scanningSessionId}
            onChange={(e) => setScanningSessionId(e.target.value)}
            placeholder="Mã UUID buổi học (hoặc chọn từ lịch)"
            className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={qrNonce}
            onChange={(e) => setQrNonce(e.target.value)}
            placeholder="Mã QR Nonce (32 ký tự)"
            className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm"
          >
            Quét check-in
          </button>
        </form>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 text-sm">Lịch sử chuyên cần từng buổi học</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Đang tải lịch sử...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chưa có bản ghi điểm danh nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Buổi số</th>
                  <th className="py-3 px-4">Lớp học</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Thời gian học</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Giờ check-in</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record.attendanceId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">Buổi {record.sessionNo}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{record.className}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{record.classCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{record.roomName}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {record.startsAt ? new Date(record.startsAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          record.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : record.status === 'excused'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.status === 'present'
                          ? 'Có mặt'
                          : record.status === 'late'
                          ? 'Đi muộn'
                          : record.status === 'excused'
                          ? 'Có phép'
                          : 'Vắng mặt'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {record.checkinAt ? new Date(record.checkinAt).toLocaleTimeString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{record.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Absence Request Modal (FR-406) */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Đơn xin nghỉ học</h3>
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Đơn xin nghỉ học phải được gửi <strong>trước khi buổi học bắt đầu</strong>. Hệ thống sẽ tự động ghi nhận vắng có phép và thông báo tới Giáo viên chủ nhiệm.
            </p>

            <form onSubmit={handleSubmitAbsence} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mã UUID Buổi học</label>
                <input
                  type="text"
                  required
                  value={absenceSessionId}
                  onChange={(e) => setAbsenceSessionId(e.target.value)}
                  placeholder="Nhập mã buổi học cần xin nghỉ"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lý do xin nghỉ</label>
                <textarea
                  required
                  rows={3}
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="VD: Học sinh bị sốt cao cần đi khám bệnh, gia đình có việc bận đột xuất..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingAbsence}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingAbsence ? 'Đang gửi...' : 'Nộp đơn xin nghỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
