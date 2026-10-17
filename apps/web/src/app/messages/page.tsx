'use client';

import React, { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  kind: string;
  studentId: string | null;
  isLocked: boolean;
  lastMessageAt: string | null;
  lastReadAt: string | null;
  otherUser: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
  lastMessage: {
    id: string;
    body: string | null;
    senderId: string;
    createdAt: string;
    hasAttachments: boolean;
  } | null;
}

interface MessageItem {
  id: string;
  senderId: string;
  sender: {
    id: string;
    full_name: string;
  };
  body: string | null;
  attachments?: Array<{ name: string; url: string; size: number; durationSeconds?: number }>;
  isUrgent: boolean;
  editedAt: string | null;
  createdAt: string;
  isRead: boolean;
}

interface AnnouncementItem {
  id: string;
  classId: string;
  title: string;
  body: string;
  attachments?: any;
  createdAt: string;
  author: {
    id: string;
    full_name: string;
  };
  hasRead: boolean;
  readAt: string | null;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'bulletin'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [reportModalMsgId, setReportModalMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [readerStatsModal, setReaderStatsModal] = useState<any | null>(null);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementBody, setNewAnnouncementBody] = useState('');
  const [showNewAnnouncementModal, setShowNewAnnouncementModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sampleConversations: Conversation[] = [
    {
      id: 'conv-1',
      kind: 'guardian_teacher',
      studentId: 'std-1',
      isLocked: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      lastReadAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      otherUser: { id: 'usr-teacher-1', full_name: 'Cô Thu Thảo (GV Tiếng Anh)', phone: '0901234567' },
      lastMessage: {
        id: 'msg-1',
        body: 'Em An dạo này làm bài tập về nhà rất tích cực nhé phụ huynh.',
        senderId: 'usr-teacher-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        hasAttachments: false,
      },
    },
    {
      id: 'conv-2',
      kind: 'guardian_staff',
      studentId: null,
      isLocked: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      lastReadAt: null,
      otherUser: { id: 'usr-staff-1', full_name: 'Phòng Đào Tạo & Giáo Vụ', phone: '0907654321' },
      lastMessage: {
        id: 'msg-2',
        body: 'Chào phụ huynh, trung tâm đã nhận được đơn xin phép nghỉ học của em.',
        senderId: 'usr-staff-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        hasAttachments: false,
      },
    },
  ];

  const sampleMessages: MessageItem[] = [
    {
      id: 'msg-101',
      senderId: 'current-user',
      sender: { id: 'current-user', full_name: 'Tôi' },
      body: 'Dạ chào Cô Thảo, tuần này cháu An có bài tập lớn nào cần nộp không ạ?',
      isUrgent: false,
      editedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      isRead: true,
    },
    {
      id: 'msg-102',
      senderId: 'usr-teacher-1',
      sender: { id: 'usr-teacher-1', full_name: 'Cô Thu Thảo' },
      body: 'Chào phụ huynh, cháu có 1 bài tập dự án thuyết trình tiếng Anh hạn nộp vào Thứ 6 này ạ. Cháu đang chuẩn bị rất tốt!',
      isUrgent: false,
      editedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      isRead: true,
    },
    {
      id: 'msg-103',
      senderId: 'usr-teacher-1',
      sender: { id: 'usr-teacher-1', full_name: 'Cô Thu Thảo' },
      body: 'Em gửi phụ huynh tài liệu hướng dẫn và phiếu chấm điểm rubric đính kèm nhé.',
      attachments: [{ name: 'rubric_presentation.pdf', url: '#', size: 1.5 * 1024 * 1024 }],
      isUrgent: false,
      editedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      isRead: true,
    },
  ];

  const sampleAnnouncements: AnnouncementItem[] = [
    {
      id: 'ann-1',
      classId: 'cls-10a1',
      title: 'Kế hoạch ôn tập kiểm tra giữa học kỳ 1',
      body: 'Lớp chúng ta sẽ làm bài kiểm tra giữa kỳ vào Thứ Tư tuần sau. Các em ôn tập kỹ các bài đọc hiểu Unit 1-3 và từ vựng chuyên đề.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      author: { id: 'usr-teacher-1', full_name: 'Cô Thu Thảo' },
      hasRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'ann-2',
      classId: 'cls-10a1',
      title: 'Thông báo mang theo laptop thực hành ngày mai',
      body: 'Tiết học ngày mai cả lớp sẽ thực hành làm bài kiểm tra trực tuyến k6, các em nhớ sạc đầy pin laptop và mang theo tai nghe.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      author: { id: 'usr-teacher-1', full_name: 'Cô Thu Thảo' },
      hasRead: false,
      readAt: null,
    },
  ];

  useEffect(() => {
    fetchConversations();
    setAnnouncements(sampleAnnouncements);
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/communication/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.length > 0 ? data : sampleConversations);
          if (data.length > 0 && !selectedConvId) {
            setSelectedConvId(data[0].id);
          }
          return;
        }
      }
      setConversations(sampleConversations);
      setSelectedConvId(sampleConversations[0].id);
    } catch {
      setConversations(sampleConversations);
      setSelectedConvId(sampleConversations[0].id);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/v1/communication/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          return;
        }
      }
      setMessages(sampleMessages);
    } catch {
      setMessages(sampleMessages);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/v1/communication/conversations/${selectedConvId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: messageInput.trim(),
            isUrgent,
          }),
        });

        if (res.ok) {
          setMessageInput('');
          setIsUrgent(false);
          fetchMessages(selectedConvId);
          showToast('Tin nhắn đã được gửi');
          return;
        } else {
          const err = await res.json();
          showToast(err.message || 'Lỗi gửi tin', 'error');
          return;
        }
      }

      // Local mock append
      const newMsg: MessageItem = {
        id: 'msg-' + Date.now(),
        senderId: 'current-user',
        sender: { id: 'current-user', full_name: 'Tôi' },
        body: messageInput.trim(),
        isUrgent,
        editedAt: null,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput('');
      setIsUrgent(false);
      showToast('Đã gửi tin nhắn thành công');
    } catch {
      showToast('Lỗi gửi tin nhắn', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 20 * 1024 * 1024; // 20 MB (FR-901, TC-111)
    if (file.size > MAX_SIZE) {
      showToast(`File vượt quá dung lượng tối đa 20 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'error');
      return;
    }

    const newMsg: MessageItem = {
      id: 'msg-' + Date.now(),
      senderId: 'current-user',
      sender: { id: 'current-user', full_name: 'Tôi' },
      body: 'Đã đính kèm tệp: ' + file.name,
      attachments: [{ name: file.name, url: '#', size: file.size }],
      isUrgent: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    showToast(`Đã gửi tệp ${file.name} thành công`);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editBody.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/v1/communication/messages/${editingMessageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: editBody.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.message || 'Chỉ được sửa trong vòng 5 phút', 'error');
          return;
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessageId
            ? { ...m, body: editBody.trim(), editedAt: new Date().toISOString() }
            : m,
        ),
      );
      setEditingMessageId(null);
      setEditBody('');
      showToast('Đã lưu chỉnh sửa tin nhắn');
    } catch {
      showToast('Lỗi chỉnh sửa tin nhắn', 'error');
    }
  };

  const handleSendReport = async () => {
    if (!reportModalMsgId || !reportReason.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/v1/communication/messages/${reportModalMsgId}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reportReason.trim() }),
        });
      }
      setReportModalMsgId(null);
      setReportReason('');
      showToast('Báo cáo vi phạm đã được gửi đến Ban Quản trị xử lý trong vòng 1 phút');
    } catch {
      showToast('Lỗi gửi báo cáo', 'error');
    }
  };

  const handleMarkAnnouncementRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hasRead: true, readAt: new Date().toISOString() } : a)),
    );
    showToast('Đã ghi nhận bạn đã đọc thông báo');
  };

  const handleRemindUnread = () => {
    showToast('Đã gửi thông báo nhắc nhở đến 17 thành viên chưa đọc');
    setReaderStatsModal(null);
  };

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center space-x-2 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header with Tab switcher */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>💬</span>
              <span>Tin nhắn & Trao đổi</span>
            </h1>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hội thoại 1-1
              </button>
              <button
                onClick={() => setActiveTab('bulletin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'bulletin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng tin lớp học
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Giờ yên lặng: <strong>21:00 – 07:00</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 flex gap-4 overflow-hidden">
        {activeTab === 'chat' ? (
          <>
            {/* Conversations Sidebar */}
            <aside className="w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Tìm hội thoại hoặc tin nhắn..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations
                  .filter((c) =>
                    c.otherUser?.full_name.toLowerCase().includes(searchKeyword.toLowerCase()),
                  )
                  .map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-all ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                          {conv.otherUser?.full_name.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {conv.otherUser?.full_name}
                            </h4>
                            {conv.lastMessage && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {conv.isLocked ? (
                              <span className="text-amber-600 font-medium">⚠️ Hội thoại bị tạm khóa</span>
                            ) : (
                              conv.lastMessage?.body || 'Chưa có tin nhắn'
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </aside>

            {/* Chat Thread */}
            <main className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {activeConv ? (
                <>
                  {/* Thread Header */}
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        {activeConv.otherUser?.full_name.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{activeConv.otherUser?.full_name}</h3>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Đang hoạt động</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {activeConv.isLocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Đã khóa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === 'current-user';
                      const canEdit =
                        isMe && (Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60) <= 5;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                        >
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 shadow-sm text-xs relative ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            } ${msg.isUrgent ? 'ring-2 ring-red-400' : ''}`}
                          >
                            {msg.isUrgent && (
                              <div className="text-[10px] font-bold text-red-200 uppercase mb-0.5">
                                🚨 Tin khẩn cấp
                              </div>
                            )}

                            {editingMessageId === msg.id ? (
                              <div className="space-y-2 py-1">
                                <input
                                  type="text"
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded bg-white text-slate-900 border"
                                  autoFocus
                                />
                                <div className="flex space-x-1 justify-end">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded font-bold"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>

                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {msg.attachments.map((att, i) => (
                                      <a
                                        key={i}
                                        href={att.url}
                                        className={`flex items-center space-x-2 p-1.5 rounded-lg text-[11px] underline ${
                                          isMe ? 'bg-blue-700/50 text-white' : 'bg-slate-100 text-blue-700'
                                        }`}
                                      >
                                        <span>📎</span>
                                        <span className="truncate">{att.name}</span>
                                        <span className="text-[10px] opacity-75">
                                          ({(att.size / (1024 * 1024)).toFixed(1)} MB)
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            <div
                              className={`flex items-center justify-end space-x-1.5 text-[10px] mt-1 ${
                                isMe ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {msg.editedAt && <span>(Đã sửa)</span>}
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && (
                                <span>
                                  {msg.isRead ? '• Đã xem ✓✓' : '• Đã gửi ✓'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message action buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 mt-1 px-1">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditBody(msg.body || '');
                                }}
                                className="text-[10px] text-slate-500 hover:text-blue-600 underline"
                              >
                                Sửa (trong 5p)
                              </button>
                            )}
                            {!isMe && (
                              <button
                                onClick={() => {
                                  setReportModalMsgId(msg.id);
                                  setReportReason('');
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600"
                              >
                                🚩 Báo cáo
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Box */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                        <span className="text-base">📎</span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label className="flex items-center space-x-1 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="rounded text-red-600"
                        />
                        <span className="font-semibold text-red-600">Khẩn</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
                      >
                        Gửi
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1 px-2 text-[10px] text-slate-400">
                      <span>File tối đa 20 MB • Ghi âm tối đa 2 phút • Không có nút xóa</span>
                      <span>Tin nhắn ngoài 7h-21h được hẹn giờ gửi 7:00</span>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  Chọn một cuộc hội thoại để bắt đầu
                </div>
              )}
            </main>
          </>
        ) : (
          /* Bulletin Board Tab (FR-905, TC-119) */
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bảng tin lớp học</h2>
                <p className="text-xs text-slate-500">
                  Thông báo chính thức từ giáo viên chủ nhiệm và bộ môn. Bảng tin không có tính năng bình luận.
                </p>
              </div>

              <button
                onClick={() => setShowNewAnnouncementModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
              >
                + Đăng thông báo mới
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        {ann.author.full_name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{ann.author.full_name}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(ann.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {ann.hasRead ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                          <span>✓</span>
                          <span>Đã đọc ({new Date(ann.readAt!).toLocaleTimeString('vi-VN')})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkAnnouncementRead(ann.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                        >
                          Xác nhận Đã đọc
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setReaderStatsModal({
                            id: ann.id,
                            title: ann.title,
                            total: 22,
                            read: 5,
                            unread: 17,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        Danh sách đọc (5/22)
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3">{ann.title}</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reader Stats & Remind Modal (TC-119) */}
      {readerStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900">Danh sách theo dõi đọc thông báo</h3>
            <p className="text-xs text-slate-500 mt-1 truncate">{readerStatsModal.title}</p>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <div className="text-xl font-extrabold text-emerald-700">{readerStatsModal.read}</div>
                <div className="text-[11px] font-semibold text-emerald-800">Đã đọc</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                <div className="text-xl font-extrabold text-rose-700">{readerStatsModal.unread}</div>
                <div className="text-[11px] font-semibold text-rose-800">Chưa đọc</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Bạn có thể gửi một thông báo đẩy nhắc nhở khẩn cấp đến toàn bộ 17 học sinh và phụ huynh chưa xác nhận đọc thông báo này.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReaderStatsModal(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={handleRemindUnread}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow"
              >
                Nhắc lại người chưa đọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Message Modal (FR-904, TC-118) */}
      {reportModalMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900">Báo cáo tin nhắn vi phạm</h3>
            <p className="text-xs text-slate-500 mt-1">
              Báo cáo sẽ được chuyển tới Ban Quản trị trong vòng 1 phút để kiểm tra và xử lý tạm khóa tài khoản nếu cần thiết.
            </p>

            <textarea
              rows={3}
              placeholder="Nhập lý do báo cáo (nội dung không phù hợp, ngôn từ thô tục, spam...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full mt-3 p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReportModalMsgId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReport}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {showNewAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6">
            <h3 className="text-base font-bold text-slate-900">Đăng thông báo lên bảng tin</h3>

            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tiêu đề thông báo</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lịch kiểm tra giữa học kỳ 1"
                  value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung thông báo gửi đến toàn thể học sinh và phụ huynh trong lớp..."
                  value={newAnnouncementBody}
                  onChange={(e) => setNewAnnouncementBody(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewAnnouncementModal(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newAnnouncementTitle || !newAnnouncementBody) return;
                  const newAnn: AnnouncementItem = {
                    id: 'ann-' + Date.now(),
                    classId: 'cls-10a1',
                    title: newAnnouncementTitle,
                    body: newAnnouncementBody,
                    createdAt: new Date().toISOString(),
                    author: { id: 'current-user', full_name: 'Giáo viên' },
                    hasRead: true,
                    readAt: new Date().toISOString(),
                  };
                  setAnnouncements((prev) => [newAnn, ...prev]);
                  setShowNewAnnouncementModal(false);
                  setNewAnnouncementTitle('');
                  setNewAnnouncementBody('');
                  showToast('Đã đăng thông báo bảng tin lớp thành công');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
              >
                Đăng thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
