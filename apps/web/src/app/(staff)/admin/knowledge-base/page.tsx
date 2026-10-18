'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Search,
  Filter,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface KbDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  status: 'draft' | 'approved' | 'archived';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  users?: { full_name: string };
  _count?: { kb_chunks: number };
  kb_chunks?: Array<{
    id: string;
    chunk_index: number;
    content: string;
    embedding_model?: string;
  }>;
}

export default function AdminKnowledgeBasePage() {
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<KbDocument | null>(null);

  // Modal tạo tài liệu
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'course' | 'fee' | 'schedule' | 'teacher' | 'policy' | 'faq' | 'about'>('course');
  const [newContent, setNewContent] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const url = selectedStatus === 'all' ? '/api/v1/kb/documents' : `/api/v1/kb/documents?status=${selectedStatus}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        // Fallback demo data
        setDocuments([
          {
            id: 'kb1',
            title: 'Chính sách biểu phí và ưu đãi học phí năm 2026',
            category: 'fee',
            content: 'Trung tâm CoreLink Academy niêm yết mức học phí khóa IELTS là 8.500.000đ/khóa 60 buổi. Học phí khóa Tiếng Anh Tiểu học là 4.500.000đ/khóa. Chính sách ưu đãi đăng ký sớm giảm 10% khi đóng trước khai giảng 10 ngày.',
            status: 'approved',
            created_at: new Date().toISOString(),
            _count: { kb_chunks: 3 },
          },
          {
            id: 'kb2',
            title: 'Quy trình kiểm tra đầu vào và xếp lớp cho học sinh mới',
            category: 'policy',
            content: 'Mọi học sinh mới đăng ký đều được tham gia bài kiểm tra đánh giá năng lực gồm 15 câu trắc nghiệm trực tuyến trong 20 phút. Điểm số từ 80% trở lên sẽ được tư vấn xếp vào lớp B1+/Chuyên.',
            status: 'draft',
            created_at: new Date().toISOString(),
            _count: { kb_chunks: 0 },
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching KB docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/kb/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setNewTitle('');
        setNewContent('');
        setActionMsg('Tạo tài liệu mới thành công!');
        await fetchDocuments();
      }
    } catch (err: any) {
      setActionMsg('Lỗi tạo tài liệu: ' + err.message);
    }
  };

  const handleApproveDocument = async (id: string) => {
    setActionMsg(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/kb/documents/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActionMsg(`✅ ${data.message} (Đã sinh ${data.totalChunks} đoạn vector embedding)`);
        await fetchDocuments();
      }
    } catch (err: any) {
      setActionMsg('Lỗi duyệt tài liệu: ' + err.message);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/kb/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDoc(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                  RAG Chatbot Tri Thức
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Vector Embeddings</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Quản Trị Kho Tri Thức Tư Vấn Tự Động
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/admin/knowledge-base"
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-xs"
            >
              Kho Tri Thức
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Tổng Quan Quản Trị
            </Link>
            <Link
              href="/consultant/leads"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Tuyển Sinh
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {actionMsg && (
          <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            actionMsg.includes('Lỗi')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {actionMsg.includes('Lỗi') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Action bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Tất cả tài liệu' },
              { id: 'draft', label: 'Bản nháp (Draft)' },
              { id: 'approved', label: 'Đã duyệt (RAG Active)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Soạn Tài Liệu Mới
          </button>
        </div>

        {/* Document list table */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh Mục Tài Liệu Tri Thức Hệ Thống</h2>
              <p className="text-xs text-slate-500">Tài liệu sau khi duyệt sẽ được phân đoạn thành vectors để trợ lý ảo AI trích xuất</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Đang tải danh sách tài liệu...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 italic">Chưa có tài liệu nào trong danh mục này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold">
                    <th className="py-3 px-4">Tiêu đề tài liệu</th>
                    <th className="py-3 px-4">Thể loại</th>
                    <th className="py-3 px-4 text-center">Số đoạn Chunks</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                        {doc.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] uppercase border border-blue-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {doc._count?.kb_chunks || 0} đoạn
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          doc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {doc.status === 'approved' ? '✓ Đã duyệt (Active)' : 'Bản nháp (Draft)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(doc.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                          >
                            Xem Chunks
                          </button>
                          {doc.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveDocument(doc.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              ⚡ Duyệt & Sinh Vector
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal Soạn tài liệu mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Soạn Thảo Tài Liệu Tri Thức Mới
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nội dung sẽ được hệ thống phân tách thành các đoạn ngữ nghĩa (chunks) phục vụ truy vấn RAG
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chương trình đào tạo và lộ trình cam kết IELTS 7.5+"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thể loại</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="course">Khóa học (Course)</option>
                  <option value="fee">Học phí & Ưu đãi (Fee)</option>
                  <option value="schedule">Lịch học & Xếp lớp (Schedule)</option>
                  <option value="teacher">Giáo viên & Chuyên môn (Teacher)</option>
                  <option value="policy">Quy chế & Chính sách (Policy)</option>
                  <option value="faq">Câu hỏi thường gặp (FAQ)</option>
                  <option value="about">Giới thiệu trung tâm (About)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung chi tiết *</label>
                <textarea
                  required
                  rows={7}
                  placeholder="Nhập nội dung tài liệu. Các đoạn cách nhau bằng dòng trống sẽ được tách chunk tự động..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Lưu Bản Nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết Chunks */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 text-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedDoc.title}</h3>
                <span className="text-[11px] font-bold text-blue-600 uppercase">{selectedDoc.category}</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Các đoạn phân đoạn Chunks ({selectedDoc.kb_chunks?.length || 0}):
            </h4>

            <div className="space-y-3">
              {selectedDoc.kb_chunks && selectedDoc.kb_chunks.length > 0 ? (
                selectedDoc.kb_chunks.map((chunk) => (
                  <div key={chunk.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between text-[11px] font-bold text-blue-700 mb-1">
                      <span>Đoạn #{chunk.chunk_index}</span>
                      <span className="text-slate-400 font-mono text-[10px]">ID: {chunk.id}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed m-0">{chunk.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  Tài liệu này chưa được duyệt để sinh vector embedding. Hãy bấm "Duyệt & Sinh Vector" ở danh mục bên ngoài!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
