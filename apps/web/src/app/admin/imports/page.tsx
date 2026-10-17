'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface ErrorRow {
  row: number;
  data: any;
  reason: string;
}

export default function AdminImportsPage() {
  const [selectedEntity, setSelectedEntity] = useState<'students' | 'guardians' | 'teachers'>('students');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSimulateUpload = () => {
    setFileName('danh_sach_hoc_sinh_khoa_moi_2026.xlsx');
  };

  const handleProcessImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setImportResult({
        importId: `IMP-2026-${Date.now().toString().slice(-4)}`,
        idempotencyKey: `KEY-${Date.now()}`,
        totalRows: 120,
        okRowsCount: 114,
        errorRowsCount: 6,
        customFieldsFound: ['hobby', 'previous_school', 'dietary_restrictions'],
        errorRows: [
          { row: 14, data: { name: '', phone: '0988123456' }, reason: 'Thiếu họ tên bắt buộc' },
          { row: 28, data: { name: 'Trần Văn Sai', phone: '1234' }, reason: 'Số điện thoại không đúng định dạng 10 số' },
          { row: 55, data: { name: 'Lê Thị Trùng', phone: '0912345678' }, reason: 'Số điện thoại đã tồn tại trên hệ thống' },
        ],
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              S43 • Quản Trị Hệ Thống
            </span>
            <span className="text-xs font-semibold text-slate-500">M14 Nhập dữ liệu Excel</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Nhập Dữ Liệu Excel Thông Minh
          </h1>
          <p className="text-sm text-slate-600">
            Tự động ghép cột, lưu trường tùy biến (custom_fields) và phân lập danh sách lỗi chi tiết
          </p>
        </div>

        {/* Khối upload & cấu hình */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn đối tượng dữ liệu:
              </label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value as any)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="students">Hồ sơ Học viên (Students)</option>
                <option value="guardians">Hồ sơ Phụ huynh (Guardians)</option>
                <option value="teachers">Danh sách Giáo viên (Teachers)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Tải mẫu file chuẩn:
              </label>
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => alert('Đang tải file mẫu import_mau_corelink.xlsx')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-blue-600 shadow-sm hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Tải template mẫu .xlsx chuẩn
                </button>
              </div>
            </div>
          </div>

          {/* Vùng kéo thả file */}
          <div
            onClick={handleSimulateUpload}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
          >
            <Upload className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Nhấn để chọn file Excel (.xlsx, .csv) từ máy tính'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Hỗ trợ dung lượng tối đa 15MB. Các cột không nằm trong mẫu chuẩn sẽ tự động lưu vào custom_fields (TC-142).
            </p>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              onClick={handleProcessImport}
              disabled={!fileName || isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Đang phân tích & nhập...' : 'Bắt đầu xử lý nhập dữ liệu'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Báo cáo kết quả nhập (TC-141, TC-142, TC-143) */}
        {importResult && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Hoàn tất xử lý
                </span>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Báo Cáo Tiến Trình Nhập Dữ Liệu ({importResult.importId})
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-400">
                Key: {importResult.idempotencyKey} (TC-143 Chống trùng)
              </span>
            </div>

            {/* Chỉ số hàng thành công & lỗi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Tổng số dòng quét</div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {importResult.totalRows} dòng
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold text-emerald-700">Dòng hợp lệ đã nhập</div>
                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {importResult.okRowsCount} dòng
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                <div className="text-xs font-semibold text-rose-700">Dòng lỗi bị cô lập</div>
                <div className="mt-1 text-2xl font-black text-rose-700">
                  {importResult.errorRowsCount} dòng
                </div>
              </div>
            </div>

            {/* Cột lạ tìm thấy (TC-142) */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-900">
                <FileText className="h-4 w-4 text-purple-700" />
                Phát hiện & lưu trường tùy biến (custom_fields - TC-142):
              </div>
              <p className="mt-1 text-purple-700">
                Hệ thống tự động phát hiện các cột lạ trong file: {importResult.customFieldsFound.join(', ')} và đã lưu an toàn vào cấu trúc custom_fields JSON của học sinh.
              </p>
            </div>

            {/* Bảng kê dòng lỗi chi tiết (TC-141) */}
            {importResult.errorRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Danh Sách Dòng Lỗi Kèm Lý Do Chi Tiết (TC-141)
                  </h3>
                  <button
                    onClick={() => alert('Đang xuất danh sách các dòng lỗi thành file error_rows.xlsx')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5" /> Xuất file các dòng lỗi (.xlsx)
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
                      <tr>
                        <th className="p-3">Dòng #</th>
                        <th className="p-3">Dữ liệu nguồn</th>
                        <th className="p-3">Nguyên nhân từ chối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {importResult.errorRows.map((er: any, idx: number) => (
                        <tr key={idx} className="hover:bg-rose-50/40">
                          <td className="p-3 font-mono font-bold text-rose-600">Dòng {er.row}</td>
                          <td className="p-3 font-mono text-slate-600">
                            {JSON.stringify(er.data)}
                          </td>
                          <td className="p-3 font-semibold text-rose-700">{er.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
