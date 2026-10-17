'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface StudentRow {
  studentId: string;
  code: string;
  fullName: string;
  phone?: string;
  schoolName?: string;
  status: 'present' | 'late' | 'excused' | 'absent';
  method?: string;
  checkinAt?: string;
  note?: string;
  attendanceId?: string;
}

export default function SessionAttendancePage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Teacher verification state
  const [activeTab, setActiveTab] = useState<'qr_geo' | 'manual'>('qr_geo');
  const [qrNonce, setQrNonce] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [manualReason, setManualReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [qrKind, setQrKind] = useState<'offline' | 'online'>('offline');

  useEffect(() => {
    fetchSessionAttendance();
  }, [sessionId]);

  const fetchSessionAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('corelink_access_token');
      const res = await fetch(`/api/v1/attendance/sessions/${sessionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation API');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setGpsError(`Không thể lấy vị trí: ${err.message}. Hãy cấp quyền vị trí.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Ảnh phải nhỏ hơn 1 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyTeacher = async () => {
    try {
      setVerifying(true);
      setMessage(null);
      setWarningMessage(null);
      const token = localStorage.getItem('corelink_access_token');

      const payload: any = {
        nonce: qrNonce || undefined,
        photoBase64: photoBase64 || undefined,
      };

      if (gpsLocation) {
        payload.latitude = gpsLocation.lat;
        payload.longitude = gpsLocation.lng;
      }

      const res = await fetch(`/api/v1/attendance/sessions/${sessionId}/verify-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.verified) {
        setMessage(result.message || 'Xác thực mở buổi học thành công!');
        fetchSessionAttendance();
      } else {
        setWarningMessage(result.message || 'Không thể xác thực. Vui lòng thử điểm danh thủ công.');
      }
    } catch (err: any) {
      setWarningMessage(err.message || 'Lỗi kết nối khi xác thực.');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualCheckin = async () => {
    if (!manualReason.trim()) {
      alert('Vui lòng nhập lý do điểm danh thủ công');
      return;
    }
    try {
      setVerifying(true);
      const token = localStorage.getItem('corelink_access_token');
      const res = await fetch(`/api/v1/attendance/sessions/${sessionId}/manual-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: manualReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Đã gửi yêu cầu điểm danh thủ công!');
        fetchSessionAttendance();
      } else {
        setWarningMessage(data.message || 'Lỗi khi gửi yêu cầu.');
      }
    } catch (err: any) {
      setWarningMessage(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const updateStudentStatus = (studentId: string, status: StudentRow['status']) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const setAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setWarningMessage(null);
      const token = localStorage.getItem('corelink_access_token');

      const records = students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        note: s.note,
      }));

      const res = await fetch(`/api/v1/attendance/sessions/${sessionId}/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Lưu điểm danh nhanh thành công dưới 30 giây!');
        if (data.consecutiveAbsenceWarnings && data.consecutiveAbsenceWarnings.length > 0) {
          const warns = data.consecutiveAbsenceWarnings.map((w: any) => w.message).join('\n');
          setWarningMessage(warns);
        }
        fetchSessionAttendance();
      } else {
        setWarningMessage(data.message || 'Lưu điểm danh thất bại.');
      }
    } catch (err: any) {
      setWarningMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQr = async (kind: 'offline' | 'online') => {
    try {
      const token = localStorage.getItem('corelink_access_token');
      const res = await fetch(`/api/v1/attendance/sessions/${sessionId}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ kind }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data);
        setQrKind(kind);
        setShowQrModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p>Đang tải dữ liệu buổi học và danh sách điểm danh...</p>
      </div>
    );
  }

  const isVerified = Boolean(sessionData?.session?.verifiedAt);
  const presentCount = students.filter((s) => s.status === 'present').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const excusedCount = students.filter((s) => s.status === 'excused').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/academic/schedule"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2"
          >
            ← Quay lại Thời khóa biểu
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Điểm danh Buổi {sessionData?.session?.sessionNo}: {sessionData?.class?.name}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
              {sessionData?.class?.code}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Thời gian: {sessionData?.session?.startsAt?.slice(0, 16).replace('T', ' ')} —{' '}
            {sessionData?.session?.endsAt?.slice(11, 16)} | Phòng:{' '}
            {sessionData?.class?.roomName || 'Phòng học chính'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateQr('offline')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <span>📱</span> Chiếu QR Offline
          </button>
          <button
            onClick={() => handleGenerateQr('online')}
            className="px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 shadow-sm"
          >
            <span>🌐</span> Chiếu QR Online
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            Đóng
          </button>
        </div>
      )}

      {warningMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm flex items-start gap-2">
          <span className="text-base mt-0.5">⚠️</span>
          <div className="flex-1 whitespace-pre-line">{warningMessage}</div>
          <button onClick={() => setWarningMessage(null)} className="text-amber-700 hover:text-amber-950 text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Teacher Verification Box (FR-403) */}
      <div className={`p-5 rounded-xl border ${isVerified ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
              {isVerified ? '✓' : '!'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {isVerified ? 'Buổi học đã được xác thực (Căn cứ tính lương GV)' : 'Xác thực mở buổi học dành cho Giáo viên'}
              </h3>
              <p className="text-xs text-slate-500">
                {isVerified
                  ? `Phương thức: ${sessionData?.session?.verifyMethod === 'qr_offline' ? 'QR + GPS + Ảnh lớp' : 'Giáo vụ phê duyệt thủ công'} vào lúc ${sessionData?.session?.verifiedAt?.slice(0, 19).replace('T', ' ')}`
                  : 'Yêu cầu quét QR tại lớp + Chụp ảnh lớp + Bật GPS vị trí (trong bán kính cơ sở) để kích hoạt giờ dạy.'}
              </p>
            </div>
          </div>
          {isVerified && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              Đã xác thực
            </span>
          )}
        </div>

        {!isVerified && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('qr_geo')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'qr_geo' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                Xác thực QR + GPS + Ảnh
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                Điểm danh thủ công (Chờ duyệt)
              </button>
            </div>

            {activeTab === 'qr_geo' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mã Nonce QR buổi học</label>
                  <input
                    type="text"
                    value={qrNonce}
                    onChange={(e) => setQrNonce(e.target.value)}
                    placeholder="Quét hoặc dán mã QR nonce"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Định vị GPS vị trí</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <span>📍</span>
                    {gpsLocation ? `Đã lấy tọa độ (${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)})` : 'Bấm để lấy tọa độ hiện tại'}
                  </button>
                  {gpsError && <p className="text-[11px] text-rose-600 mt-1">{gpsError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ảnh chụp lớp (&lt; 1 MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={handleVerifyTeacher}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  >
                    {verifying ? 'Đang xác thực...' : 'Xác thực & Mở buổi học'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lý do điểm danh thủ công</label>
                  <textarea
                    rows={2}
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="VD: Phòng học ngầm mất sóng GPS, thiết bị camera không hoạt động..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={handleManualCheckin}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 shadow-sm"
                  >
                    {verifying ? 'Đang gửi...' : 'Gửi yêu cầu điểm danh thủ công tới Giáo vụ'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Attendance Sheet (FR-401) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Statistics Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-slate-600">Tổng số: <strong>{students.length}</strong> học sinh</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Có mặt: {presentCount}
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Đi muộn: {lateCount}
            </span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Có phép: {excusedCount}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Vắng: {absentCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setAllPresent}
              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100"
            >
              ✓ Tất cả có mặt
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAttendance}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center gap-1.5"
            >
              <span>💾</span>
              {saving ? 'Đang lưu...' : 'Lưu điểm danh nhanh (< 30s)'}
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Trường phổ thông</th>
                <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{student.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{student.fullName}</td>
                  <td className="py-3 px-4 text-slate-500">{student.schoolName || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, 'present')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          student.status === 'present'
                            ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        Có mặt
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, 'late')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          student.status === 'late'
                            ? 'bg-amber-500 text-white font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        Đi muộn
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, 'excused')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          student.status === 'excused'
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        Có phép
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, 'absent')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          student.status === 'absent'
                            ? 'bg-rose-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        Vắng
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={student.note || ''}
                      placeholder="Lý do / nhận xét..."
                      onChange={(e) => {
                        const note = e.target.value;
                        setStudents((prev) =>
                          prev.map((s) =>
                            s.studentId === student.studentId ? { ...s, note } : s
                          )
                        );
                      }}
                      className="w-full text-xs px-2.5 py-1 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Presentation Modal */}
      {showQrModal && qrCodeData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Mã QR Điểm danh ({qrKind === 'offline' ? 'Tại lớp' : 'Học trực tuyến'})
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chiếu mã QR này lên máy chiếu hoặc màn hình chia sẻ để học sinh quét check-in.
            </p>

            {/* QR Mock / Box */}
            <div className="mx-auto w-64 h-64 bg-slate-50 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center p-4">
              <div className="w-44 h-44 bg-slate-900 rounded-lg flex items-center justify-center p-2 text-white font-mono text-[10px] break-all">
                {qrCodeData.nonce}
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                Hết hạn: {new Date(qrCodeData.validUntil).toLocaleTimeString('vi-VN')}
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-indigo-50 p-3 rounded-lg text-left">
              <p className="font-semibold text-indigo-900 mb-1">Quy định điểm danh QR:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-indigo-800">
                <li>Quét trong 15 phút đầu giờ: Tính có mặt (present).</li>
                <li>Quét sau 15 phút: Hệ thống tự động ghi nhận đi muộn (late).</li>
                <li>Mã QR tự động đổi sau khi hết hạn để chống chụp ảnh gửi lại.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
            >
              Đóng cửa sổ chiếu QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
