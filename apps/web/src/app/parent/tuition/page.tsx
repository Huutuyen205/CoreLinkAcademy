'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  QrCode,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  description: string;
  originalAmount: number;
  discountAmount: number;
  discountReason?: string;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  receiptNo?: string;
  paymentHistory: {
    date: string;
    amount: number;
    method: string;
    receiptNo: string;
  }[];
}

export default function ParentTuitionPage() {
  const [selectedChild, setSelectedChild] = useState('Lê Minh Khôi (M01)');
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'qr' | 'bank'>('qr');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const invoices: Invoice[] = [
    {
      id: 'inv-101',
      invoiceNo: 'HD-2026-0891',
      description: 'Học phí Khóa Cambridge Movers Q4/2026 (3 tháng)',
      originalAmount: 6000000,
      discountAmount: 1000000,
      discountReason: 'Ưu đãi đăng ký sớm & anh chị em',
      netAmount: 5000000,
      paidAmount: 5000000,
      remainingAmount: 0,
      dueDate: '15/10/2026',
      status: 'paid',
      receiptNo: 'REC-2026-00342',
      paymentHistory: [
        {
          date: '10/10/2026 14:30',
          amount: 5000000,
          method: 'Chuyển khoản Vietcombank',
          receiptNo: 'REC-2026-00342',
        },
      ],
    },
    {
      id: 'inv-102',
      invoiceNo: 'HD-2026-1045',
      description: 'Học phí Khóa Kỹ năng Nói & Phát âm Chuyên sâu',
      originalAmount: 4500000,
      discountAmount: 500000,
      discountReason: 'Học bổng chuyên cần',
      netAmount: 4000000,
      paidAmount: 2000000,
      remainingAmount: 2000000,
      dueDate: '10/11/2026',
      status: 'partial',
      paymentHistory: [
        {
          date: '25/10/2026 09:15',
          amount: 2000000,
          method: 'Quét mã VietQR',
          receiptNo: 'REC-2026-00412',
        },
      ],
    },
    {
      id: 'inv-103',
      invoiceNo: 'HD-2026-1188',
      description: 'Lệ phí thi chứng chỉ Cambridge quốc tế (Đợt tháng 12)',
      originalAmount: 1850000,
      discountAmount: 0,
      netAmount: 1850000,
      paidAmount: 0,
      remainingAmount: 1850000,
      dueDate: '20/11/2026',
      status: 'unpaid',
      paymentHistory: [],
    },
  ];

  const totalRemaining = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  const handlePay = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentModalInvoice(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header & Chọn con */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                S23 • Cổng Phụ Huynh
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Nhận thông báo học phí
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Học Phí & Biên Nhận Điện Tử
            </h1>
            <p className="text-sm text-slate-600">
              Tra cứu công nợ, nhận hoá đơn và thanh toán trực tuyến an toàn
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <span className="px-2 text-xs font-medium text-slate-500">Học sinh:</span>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none"
            >
              <option value="Lê Minh Khôi (M01)">Lê Minh Khôi (Lớp Movers 01)</option>
              <option value="Lê Bảo Hân (F02)">Lê Bảo Hân (Lớp Flyers 02)</option>
            </select>
          </div>
        </div>

        {/* Tổng quan công nợ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-sm font-semibold">Cần thanh toán</span>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-700 md:text-3xl">
              {totalRemaining.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-rose-600">Hạn gần nhất: 10/11/2026</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-sm font-semibold">Đã hoàn tất thanh toán</span>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700 md:text-3xl">
              {totalPaid.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-emerald-600">Đã nhận biên lai điện tử</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-sm font-semibold">Tiện ích trực tuyến</span>
              <Receipt className="h-5 w-5" />
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              Cấp số biên nhận tự động
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Khóa dòng chống trùng REC-2026-XXXXX
            </p>
          </div>
        </div>

        {/* Danh sách các khoản phí */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Chi Tiết Các Khoản Học Phí</h2>
          <div className="mt-4 space-y-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {inv.invoiceNo}
                    </span>
                    {inv.status === 'paid' && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Đã thanh toán
                      </span>
                    )}
                    {inv.status === 'partial' && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Thanh toán 1 phần
                      </span>
                    )}
                    {inv.status === 'unpaid' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        Chưa thanh toán
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{inv.description}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      Gốc: <strong className="text-slate-800">{inv.originalAmount.toLocaleString('vi-VN')} đ</strong>
                    </span>
                    {inv.discountAmount > 0 && (
                      <span className="text-emerald-600">
                        Giảm giá: -{inv.discountAmount.toLocaleString('vi-VN')} đ ({inv.discountReason})
                      </span>
                    )}
                    <span>
                      Hạn: <strong className="text-slate-800">{inv.dueDate}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between gap-4 border-t border-slate-100 pt-3 md:flex-col md:items-end md:border-t-0 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-500">Còn lại phải đóng</div>
                    <div className="text-lg font-bold text-slate-900">
                      {inv.remainingAmount.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.status !== 'paid' ? (
                      <button
                        onClick={() => setPaymentModalInvoice(inv)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <CreditCard className="h-4 w-4" /> Thanh toán ngay
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`Đang tải biên lai điện tử ${inv.receiptNo}`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Biên nhận {inv.receiptNo}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Thanh Toán */}
        {paymentModalInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Thanh Toán Học Phí</h3>
                <button
                  onClick={() => setPaymentModalInvoice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {paymentSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
                  <h4 className="text-lg font-bold text-slate-900">Giao dịch thành công!</h4>
                  <p className="text-sm text-slate-600">
                    Đã cấp biên lai điện tử <strong>REC-2026-00452</strong>
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="text-slate-500">Nội dung khoản thu:</div>
                    <div className="font-semibold text-slate-900">{paymentModalInvoice.description}</div>
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                      <span>Số tiền đóng:</span>
                      <span className="text-blue-600">
                        {paymentModalInvoice.remainingAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Chọn phương thức:</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('qr')}
                        className={`flex flex-col items-center rounded-xl border p-3 text-xs font-semibold transition ${
                          selectedMethod === 'qr'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="h-5 w-5 mb-1" /> VietQR
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('vnpay')}
                        className={`flex flex-col items-center rounded-xl border p-3 text-xs font-semibold transition ${
                          selectedMethod === 'vnpay'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="h-5 w-5 mb-1" /> VNPAY
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('bank')}
                        className={`flex flex-col items-center rounded-xl border p-3 text-xs font-semibold transition ${
                          selectedMethod === 'bank'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Receipt className="h-5 w-5 mb-1" /> Chuyển khoản
                      </button>
                    </div>
                  </div>

                  {selectedMethod === 'qr' && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs text-slate-400">
                        [Mã QR Thanh Toán 2.000.000 đ]
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Quét mã bằng ứng dụng ngân hàng bất kỳ để thanh toán tức thì
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentModalInvoice(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handlePay}
                      className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                    >
                      Xác nhận đã thanh toán
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
