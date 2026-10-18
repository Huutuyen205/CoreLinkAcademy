'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
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
        window.location.href = '/admin/dashboard';
      } else if (data.user.roles.includes('consultant')) {
        window.location.href = '/consultant/leads';
      } else if (data.user.roles.includes('teacher')) {
        window.location.href = '/teacher';
      } else if (data.user.roles.includes('parent')) {
        window.location.href = '/parent';
      } else {
        window.location.href = '/student';
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
            CL
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {vi.common.appName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cổng Đào Tạo & Quản Trị Học Vụ Thông Minh
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="credential">
                Số điện thoại, Email hoặc Mã học sinh
              </label>
              <div className="relative">
                <input
                  id="credential"
                  type="text"
                  required
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="0912345678 hoặc hs2026..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {show2FA && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5" htmlFor="twofa">
                  Mã xác thực 2 lớp (TOTP 6 số)
                </label>
                <input
                  id="twofa"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Nhập mã 6 chữ số từ app Authenticator"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                'Đang kiểm tra thông tin...'
              ) : (
                <>
                  Đăng nhập vào hệ thống
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Học viên chưa có tài khoản? Vui lòng liên hệ Phòng Giáo vụ hoặc{' '}
            <Link href="/register-trial" className="text-blue-600 hover:underline font-semibold">
              Đăng ký học thử
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
