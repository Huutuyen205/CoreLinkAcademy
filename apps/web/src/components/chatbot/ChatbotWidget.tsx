'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: Array<{ chunkId: string; title: string; category: string }>;
  isHandoff?: boolean;
  isLeadCaptured?: boolean;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorKey, setVisitorKey] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Khởi tạo visitorKey trong localStorage
    let key = localStorage.getItem('corelink_visitor_key');
    if (!key) {
      key = 'vis_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('corelink_visitor_key', key);
    }
    setVisitorKey(key);

    // Tin nhắn chào mừng ban đầu
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        content:
          'Dạ, em chào Quý khách! Em là Trợ lý tư vấn AI của CoreLink Academy. Quý khách đang quan tâm đến khóa học tiếng Anh nào cho gia đình mình ạ?',
      },
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          visitorKey,
          message: text,
          utmSource: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || undefined : undefined,
          utmCampaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') || undefined : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sessionId) setSessionId(data.sessionId);

        const botMsg: ChatMessage = {
          id: data.turnId || 'bot_' + Date.now(),
          role: 'bot',
          content: data.message,
          sources: data.sources,
          isHandoff: data.isHandoff,
          isLeadCaptured: data.isLeadCaptured,
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            role: 'bot',
            content: 'Dạ, hiện tại đường truyền đang bận một chút. Quý khách vui lòng thử lại sau vài giây hoặc gọi hotline nhé!',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'bot',
          content: 'Dạ, không kết nối được tới máy chủ. Quý khách vui lòng kiểm tra lại kết nối mạng ạ.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, fontFamily: 'system-ui, sans-serif' }}>
      {/* Nút bấm mở Widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '9999px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 8px 10px -6px rgba(37, 99, 235, 0.5)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            transition: 'transform 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '9999px',
            backgroundColor: '#FFFFFF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            🤖
          </div>
          <span>Tư vấn AI CoreLink</span>
        </button>
      )}

      {/* Cửa sổ Chat Widget (S03) */}
      {isOpen && (
        <div style={{
          width: '380px',
          maxWidth: 'calc(100vw - 2rem)',
          height: '560px',
          maxHeight: 'calc(100vh - 4rem)',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Widget Header */}
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>Trợ Lý Tuyển Sinh AI</div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#10B981' }} />
                  Trực tuyến 24/7 (AI-12 RAG)
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick suggestions */}
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}>
            {['Học phí các khóa?', 'Lịch học thử?', 'Luyện thi IELTS?'].map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#60A5FA',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    backgroundColor: msg.role === 'user' ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {msg.content}
                </div>

                {/* Hiển thị nguồn trích dẫn RAG (TC-009) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#38BDF8',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderRadius: '0.375rem',
                    width: 'fit-content',
                  }}>
                    📖 Nguồn: {msg.sources[0].title}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '0.6rem 1rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94A3B8',
                fontSize: '0.8rem',
              }}>
                Trợ lý AI đang tra cứu kho kiến thức...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '0.5rem',
          }}>
            <input
              type="text"
              placeholder="Nhập câu hỏi hoặc SĐT để tư vấn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '0.625rem',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '0.625rem',
                backgroundColor: inputValue.trim() ? '#2563EB' : 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
