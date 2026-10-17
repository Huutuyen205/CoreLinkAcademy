'use client';

import React, { useState } from 'react';
import vi from '../../../../messages/vi.json';

export default function LoginPage() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          password,
          twoFactorCode: show2FA ? twoFactorCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes('2FA') || data.message?.includes('2 lớp')) {
          setShow2FA(true);
        }
        throw new Error(data.message || 'Đăng nhập không thành công');
      }

      // Lưu Access Token
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // Kiểm tra đổi mật khẩu lần đầu (FR-201)
      if (data.user.mustChangePassword) {
        window.location.href = '/change-password';
        return;
      }

      // Kiểm tra đồng ý dữ liệu (FR-209)
      if (!data.user.hasConsented) {
        window.location.href = '/profile#consents';
        return;
      }

      // Điều hướng theo vai trò (A9)
      if (data.user.roles.includes('admin') || data.user.roles.includes('academic')) {
        window.location.href = '/admin/users';
      } else {
        window.location.href = '/profile';
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-gradient">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 font-black text-xl mb-3">
            CL
          </div>
          <h1 className="text-2xl font-bold text-white">{vi.common.appName}</h1>
          <p className="text-slate-400 text-sm mt-1">Đăng nhập cổng đào tạo tích hợp AI</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="credential">
              Số điện thoại, Email hoặc Mã học sinh
            </label>
            <input
              id="credential"
              type="text"
              required
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder="0912345678 hoặc hs2026..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                Mật khẩu
              </label>
              <a href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                Quên mật khẩu?
              </a>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {show2FA && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-amber-400 mb-1.5" htmlFor="twofa">
                Mã xác thực 2 lớp (2FA TOTP)
              </label>
              <input
                id="twofa"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Nhập mã 6 chữ số (ví dụ: 123456)"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-amber-500/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? vi.common.loading : 'Đăng nhập vào hệ thống'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          Chưa có tài khoản? Vui lòng liên hệ Giáo vụ hoặc đăng ký học thử tại{' '}
          <a href="/" className="text-blue-400 hover:underline">
            Trang chủ
          </a>
          .
        </div>
      </div>
    </div>
  );
}
