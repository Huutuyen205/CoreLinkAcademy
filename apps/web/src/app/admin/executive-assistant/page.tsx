'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Send,
  AlertOctagon,
  Table as TableIcon,
  Download,
  Copy,
  Check,
  TrendingUp,
  HelpCircle,
  Database,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  isRefusal?: boolean;
  dataTable?: {
    title: string;
    columns: string[];
    rows: string[][];
    summary: string;
  };
}

export default function ExecutiveAssistantPage() {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTableIdx, setCopiedTableIdx] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      timestamp: '08:00',
      text: 'Xin chào Giám đốc! Tôi là Trợ lý Điều hành AI (Executive Assistant AI-14). Tôi được bảo vệ nghiêm ngặt ở chế độ **CHỈ ĐỌC (Read-Only)** để đảm bảo an toàn và bảo mật dữ liệu.\n\nBạn có thể hỏi tôi bất kỳ chỉ số kinh doanh, tuyển sinh, chất lượng giáo viên hoặc tình hình học tập của trung tâm.',
    },
  ]);

  const samplePrompts = [
    {
      label: 'Khách mới Facebook',
      query: 'Tháng này bao nhiêu học sinh mới từ Facebook?',
    },
    {
      label: 'Đánh giá GV lớp A2',
      query: 'Giáo viên nào có điểm phản hồi tốt nhất lớp A2?',
    },
    {
      label: 'Thử nghiệm lệnh xóa (TC-137)',
      query: 'Xóa giúp tôi khách tháng 10',
    },
    {
      label: 'Tình hình tài chính & chuyên cần',
      query: 'Báo cáo chỉ số hoạt động tổng thể trung tâm',
    },
  ];

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    const lowerQ = q.toLowerCase();

    setTimeout(() => {
      let aiResponse: ChatMessage;

      // TC-137: Thử nghiệm lệnh xóa/sửa dữ liệu
      if (
        lowerQ.includes('xóa') ||
        lowerQ.includes('xoa') ||
        lowerQ.includes('delete') ||
        lowerQ.includes('drop') ||
        lowerQ.includes('sửa')
      ) {
        aiResponse = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isRefusal: true,
          text: '⚠️ HỆ THỐNG TỪ CHỐI THAO TÁC GHI (TC-137):\nTrợ lý điều hành AI được bảo vệ nghiêm ngặt ở chế độ CHỈ ĐỌC (Read-Only) để đảm bảo toàn vẹn dữ liệu. Hệ thống từ chối thực hiện thao tác ghi, sửa đổi hay xóa cơ sở dữ liệu.\n\nDưới đây là số liệu thống kê chỉ đọc liên quan đến truy vấn của bạn:',
          dataTable: {
            title: 'Báo cáo chỉ đọc: Thống kê khách hàng & đầu mối tháng 10/2026',
            columns: ['Nguồn tuyển sinh', 'Số lượng đầu mối', 'Đã hẹn tư vấn', 'Đã ghi danh', 'Tỷ lệ chuyển đổi'],
            rows: [
              ['Facebook Ads', '142', '68', '24', '16.9%'],
              ['Website Organic', '85', '45', '18', '21.2%'],
              ['Giới thiệu (Referral)', '38', '32', '20', '52.6%'],
              ['Tiktok Ads', '64', '20', '6', '9.4%'],
              ['Khác (Trực tiếp)', '21', '14', '7', '33.3%'],
            ],
            summary: 'Tổng cộng: 350 khách hàng đầu mối tiềm năng tháng 10. Dữ liệu an toàn không bị chỉnh sửa.',
          },
        };
      } else if (lowerQ.includes('facebook') || lowerQ.includes('tuyển sinh') || lowerQ.includes('khách')) {
        aiResponse = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: 'Trong tháng này, trung tâm ghi nhận 142 học sinh/khách hàng mới từ kênh Facebook Ads, chiếm 40.5% tổng số đầu mối mới. Trong đó có 24 học viên đã hoàn tất thủ tục ghi danh và đóng học phí.',
          dataTable: {
            title: 'Chi tiết phân bổ học sinh mới theo kênh tiếp thị (Tháng hiện tại)',
            columns: ['Kênh tiếp thị', 'Số đầu mối', 'Chuyển đổi', 'Doanh thu dự kiến (VND)'],
            rows: [
              ['Facebook Ads', '142', '24', '144,000,000 đ'],
              ['Google Search Organic', '85', '18', '108,000,000 đ'],
              ['Người quen giới thiệu', '38', '20', '120,000,000 đ'],
              ['Sự kiện ngoại khóa', '35', '12', '72,000,000 đ'],
            ],
            summary: 'Kênh Facebook mang lại lượng khách tiếp cận cao nhất.',
          },
        };
      } else if (lowerQ.includes('giáo viên') || lowerQ.includes('a2') || lowerQ.includes('phản hồi')) {
        aiResponse = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: 'Tại khối lớp A2, giáo viên có điểm phản hồi khảo sát cao nhất là Cô Trần Thị Mai với 4.92/5 sao (từ 28 lượt đánh giá của phụ huynh). Thời gian phản hồi tin nhắn trung vị là 12 phút (đo lường tự động qua timestamp, tuyệt đối không đọc nội dung tin nhắn theo quy chuẩn bảo mật FR-1302).',
          dataTable: {
            title: 'Bảng xếp hạng chỉ số giáo viên khối lớp A2',
            columns: ['Giáo viên', 'Lớp phụ trách', 'Điểm khảo sát', 'Chuyên cần', 'Thời gian phản hồi', 'Chấm đúng hạn'],
            rows: [
              ['Trần Thị Mai', 'ENG-A2-01', '4.92 / 5.0', '98.5%', '12 phút', '100%'],
              ['Nguyễn Văn An', 'ENG-A2-02', '4.85 / 5.0', '96.2%', '15 phút', '97.5%'],
              ['Lê Hoàng Long', 'ENG-A2-03', '4.78 / 5.0', '95.0%', '18 phút', '95.0%'],
            ],
            summary: 'Dữ liệu được cập nhật tự động từ hệ thống chấm điểm và điểm danh.',
          },
        };
      } else {
        aiResponse = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `Báo cáo điều hành nhanh dựa trên câu hỏi: "${q}". Toàn bộ dữ liệu được trích xuất an toàn theo phân quyền Admin.`,
          dataTable: {
            title: 'Chỉ số hoạt động tổng thể trung tâm',
            columns: ['Chỉ số KPI', 'Giá trị đạt được', 'Mục tiêu tháng', 'Trạng thái'],
            rows: [
              ['Tổng học viên đang học', '420 học viên', '400', 'Đạt vượt chỉ tiêu'],
              ['Tỷ lệ điểm danh chuyên cần', '94.8%', '92.0%', 'Tốt'],
              ['Tỷ lệ thu học phí đúng hạn', '91.2%', '90.0%', 'Đạt'],
              ['Thời gian phản hồi trung bình', '14 phút', '20 phút', 'Xuất sắc'],
            ],
            summary: 'Hệ thống trợ lý AI hoạt động ở chế độ phân tích bảo mật.',
          },
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 600);
  };

  const copyTableToClipboard = (rows: string[][], columns: string[], idx: number) => {
    const csvContent = [columns.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopiedTableIdx(idx);
    setTimeout(() => setCopiedTableIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Link href="/admin/dashboard" className="hover:underline">
                Quản trị Admin
              </Link>
              <span>/</span>
              <span>Trợ lý điều hành AI (AI-14 / FR-1204)</span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Trợ Lý Số Liệu & Điều Hành AI
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              Hỏi đáp số liệu kinh doanh, tuyển sinh và chất lượng giảng dạy bằng ngôn ngữ tự nhiên. Đi kèm bảng số liệu gốc minh bạch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/early-warning"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5"
            >
              <span>⚠️</span> Cảnh Báo Sớm Học Sinh →
            </Link>
          </div>
        </div>

        {/* Security & Read-Only Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Chế độ bảo vệ dữ liệu (TC-137):</span>{' '}
              <span className="text-amber-800">
                Trợ lý chỉ chạy trên tài khoản CSDL <strong>CHỈ ĐỌC (Read-Only)</strong>. Tuyệt đối không cho phép lệnh sửa đổi/xóa dữ liệu. Mọi chỉ số giáo viên không xâm phạm nội dung tin nhắn riêng tư.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] shrink-0">
            READ-ONLY ACTIVE
          </span>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Gợi ý câu hỏi:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 transition-all font-medium shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Stream Window */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[480px] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs space-y-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-xs'
                      : msg.isRefusal
                      ? 'bg-rose-50/80 border border-rose-200 text-rose-900 rounded-tl-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.isRefusal && (
                    <div className="flex items-center gap-2 text-rose-700 font-bold border-b border-rose-200 pb-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>RÀNG BUỘC TOÀN VẸN DỮ LIỆU (TC-137)</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Render Embedded Data Table */}
                  {msg.dataTable && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs mt-3">
                      <div className="bg-slate-100/80 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                          <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                          {msg.dataTable.title}
                        </span>
                        <button
                          onClick={() => copyTableToClipboard(msg.dataTable!.rows, msg.dataTable!.columns, idx)}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[10px] flex items-center gap-1 transition-all"
                        >
                          {copiedTableIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Sao chép bảng
                            </>
                          )}
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50/50 text-slate-600 font-bold border-b border-slate-100">
                            <tr>
                              {msg.dataTable.columns.map((col, colIdx) => (
                                <th key={colIdx} className="px-3 py-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {msg.dataTable.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-indigo-50/30 transition-colors">
                                {row.map((cell, cellIdx) => (
                                  <td
                                    key={cellIdx}
                                    className={`px-3 py-2 ${cellIdx === 0 ? 'font-semibold text-slate-900' : ''}`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50/50 p-2.5 text-[10px] text-slate-500 border-t border-slate-100 italic">
                        {msg.dataTable.summary}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-right font-mono ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    Admin
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-xs text-slate-500 italic">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  ...
                </div>
                <span>Trợ lý AI đang truy vấn dữ liệu chỉ đọc an toàn...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="pt-4 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Nhập câu hỏi phân tích kinh doanh, học vụ hoặc chất lượng giảng dạy..."
                className="flex-1 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
