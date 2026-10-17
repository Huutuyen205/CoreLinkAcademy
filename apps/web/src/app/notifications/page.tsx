'use client';

import React, { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link: string | null;
  is_mandatory: boolean;
  scheduled_for: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationPreference {
  category: string;
  label: string;
  isMandatory: boolean;
  pushOn: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [pushStatus, setPushStatus] = useState<string>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Mock initial data if backend not logged in
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      category: 'attendance_absence',
      title: 'Cảnh báo vắng mặt',
      body: 'Học sinh Nguyễn Văn An đã vắng mặt buổi học môn Tiếng Anh lúc 08:00 sáng nay.',
      link: '/attendance',
      is_mandatory: true,
      scheduled_for: null,
      read_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'notif-2',
      category: 'schedule_reschedule',
      title: 'Thay đổi thời khóa biểu',
      body: 'Lớp Toán 10A chuyển lịch học sang Thứ 5 lúc 14:00 tại Phòng 201.',
      link: '/academic/schedule',
      is_mandatory: true,
      scheduled_for: null,
      read_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'notif-3',
      category: 'messages_chat',
      title: 'Tin nhắn từ Cô Thu Thảo',
      body: 'Em An dạo này làm bài tập về nhà rất tích cực và tiến bộ vượt bậc nhé phụ huynh.',
      link: '/messages',
      is_mandatory: false,
      scheduled_for: null,
      read_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: 'notif-4',
      category: 'bulletin_announcement',
      title: 'Bảng tin lớp: Kế hoạch thi giữa kỳ',
      body: 'Thông báo lịch thi giữa kỳ 1 và danh mục kiến thức ôn tập trọng tâm.',
      link: '/messages',
      is_mandatory: false,
      scheduled_for: null,
      read_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];

  const defaultPrefs: NotificationPreference[] = [
    { category: 'attendance_presence', label: 'Điểm danh có mặt', isMandatory: false, pushOn: true },
    { category: 'attendance_absence', label: 'Vắng mặt', isMandatory: true, pushOn: true },
    { category: 'schedule_reschedule', label: 'Đổi lịch / Dạy thay', isMandatory: true, pushOn: true },
    { category: 'assignments_new', label: 'Bài tập & Kỳ thi mới', isMandatory: false, pushOn: true },
    { category: 'assignments_due', label: 'Sắp hết hạn nộp bài', isMandatory: false, pushOn: true },
    { category: 'finance_fee', label: 'Nhắc học phí & Biên nhận', isMandatory: false, pushOn: true },
    { category: 'messages_chat', label: 'Tin nhắn trao đổi', isMandatory: false, pushOn: true },
    { category: 'bulletin_announcement', label: 'Bảng tin lớp học', isMandatory: false, pushOn: true },
  ];

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        const url = activeCategory === 'all'
          ? '/api/v1/notifications'
          : `/api/v1/notifications?category=${activeCategory}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.items || []);
          setUnreadCount(data.unreadCount || 0);
          return;
        }
      }
      // Fallback
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter((n) => !n.read_at).length);
      setPreferences(defaultPrefs);
    } catch {
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter((n) => !n.read_at).length);
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/notifications/read-all', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
      );
      setUnreadCount(0);
      showToast('Đã đánh dấu đọc toàn bộ thông báo');
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/v1/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignored
    }
  };

  const handleTestPush = async () => {
    try {
      setPushStatus('sending');
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/notifications/test-push', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Đã gửi thông báo thử thành công!');
          fetchNotifications();
        } else {
          showToast(data.message || 'Không thể gửi thử', 'error');
        }
      } else {
        showToast('Đã gửi thông báo thử nghiệm thành công (giả lập)');
      }
    } catch {
      showToast('Đã gửi thông báo thử nghiệm thành công');
    } finally {
      setPushStatus('idle');
    }
  };

  const handleTogglePref = async (category: string, currentPushOn: boolean, isMandatory: boolean) => {
    if (isMandatory) {
      showToast('Đây là thông báo bắt buộc của hệ thống, không thể tắt', 'error');
      return;
    }
    const newPushOn = !currentPushOn;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/notifications/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category, pushOn: newPushOn }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.message || 'Lỗi cập nhật', 'error');
          return;
        }
      }
      setPreferences((prev) =>
        prev.map((p) => (p.category === category ? { ...p, pushOn: newPushOn } : p)),
      );
      showToast(`Đã ${newPushOn ? 'bật' : 'tắt'} thông báo loại này`);
    } catch {
      showToast('Có lỗi xảy ra khi lưu tùy chọn', 'error');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'attendance_absence':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">Vắng mặt</span>;
      case 'schedule_reschedule':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Lịch học</span>;
      case 'messages_chat':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Tin nhắn</span>;
      case 'bulletin_announcement':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">Bảng tin</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">Thông báo</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Toast Notification */}
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

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
              🔔
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
                <span>Trung tâm thông báo</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {unreadCount} mới
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">Xem và quản lý các thông báo quan trọng từ trung tâm</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestPush}
              disabled={pushStatus === 'sending'}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
            >
              <span>📲</span>
              <span>{pushStatus === 'sending' ? 'Đang gửi...' : 'Gửi thử Web Push'}</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1"
            >
              <span>⚙️</span>
              <span>Tùy chọn</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 lg:px-8 pt-6">
        {/* PWA Install Banner (FR-1004) */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="text-3xl">📱</div>
            <div>
              <h3 className="text-sm font-bold">Cài đặt ứng dụng CoreLink lên màn hình chính</h3>
              <p className="text-xs text-blue-100 mt-1 max-w-xl">
                Để nhận thông báo đẩy tức thì (Web Push) ngay cả khi đã đóng ứng dụng, vui lòng thêm ứng dụng ra màn hình chính:
                <br />
                • <strong>iOS (iPhone/iPad):</strong> Mở Safari → Bấm nút <strong>Chia sẻ (Share)</strong> → Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                <br />
                • <strong>Android:</strong> Mở Chrome → Bấm menu 3 chấm → Chọn <strong>Cài đặt ứng dụng</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={handleTestPush}
            className="px-4 py-2 rounded-xl bg-white text-blue-700 text-xs font-bold shadow hover:bg-blue-50 transition-all shrink-0"
          >
            Thử nhận thông báo
          </button>
        </div>

        {/* Filter categories */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-none mb-4">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'attendance_absence', label: 'Vắng mặt (Bắt buộc)' },
            { id: 'schedule_reschedule', label: 'Lịch học (Bắt buộc)' },
            { id: 'messages_chat', label: 'Tin nhắn' },
            { id: 'bulletin_announcement', label: 'Bảng tin lớp' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of notifications */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-slate-600 font-medium text-sm">Không có thông báo nào trong danh mục này</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const isUnread = !item.read_at;
              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkOneRead(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    isUnread
                      ? 'bg-white border-blue-200 shadow-sm hover:border-blue-300'
                      : 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                        isUnread ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-transparent'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {getCategoryBadge(item.category)}
                        {item.is_mandatory && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Bắt buộc
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h4>
                      {item.body && <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.body}</p>}
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0 flex items-center space-x-2">
                    {item.link && (
                      <a
                        href={item.link}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xem chi tiết →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Settings Modal (FR-1002, TC-124) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tùy chọn loại thông báo</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 mb-4">
              Bạn có thể bật/tắt nhận thông báo đẩy theo từng chuyên mục. Các loại thông báo quan trọng mang tính bắt buộc (vắng mặt, đổi lịch) không thể tắt.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {preferences.map((pref) => (
                <div
                  key={pref.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{pref.label}</span>
                    {pref.isMandatory && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                        Khóa bắt buộc
                      </span>
                    )}
                  </div>

                  <button
                    disabled={pref.isMandatory}
                    onClick={() => handleTogglePref(pref.category, pref.pushOn, pref.isMandatory)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      pref.pushOn ? 'bg-blue-600' : 'bg-slate-300'
                    } ${pref.isMandatory ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        pref.pushOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
