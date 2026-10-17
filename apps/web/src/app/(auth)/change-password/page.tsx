'use client';

import React, { useState } from 'react';
import vi from '../../../../messages/vi.json';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/v1/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể đổi mật khẩu');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-gradient">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h1 className="text-xl font-bold text-white mb-2">Đổi Mật Khẩu Lần Đầu</h1>
        <p className="text-slate-400 text-sm mb-6">
          Để đảm bảo an toàn tài khoản, bạn cần đổi mật khẩu tạm thời trước khi tiếp tục.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            Đổi mật khẩu thành công! Đang chuyển hướng đăng nhập...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="curPass">
              Mật khẩu tạm hiện tại
            </label>
            <input
              id="curPass"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="newPass">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <input
              id="newPass"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="confPass">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="confPass"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition mt-2"
          >
            {loading ? vi.common.loading : vi.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
