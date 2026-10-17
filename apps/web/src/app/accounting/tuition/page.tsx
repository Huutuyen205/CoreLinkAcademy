'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Download,
  Bell,
  Search,
  Filter,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  studentName: string;
  studentCode: string;
  phone: string;
  amountVnd: number;
  discountVnd: number;
  netVnd: number;
  paidVnd: number;
  remainingVnd: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  lastReceipt?: string;
}

export default function AccountingTuitionPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<InvoiceItem | null>(null);
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);

  // Form state tạo hoá đơn
  const [createForm, setCreateForm] = useState({
    studentName: 'Nguyễn Gia Bảo',
    amount: 6000000,
    discount: 1000000,
    discountReason: 'Đăng ký sớm kỳ mới',
    description: 'Học phí IELTS Khóa 3 tháng',
    dueDate: '2026-11-20',
  });

  // Form state ghi nhận thanh toán
  const [paymentForm, setPaymentForm] = useState({
    amount: 2000000,
    method: 'bank_transfer',
    note: 'Chuyển khoản VCB',
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: 'inv-1',
      invoiceNo: 'HD-2026-001',
      studentName: 'Nguyễn Gia Bảo',
      studentCode: 'HS-S10-01',
      phone: '0988880105',
      amountVnd: 6000000,
      discountVnd: 1000000,
      netVnd: 5000000,
      paidVnd: 5000000,
      remainingVnd: 0,
      dueDate: '15/10/2026',
      status: 'paid',
      lastReceipt: 'REC-2026-00001',
    },
    {
      id: 'inv-2',
      invoiceNo: 'HD-2026-002',
      studentName: 'Lê Minh Khôi',
      studentCode: 'HS-S09-01',
      phone: '0912345678',
      amountVnd: 8000000,
      discountVnd: 0,
      netVnd: 8000000,
      paidVnd: 3000000,
      remainingVnd: 5000000,
      dueDate: '20/11/2026',
      status: 'partial',
      lastReceipt: 'REC-2026-00002',
    },
    {
      id: 'inv-3',
      invoiceNo: 'HD-2026-003',
      studentName: 'Trần Tuấn Kiệt',
      studentCode: 'HS-S09-03',
      phone: '0933334444',
      amountVnd: 4500000,
      discountVnd: 500000,
      netVnd: 4000000,
      paidVnd: 0,
      remainingVnd: 4000000,
      dueDate: '25/11/2026',
      status: 'unpaid',
    },
  ]);

  const filtered = invoices.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSearch =
      i.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const totalReceivable = invoices.reduce((s, i) => s + i.netVnd, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidVnd, 0);
  const totalDebt = totalReceivable - totalPaid;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const net = createForm.amount - createForm.discount;
    const newInv: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNo: `HD-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      studentName: createForm.studentName,
      studentCode: 'HS-NEW',
      phone: '0988000111',
      amountVnd: createForm.amount,
      discountVnd: createForm.discount,
      netVnd: net,
      paidVnd: 0,
      remainingVnd: net,
      dueDate: createForm.dueDate,
      status: 'unpaid',
    };
    setInvoices([newInv, ...invoices]);
    setShowCreateModal(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    const newPaid = showPaymentModal.paidVnd + paymentForm.amount;
    const newDebt = showPaymentModal.netVnd - newPaid;
    const newStatus = newDebt <= 0 ? 'paid' : 'partial';
    const newReceipt = `REC-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === showPaymentModal.id
          ? {
              ...i,
              paidVnd: newPaid,
              remainingVnd: newDebt > 0 ? newDebt : 0,
              status: newStatus,
              lastReceipt: newReceipt,
            }
          : i,
      ),
    );
    setShowPaymentModal(null);
  };

  const handleRemindFee = (inv: InvoiceItem) => {
    setRemindSuccess(
      `Đã gửi thông báo nhắc học phí cho phụ huynh ${inv.studentName} có receives_fee_notice = true (TC-128)`,
    );
    setTimeout(() => setRemindSuccess(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = 'Mã hoá đơn,Học sinh,Số điện thoại,Phải thu,Đã đóng,Còn nợ,Trạng thái\n';
    const rows = filtered
      .map(
        (i) =>
          `${i.invoiceNo},"${i.studentName}",${i.phone},${i.netVnd},${i.paidVnd},${i.remainingVnd},${i.status}`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-hoc-phi-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                S40 • Phân Hệ Kế Toán
              </span>
              <span className="text-xs font-semibold text-slate-500">M11 Quản lý học phí</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Khoản Phải Thu & Sổ Quỹ Thu Tiền
            </h1>
            <p className="text-sm text-slate-600">
              Cấp biên nhận tự động REC-YYYY-XXXXX, nhắc phí phân quyền và báo cáo công nợ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Xuất CSV (TC-136)
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Tạo khoản phải thu mới
            </button>
          </div>
        </div>

        {/* Thông báo nhắc phí thành công */}
        {remindSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{remindSuccess}</span>
          </div>
        )}

        {/* Thẻ chỉ số tổng quan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Tổng phải thu thực tế</div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {totalReceivable.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-slate-400">Đã trừ chiết khấu & giảm giá</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">Đã thu thực tế</div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {totalPaid.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-emerald-600">
              Tỷ lệ thu hồi: {((totalPaid / totalReceivable) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
            <div className="text-xs font-semibold text-rose-700">Công nợ còn tồn</div>
            <div className="mt-2 text-2xl font-black text-rose-700">
              {totalDebt.toLocaleString('vi-VN')} đ
            </div>
            <p className="mt-1 text-xs text-rose-600">Cần theo dõi đôn đốc</p>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, mã học sinh, số điện thoại..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' && 'Tất cả'}
                {st === 'unpaid' && 'Chưa đóng'}
                {st === 'partial' && 'Đóng 1 phần'}
                {st === 'paid' && 'Đã hoàn tất'}
              </button>
            ))}
          </div>
        </div>

        {/* Bảng danh sách hoá đơn */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3.5">Hoá đơn / Học sinh</th>
                <th className="p-3.5">Học phí gốc</th>
                <th className="p-3.5">Giảm giá</th>
                <th className="p-3.5">Phải thu</th>
                <th className="p-3.5">Đã đóng</th>
                <th className="p-3.5">Còn nợ</th>
                <th className="p-3.5 text-center">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{inv.studentName}</div>
                    <div className="font-mono text-slate-400">
                      {inv.invoiceNo} • {inv.studentCode} • {inv.phone}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">
                    {inv.amountVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 font-mono text-emerald-600">
                    {inv.discountVnd > 0 ? `-${inv.discountVnd.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {inv.netVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-700">
                    {inv.paidVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 font-mono font-bold text-rose-600">
                    {inv.remainingVnd.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 text-center">
                    {inv.status === 'paid' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        Đã đóng
                      </span>
                    )}
                    {inv.status === 'partial' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                        Đóng 1 phần
                      </span>
                    )}
                    {inv.status === 'unpaid' && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                        Chưa đóng
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    {inv.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => handleRemindFee(inv)}
                          title="Nhắc phí tự động tới phụ huynh (TC-128)"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Bell className="h-3.5 w-3.5 text-amber-600" />
                        </button>
                        <button
                          onClick={() => {
                            setShowPaymentModal(inv);
                            setPaymentForm({
                              amount: inv.remainingVnd,
                              method: 'bank_transfer',
                              note: 'Kế toán ghi nhận',
                            });
                          }}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          Thu tiền
                        </button>
                      </>
                    )}
                    {inv.lastReceipt && (
                      <span className="font-mono text-xs text-blue-600">
                        {inv.lastReceipt}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Tạo Khoản Phải Thu */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                Tạo Khoản Phải Thu Mới (TC-125)
              </h3>
              <form onSubmit={handleCreateInvoice} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Học sinh:</label>
                  <input
                    type="text"
                    value={createForm.studentName}
                    onChange={(e) => setCreateForm({ ...createForm, studentName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700">Số tiền gốc (VND):</label>
                    <input
                      type="number"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Giảm giá (VND):</label>
                    <input
                      type="number"
                      value={createForm.discount}
                      onChange={(e) => setCreateForm({ ...createForm, discount: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Lý do giảm giá:</label>
                  <input
                    type="text"
                    value={createForm.discountReason}
                    onChange={(e) => setCreateForm({ ...createForm, discountReason: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Mô tả khoản thu:</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hạn đóng:</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow"
                  >
                    Tạo hoá đơn
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ghi Nhận Thanh Toán */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">
                Ghi Nhận Thu Tiền & Cấp Biên Nhận (TC-126, TC-127)
              </h3>
              <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">Học sinh: <strong>{showPaymentModal.studentName}</strong></div>
                  <div className="text-slate-500">Còn nợ: <strong className="text-rose-600">{showPaymentModal.remainingVnd.toLocaleString('vi-VN')} đ</strong></div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Số tiền thu đợt này (VND):</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Phương thức thanh toán:</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                  >
                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Thẻ POS</option>
                    <option value="vnpay">VNPAY</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Ghi chú:</label>
                  <input
                    type="text"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow"
                  >
                    Xác nhận & Cấp số biên lai
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
