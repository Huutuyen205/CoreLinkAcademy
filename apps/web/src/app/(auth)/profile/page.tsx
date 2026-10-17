'use client';

import React, { useEffect, useState } from 'react';
import vi from '../../../../messages/vi.json';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [consented, setConsented] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setConsented(u.hasConsented);
    }
    setLoading(false);
  }, []);

  const handleConsent = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/v1/auth/consents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scope: 'data_processing',
          policyVersion: 'v1.0',
        }),
      });
      if (res.ok) {
        setConsented(true);
        if (user) {
          user.hasConsented = true;
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        setMsg('Đã xác nhận đồng ý xử lý dữ liệu theo Luật Bảo vệ dữ liệu cá nhân 2025.');
      }
    } catch (e: any) {
      setMsg('Lỗi khi ghi nhận đồng ý: ' + e.message);
    }
  };

  const handleWithdraw = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/v1/auth/consents/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scope: 'data_processing',
        }),
      });
      if (res.ok) {
        setConsented(false);
        if (user) {
          user.hasConsented = false;
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        setMsg('Đã rút đồng ý. Yêu cầu xử lý đã được gửi tới Quản trị viên (FR-209).');
      }
    } catch (e: any) {
      setMsg('Lỗi khi rút đồng ý: ' + e.message);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">{vi.common.loading}</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">{user?.fullName || 'Người dùng'}</h1>
          <p className="text-slate-400 text-sm">
            Vai trò: <span className="text-blue-400 font-semibold">{user?.roles?.join(', ')}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium transition"
        >
          Đăng xuất
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
          {msg}
        </div>
      )}

      {/* Thông tin tài khoản */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Thông Tin Tài Khoản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Số điện thoại:</span>
            <p className="text-white font-medium">{user?.phone || 'Chưa cập nhật'}</p>
          </div>
          <div>
            <span className="text-slate-400">Email:</span>
            <p className="text-white font-medium">{user?.email || 'Chưa cập nhật'}</p>
          </div>
          <div>
            <span className="text-slate-400">Mã định danh (Username):</span>
            <p className="text-white font-medium">{user?.username || user?.id}</p>
          </div>
          <div>
            <span className="text-slate-400">Trạng thái tài khoản:</span>
            <p className="text-emerald-400 font-medium">Hoạt động (Active)</p>
          </div>
        </div>
      </div>

      {/* Điều khoản đồng ý dữ liệu (FR-209) */}
      <div id="consents" className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Đồng Ý Xử Lý Dữ Liệu (FR-209)</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              consented
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {consented ? 'Đã xác nhận' : 'Chưa đồng ý'}
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Tuân thủ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15. Hệ thống CoreLink Academy chỉ thu thập tối thiểu
          thông tin để phục vụ học tập, ẩn danh dữ liệu trước khi xử lý qua AI, và cam kết không chia sẻ dữ liệu
          học sinh cho bên thứ ba.
        </p>

        <div className="pt-2 flex gap-3">
          {!consented ? (
            <button
              onClick={handleConsent}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
            >
              Tôi đồng ý với chính sách dữ liệu
            </button>
          ) : (
            <button
              onClick={handleWithdraw}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700 transition"
            >
              Rút lại sự đồng ý
            </button>
          )}
        </div>
      </div>

      {/* Hướng dẫn cài PWA lên màn hình chính (FR-1004) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 className="text-lg font-bold text-white">Cài Đặt Ứng Dụng (PWA)</h2>
        <p className="text-slate-400 text-sm">
          Để nhận thông báo đẩy tức thời về điểm danh và bài tập:
        </p>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
          <li><strong>Trên iOS (iPhone/iPad):</strong> Mở Safari &gt; bấm nút Chia sẻ (Share) &gt; chọn <em>"Thêm vào màn hình chính" (Add to Home Screen)</em>.</li>
          <li><strong>Trên Android:</strong> Mở Chrome &gt; bấm biểu tượng 3 chấm &gt; chọn <em>"Cài đặt ứng dụng" (Install app)</em>.</li>
        </ul>
      </div>
    </div>
  );
}
