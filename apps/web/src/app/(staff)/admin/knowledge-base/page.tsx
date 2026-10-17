'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
        // Fallback mock preview
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 15, 29, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem'
          }}>CL</div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Kho Tri Thức RAG Chatbot (AI-12, FR-103)</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Quản lý & duyệt tài liệu sinh vector embedding cho trợ lý ảo</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/admin/knowledge-base" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>Kho Tri Thức RAG</Link>
          <Link href="/admin/users" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Quản lý User</Link>
          <Link href="/consultant/leads" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem' }}>Tuyển sinh</Link>
        </nav>
      </header>

      <main style={{ maxWidth: '1100px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        {actionMsg && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: actionMsg.includes('Lỗi') ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: actionMsg.includes('Lỗi') ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
            color: actionMsg.includes('Lỗi') ? '#F87171' : '#10B981',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {actionMsg}
          </div>
        )}

        {/* Action bar & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'all', label: 'Tất cả tài liệu' },
              { id: 'draft', label: 'Bản nháp (Draft)' },
              { id: 'approved', label: 'Đã duyệt (RAG Active)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedStatus === tab.id ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: selectedStatus === tab.id ? '#2563EB' : 'rgba(255,255,255,0.04)',
                  color: selectedStatus === tab.id ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Soạn Tài Liệu Mới
          </button>
        </div>

        {/* Document list table */}
        <section style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem',
          padding: '1.75rem',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>
            Danh Mục Tài Liệu Tri Thức Hệ Thống
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Đang tải danh sách tài liệu...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa có tài liệu nào trong danh mục này.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                    <th style={{ padding: '0.75rem' }}>Tiêu đề tài liệu</th>
                    <th style={{ padding: '0.75rem' }}>Thể loại</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Số đoạn Chunks</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>{doc.title}</td>
                      <td style={{ padding: '0.75rem', color: '#38BDF8', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                        {doc.category}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#CBD5E1' }}>
                        {doc._count?.kb_chunks || 0} chunks
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: doc.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: doc.status === 'approved' ? '#10B981' : '#F59E0B',
                          border: doc.status === 'approved' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
                        }}>
                          {doc.status === 'approved' ? '✓ Đã duyệt (Active)' : 'Bản nháp (Draft)'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleViewDetails(doc.id)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '0.375rem',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: '#CBD5E1',
                              border: '1px solid rgba(255,255,255,0.1)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Xem chi tiết
                          </button>
                          {doc.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveDocument(doc.id)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.375rem',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1rem',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#FFFFFF' }}>
              Soạn Tài Liệu Kho Tri Thức Mới
            </h3>

            <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.3rem' }}>Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chương trình đào tạo và lộ trình cam kết IELTS 7.5+"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.3rem' }}>Thể loại</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF' }}
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.3rem' }}>Nội dung chi tiết (được AI cắt đoạn và trích nguồn RAG) *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Nhập nội dung đầy đủ. Các đoạn văn cách nhau bằng dòng trắng sẽ được tự động phân đoạn thông minh..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: '0.85rem', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#2563EB', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Lưu Bản Nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết các đoạn Chunks */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#FFFFFF' }}>{selectedDoc.title}</h3>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 700 }}>{selectedDoc.category}</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h4 style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '0.75rem' }}>
              Danh sách các đoạn Chunks ({selectedDoc.kb_chunks?.length || 0}):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDoc.kb_chunks && selectedDoc.kb_chunks.length > 0 ? (
                selectedDoc.kb_chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                      <span>Đoạn #{chunk.chunk_index}</span>
                      <span>Mã: {chunk.id}</span>
                    </div>
                    <p style={{ margin: 0, color: '#E2E8F0' }}>{chunk.content}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                  Tài liệu này chưa được duyệt để sinh vector embedding. Hãy bấm "Duyệt & Sinh Vector" ở danh sách ngoài!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
