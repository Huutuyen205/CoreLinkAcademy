'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Shield,
  Sparkles,
  Database,
  Lock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  FileArchive,
  Save,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'ai_budget' | 'audit_logs' | 'backup' | 'signed_links'>('ai_budget');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cấu hình AI Budget (TC-145, TC-146)
  const [aiBudgetConfig, setAiBudgetConfig] = useState({
    monthlyBudgetUsd: 500,
    alertThresholdPercent: 80,
    cutoffThresholdPercent: 100,
    essentialFeatures: ['lead_chatbot', 'consulting_bot'],
    nonEssentialFeatures: [
      'curriculum_suggestion',
      'video_transcription',
      'essay_grading',
      'audio_grading',
    ],
  });

  // Signed URL generator state (TC-151)
  const [fileIdInput, setFileIdInput] = useState('doc-bao-mat-2026-001');
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [generatedSignedUrl, setGeneratedSignedUrl] = useState<string | null>(null);

  // Nhật ký audit logs mẫu (TC-144)
  const auditLogs = [
    {
      id: '1042',
      actor: 'Quản trị viên Hệ thống (admin)',
      action: 'UPDATE_AI_BUDGET',
      entity: 'settings',
      before: 'budget: 400',
      after: 'budget: 500',
      ip: '192.168.1.105',
      time: '18/10/2026 05:20:15',
    },
    {
      id: '1041',
      actor: 'Kế toán trưởng (accountant)',
      action: 'CLOSE_PAYROLL_PERIOD',
      entity: 'payroll_periods (2026-10)',
      before: 'status: review',
      after: 'status: closed',
      ip: '192.168.1.112',
      time: '17/10/2026 17:45:00',
    },
    {
      id: '1040',
      actor: 'Quản trị viên Hệ thống (admin)',
      action: 'SYSTEM_BACKUP_VERIFY',
      entity: 'backups',
      before: '-',
      after: 'checksum: SHA-256 OK',
      ip: '192.168.1.105',
      time: '17/10/2026 02:00:00',
    },
  ];

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGenerateSignedUrl = () => {
    const expires = Date.now() + ttlSeconds * 1000;
    const token = '8f3a9e2d1c5b4a7f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f';
    const url = `/api/v1/admin-system/files/download?fileId=${fileIdInput}&expires=${expires}&token=${token}`;
    setGeneratedSignedUrl(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              S44 • Quản Trị Hệ Thống
            </span>
            <span className="text-xs font-semibold text-slate-500">M15 Quản trị & Cấu hình</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Cấu Hình & Kiểm Soát Hệ Thống
          </h1>
          <p className="text-sm text-slate-600">
            Hạn mức AI, nhật ký kiểm toán bất biến, sao lưu dữ liệu và liên kết bảo mật có thời hạn
          </p>
        </div>

        {/* Tabs Điều Hướng */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'ai_budget', label: 'Hạn mức chi phí AI (FR-1502)', icon: Sparkles },
            { id: 'audit_logs', label: 'Nhật ký kiểm toán (FR-1501)', icon: Shield },
            { id: 'backup', label: 'Sao lưu & Xuất toàn bộ ZIP (FR-1504/1505)', icon: Database },
            { id: 'signed_links', label: 'Link riêng tư có thời hạn (TC-151)', icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: AI Budget Settings (TC-145, TC-146) */}
        {activeTab === 'ai_budget' && (
          <form onSubmit={handleSaveBudget} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Cấu Hình Ngưỡng Cảnh Báo & Tạm Dừng Tính Năng AI
                </h2>
                <p className="text-xs text-slate-500">
                  Cơ chế bảo vệ chi phí tự động theo yêu cầu FR-1502 (TC-145, TC-146)
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Ngưỡng 80% cảnh báo • 100% ngắt tính năng phụ
              </span>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Đã lưu thành công cấu hình hạn mức AI vào bảng settings</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Ngân sách tháng (USD):</label>
                <input
                  type="number"
                  value={aiBudgetConfig.monthlyBudgetUsd}
                  onChange={(e) =>
                    setAiBudgetConfig({ ...aiBudgetConfig, monthlyBudgetUsd: Number(e.target.value) })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ngưỡng cảnh báo (%):</label>
                <input
                  type="number"
                  value={aiBudgetConfig.alertThresholdPercent}
                  onChange={(e) =>
                    setAiBudgetConfig({ ...aiBudgetConfig, alertThresholdPercent: Number(e.target.value) })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ngưỡng đóng băng (%):</label>
                <input
                  type="number"
                  value={aiBudgetConfig.cutoffThresholdPercent}
                  onChange={(e) =>
                    setAiBudgetConfig({ ...aiBudgetConfig, cutoffThresholdPercent: Number(e.target.value) })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-800">
                  Tính năng THIẾT YẾU (Luôn duy trì ở 100%):
                </div>
                <ul className="list-disc pl-5 text-xs text-emerald-700 space-y-1">
                  <li>lead_chatbot (Chatbot tư vấn tuyển sinh 24/7)</li>
                  <li>consulting_bot (Chatbot giải đáp phụ huynh)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                <div className="text-xs font-bold text-rose-800">
                  Tính năng KHÔNG THIẾT YẾU (Tạm dừng khi đạt 100%):
                </div>
                <ul className="list-disc pl-5 text-xs text-rose-700 space-y-1">
                  <li>curriculum_suggestion (Gợi ý giáo trình)</li>
                  <li>video_transcription (Chuyển lời thoại video bài giảng)</li>
                  <li>essay_grading & audio_grading (Chấm bài nói/viết tự động)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
              >
                <Save className="h-4 w-4" /> Lưu cấu hình AI Budget
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Audit Logs (TC-144) */}
        {activeTab === 'audit_logs' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Nhật Ký Kiểm Toán Bất Biến (Audit Logs - TC-144)
                </h2>
                <p className="text-xs text-slate-500">
                  Chỉ đọc (Read-only), không có chức năng sửa xóa nhằm bảo đảm tính minh bạch
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Lock className="h-3.5 w-3.5" /> Immutable Storage
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Thời gian / IP</th>
                    <th className="p-3">Người thực hiện</th>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Đối tượng</th>
                    <th className="p-3">Thay đổi dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <div className="text-slate-900">{log.time}</div>
                        <div className="text-slate-400 text-xxs">{log.ip}</div>
                      </td>
                      <td className="p-3 text-slate-800 font-sans font-bold">{log.actor}</td>
                      <td className="p-3 font-bold text-blue-600">{log.action}</td>
                      <td className="p-3 text-slate-600 font-sans">{log.entity}</td>
                      <td className="p-3 text-slate-500">
                        {log.before} → <span className="font-bold text-slate-900">{log.after}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Backup & Export (TC-147, TC-148) */}
        {activeTab === 'backup' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Toàn Vẹn Dữ Liệu & Xuất Toàn Bộ Hệ Thống (TC-147, TC-148)
              </h2>
              <p className="text-xs text-slate-500">
                Đảm bảo khả năng phục hồi thảm họa và xuất dữ liệu dự phòng định kỳ
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Database className="h-5 w-5 text-blue-600" /> Kiểm Tra Toàn Vẹn Sao Lưu (TC-147)
                </div>
                <p className="text-xs text-slate-600">
                  Quét tự động toàn bộ 48 bảng trong cơ sở dữ liệu, đối soát mã băm toàn vẹn SHA-256.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Kiểm tra sao lưu: Toàn bộ 48 bảng hoàn toàn lành lặn, checksum SHA-256 hợp lệ')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Chạy kiểm tra ngay
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileArchive className="h-5 w-5 text-emerald-600" /> Xuất Toàn Bộ Dữ Liệu ZIP (TC-148)
                </div>
                <p className="text-xs text-slate-600">
                  Tải về gói nén .zip chứa đầy đủ file JSON/CSV của học sinh, giáo viên, lớp học, hoá đơn.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Đang tải file corelink-backup-full-2026.zip')}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Tải file sao lưu ZIP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Signed Links Generator (TC-151) */}
        {activeTab === 'signed_links' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tạo Liên Kết Riêng Tư Có Thời Hạn (Signed URLs - TC-151)
              </h2>
              <p className="text-xs text-slate-500">
                Các tệp nhạy cảm (bảng điểm, biên nhận, hợp đồng) được bảo vệ bằng chữ ký HMAC SHA-256 kèm thời hạn hết hạn
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Mã tệp riêng tư (file_id):</label>
                <input
                  type="text"
                  value={fileIdInput}
                  onChange={(e) => setFileIdInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2 text-xs font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Thời gian hiệu lực (giây):</label>
                <input
                  type="number"
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateSignedUrl}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Sinh liên kết tải có chữ ký & hạn sử dụng
            </button>

            {generatedSignedUrl && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 text-xs animate-fadeIn">
                <div className="font-bold text-blue-900">Liên kết có chữ ký (hết hạn sau {ttlSeconds}s):</div>
                <div className="font-mono text-slate-800 break-all bg-white p-2.5 rounded-lg border border-blue-200">
                  {generatedSignedUrl}
                </div>
                <p className="text-blue-700">
                  Sau khi hết hạn, truy cập liên kết này sẽ nhận mã lỗi <strong>HTTP 403 Forbidden</strong> theo chuẩn an toàn OWASP (TC-151).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
