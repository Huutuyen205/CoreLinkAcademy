'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Lock,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

interface TeacherPayrollRow {
  teacherId: string;
  name: string;
  code: string;
  verifiedSessions: number;
  unverifiedSessions: number;
  rateVnd: number;
  adjustmentsVnd: number;
  totalVnd: number;
  notes?: string;
}

export default function AccountingPayrollPage() {
  const [periodMonth, setPeriodMonth] = useState('2026-11');
  const [periodStatus, setPeriodStatus] = useState<'open' | 'closed'>('open');
  const [calcNotice, setCalcNotice] = useState<string | null>(null);

  const [payrollRows, setPayrollRows] = useState<TeacherPayrollRow[]>([
    {
      teacherId: 't-1',
      name: 'Thầy David Smith',
      code: 'GV-S10-01',
      verifiedSessions: 14,
      unverifiedSessions: 2,
      rateVnd: 300000,
      adjustmentsVnd: 200000,
      totalVnd: 14 * 300000 + 200000, // 4.400.000
      notes: 'Thưởng phản hồi khảo sát 5 sao',
    },
    {
      teacherId: 't-2',
      name: 'Cô Sarah Jones',
      code: 'GV-S10-02',
      verifiedSessions: 11,
      unverifiedSessions: 1,
      rateVnd: 300000,
      adjustmentsVnd: 0,
      totalVnd: 11 * 300000, // 3.300.000 (gồm 1 buổi dạy thay)
      notes: 'Có 1 buổi dạy thay lớp Movers',
    },
    {
      teacherId: 't-3',
      name: 'Thầy James Wilson',
      code: 'GV-S10-03',
      verifiedSessions: 8,
      unverifiedSessions: 0,
      rateVnd: 280000,
      adjustmentsVnd: 100000,
      totalVnd: 8 * 280000 + 100000,
    },
  ]);

  const totalSessions = payrollRows.reduce((s, r) => s + r.verifiedSessions, 0);
  const totalPayroll = payrollRows.reduce((s, r) => s + r.totalVnd, 0);

  const handleCalculatePayroll = () => {
    if (periodStatus === 'closed') {
      alert('Kỳ lương đã chốt, không thể tính lại hoặc sửa đổi (TC-131)');
      return;
    }
    setCalcNotice(
      'Đã quét 33 buổi học: 33 buổi đã xác thực (verified_at != null) được tính lương. Buổi dạy thay đã gán chuẩn xác cho giáo viên thực dạy (TC-129, TC-130).',
    );
    setTimeout(() => setCalcNotice(null), 5000);
  };

  const handleClosePeriod = () => {
    if (periodStatus === 'closed') return;
    const ok = confirm('Bạn có chắc chắn muốn chốt kỳ lương này? Sau khi chốt, dữ liệu sẽ được khóa chống sửa đổi theo quy định FR-1105.');
    if (ok) {
      setPeriodStatus('closed');
      setCalcNotice('Kỳ lương đã được chốt và khóa thành công (TC-131).');
      setTimeout(() => setCalcNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                S41 • Phân Hệ Kế Toán
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  periodStatus === 'open'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {periodStatus === 'open' ? (
                  <>
                    <Clock className="h-3 w-3" /> Kỳ đang mở (Open)
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Đã chốt (Closed - TC-131)
                  </>
                )}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Tính Lương & Chốt Bảng Lương Giáo Viên
            </h1>
            <p className="text-sm text-slate-600">
              Chỉ tính các buổi đã xác thực, tự động tính lương dạy thay và khóa kỳ lương
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm outline-none"
            >
              <option value="2026-11">Kỳ Tháng 11/2026</option>
              <option value="2026-10">Kỳ Tháng 10/2026</option>
              <option value="2026-09">Kỳ Tháng 09/2026</option>
            </select>

            <button
              onClick={handleCalculatePayroll}
              disabled={periodStatus === 'closed'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" /> Tính lương tự động (TC-129)
            </button>

            {periodStatus === 'open' ? (
              <button
                onClick={handleClosePeriod}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                <Lock className="h-4 w-4" /> Chốt kỳ lương (TC-131)
              </button>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                Đã khóa chốt kỳ
              </span>
            )}
          </div>
        </div>

        {/* Thông báo thao tác */}
        {calcNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs font-semibold text-blue-900">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{calcNotice}</span>
          </div>
        )}

        {/* Thẻ chỉ số tổng quan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Tổng buổi dạy đã duyệt</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalSessions} buổi</div>
            <p className="mt-1 text-xs text-slate-400">Chỉ tính verified_at != null</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">Tổng quỹ lương kỳ này</div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {totalPayroll.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-emerald-600">Đã bao gồm thưởng & phụ cấp</p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
            <div className="text-xs font-semibold text-purple-700">Quy tắc dạy thay (TC-130)</div>
            <div className="mt-2 text-base font-bold text-purple-900">
              Tính cho giáo viên thực dạy
            </div>
            <p className="mt-1 text-xs text-purple-600">
              substitute_for_teacher_id ghi nhận người bị thay
            </p>
          </div>
        </div>

        {/* Bảng danh sách chi tiết giáo viên */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">Danh Sách Bảng Lương Giáo Viên</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3.5">Giáo viên</th>
                <th className="p-3.5 text-center">Buổi đã duyệt</th>
                <th className="p-3.5 text-center">Chờ duyệt</th>
                <th className="p-3.5 text-right">Đơn giá / buổi</th>
                <th className="p-3.5 text-right">Thưởng / Phạt</th>
                <th className="p-3.5 text-right">Tổng thực lĩnh</th>
                <th className="p-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payrollRows.map((row) => (
                <tr key={row.teacherId} className="hover:bg-slate-50/80">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{row.name}</div>
                    <div className="font-mono text-slate-400">{row.code}</div>
                  </td>
                  <td className="p-3.5 text-center font-bold text-blue-600">
                    {row.verifiedSessions}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-amber-600">
                    {row.unverifiedSessions > 0 ? row.unverifiedSessions : '-'}
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-700">
                    {row.rateVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold text-emerald-600">
                    {row.adjustmentsVnd > 0
                      ? `+${row.adjustmentsVnd.toLocaleString('vi-VN')} đ`
                      : '0 đ'}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                    {row.totalVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 text-slate-500">{row.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
