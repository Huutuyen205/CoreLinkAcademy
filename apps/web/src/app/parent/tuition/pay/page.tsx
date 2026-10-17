'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function TuitionPaymentPage() {
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [reconciliationState, setReconciliationState] = useState<'pending' | 'reconciling' | 'paid'>('pending');
  const [receiptData, setReceiptData] = useState<{ receiptNo: string; paidAt: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const invoice = {
    id: 'inv-s16-9921',
    code: 'HD-2026-1029',
    studentName: 'Hoàng Minh Khang',
    studentCode: 'HS-2026-089',
    description: 'Học phí Khóa Tiếng Anh Thiếu Niên K12 (Kỳ Thu 2026)',
    amountVnd: 5000000,
    discountVnd: 500000,
    discountReason: 'Mã ưu đãi Chiến Dịch Hè SUMMER26 (FR-109)',
    netAmountVnd: 4500000,
    dueDate: '15/11/2026',
    bankAccount: '19038291028301',
    bankName: 'Techcombank - Chi nhánh Hà Nội',
    accountName: 'HE THONG ANH NGU CORELINK ACADEMY',
    transferContent: 'CORELINK HD20261029',
  };

  const handleSimulateWebhook = () => {
    setIsSimulatingWebhook(true);
    setReconciliationState('reconciling');

    setTimeout(() => {
      setIsSimulatingWebhook(false);
      setReconciliationState('paid');
      const year = new Date().getFullYear();
      const num = Math.floor(100000 + Math.random() * 900000);
      setReceiptData({
        receiptNo: `BN-${year}-${num}`,
        paidAt: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      });
    }, 1200);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/parent/tuition"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Học phí
          </Link>
          <span className="text-xs font-semibold text-slate-500">Mã hóa đơn: {invoice.code}</span>
        </div>

        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Cổng Thanh Toán Trực Tuyến</span>
              <span>•</span>
              <span>Tự Đối Soát Trong 5 Phút (TC-132)</span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <QrCode className="w-6 h-6 text-amber-300" />
              Thanh Toán Học Phí Trực Tuyến VietQR
            </h1>
            <p className="text-teal-100 text-xs mt-1">
              Giao dịch an toàn được xác thực chữ ký điện tử HMAC. Hệ thống tự động cập nhật trạng thái đã đóng trong vòng 5 phút ngay khi nhận tiền.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> HMAC-SHA256 Verified
            </span>
          </div>
        </div>

        {/* Payment Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: VietQR Code & Payment Info (6 Cols) */}
          <div className="md:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-center flex flex-col items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Quét Mã VietQR Ngân Hàng</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sử dụng mọi ứng dụng ngân hàng hoặc ví điện tử</p>
            </div>

            {/* QR Visual Canvas */}
            <div className="relative p-4 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/50 flex flex-col items-center justify-center">
              <div className="w-56 h-56 bg-white rounded-xl shadow-inner border border-slate-200 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                {/* Simulated QR Pattern */}
                <div className="w-full h-full border-4 border-slate-900 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                  </div>
                  <div className="text-center font-black text-xs text-slate-900 tracking-widest my-auto">
                    VIETQR
                    <br />
                    <span className="text-[10px] text-teal-700 font-mono">4.500.000 đ</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                  </div>
                </div>

                {reconciliationState === 'paid' && (
                  <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-2 animate-fadeIn">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                    <p className="font-black text-sm">ĐÃ ĐỐI SOÁT XONG</p>
                    <p className="text-[11px] text-emerald-100">Khoản thu đã chuyển sang &ldquo;Đã đóng&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="w-full space-y-2 text-xs text-left">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Ngân hàng thụ hưởng:</p>
                  <p className="font-bold text-slate-800">{invoice.bankName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Số tài khoản:</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{invoice.bankAccount}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(invoice.bankAccount, 'stk')}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-1"
                >
                  {copiedField === 'stk' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Nội dung chuyển khoản (Bắt buộc):</p>
                  <p className="font-mono font-bold text-teal-800 text-sm">{invoice.transferContent}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(invoice.transferContent, 'content')}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-1"
                >
                  {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Invoice Summary & Auto Reconciliation Simulator (6 Cols) */}
          <div className="md:col-span-6 space-y-5">
            {/* Invoice Breakdown Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                Chi Tiết Khoản Thu Học Phí
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Học sinh:</span>
                  <span className="font-bold text-slate-800">{invoice.studentName} ({invoice.studentCode})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Nội dung:</span>
                  <span className="font-medium text-slate-700 text-right">{invoice.description}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Hạn nộp:</span>
                  <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Học phí gốc:</span>
                  <span className="font-semibold text-slate-800">{formatVND(invoice.amountVnd)}</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Khuyến mãi áp dụng:
                  </span>
                  <span className="font-bold">-{formatVND(invoice.discountVnd)}</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-900 text-sm">Tổng tiền cần thanh toán:</span>
                  <span className="font-black text-xl text-teal-700">{formatVND(invoice.netAmountVnd)}</span>
                </div>
              </div>
            </div>

            {/* Reconciliation Status Card (TC-132) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Tiến Trình Đối Soát (TC-132)
                </h3>
                {reconciliationState === 'paid' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng (paid)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Đang chờ thanh toán
                  </span>
                )}
              </div>

              {reconciliationState === 'pending' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p>
                    Hệ thống sẽ tự động lắng nghe Webhook ngân hàng. Khi phụ huynh chuyển khoản thành công, hóa đơn sẽ tự động đối soát trong vòng 5 phút mà không cần tải ảnh biên lai thủ công.
                  </p>
                  <button
                    onClick={handleSimulateWebhook}
                    disabled={isSimulatingWebhook}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    {isSimulatingWebhook
                      ? 'Đang nhận Webhook & xác thực HMAC...'
                      : 'Mô phỏng Thanh toán & Đối soát tự động (TC-132)'}
                  </button>
                </div>
              )}

              {reconciliationState === 'reconciling' && (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center text-xs space-y-2 animate-pulse">
                  <p className="font-bold text-teal-800">Đang nhận thông báo Webhook từ cổng thanh toán...</p>
                  <p className="text-teal-600">Kiểm tra chữ ký số HMAC-SHA256 • Cập nhật khoản thu • Xuất biên lai điện tử</p>
                </div>
              )}

              {reconciliationState === 'paid' && receiptData && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Biên lai điện tử đã phát hành: {receiptData.receiptNo}</span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <p>Thời gian đối soát thành công: {receiptData.paidAt}</p>
                    <p>Hình thức: Cổng thanh toán trực tuyến (gateway) • Phương thức: VietQR</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => alert(`📥 Đang tải biên lai thanh toán ${receiptData.receiptNo}.pdf`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải biên lai PDF
                    </button>
                    <Link
                      href="/parent/tuition"
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                    >
                      Về danh sách hóa đơn
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
