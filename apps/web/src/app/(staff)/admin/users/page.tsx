'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Search, Filter, ShieldCheck, Lock, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';
import vi from '../../../../../messages/vi.json';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'student',
    gradeLevel: 1,
    otherWorkplace: '',
  });
  const [createdInfo, setCreatedInfo] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (roleFilter) query.append('role', roleFilter);

      const res = await fetch(`/api/v1/users?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedInfo(data);
        setShowCreateModal(false);
        fetchUsers();
      } else {
        alert(data.message || 'Lỗi khi tạo người dùng');
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleLock = async (userId: string, currentStatus: string) => {
    const isLocked = currentStatus === 'locked';
    const reason = prompt('Nhập lý do thay đổi trạng thái tài khoản:') || 'Admin cập nhật';
    const token = localStorage.getItem('accessToken');

    await fetch(`/api/v1/users/${userId}/lock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lock: !isLocked, reason }),
    });

    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                Quản Trị Hệ Thống
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">RBAC 8 Vai Trò</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Quản Lý Tài Khoản & Phân Quyền</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kiểm soát người dùng, mật khẩu tạm 72h và trạng thái khóa tài khoản</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            + Tạo tài khoản mới
          </button>
        </div>

        {createdInfo && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1 shadow-2xs">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã tạo tài khoản thành công:
            </p>
            <p>- Họ tên: <strong>{createdInfo.fullName}</strong> (Vai trò: <span className="uppercase font-semibold">{createdInfo.role}</span>)</p>
            <p>- Mật khẩu tạm 72h: <strong className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{createdInfo.tempPassword}</strong></p>
            <p className="text-[11px] text-slate-500">Vui lòng cung cấp mật khẩu tạm này cho người dùng để bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
          </div>
        )}

        {/* Bộ lọc & Tìm kiếm */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tất cả vai trò</option>
            <option value="student">Học sinh</option>
            <option value="guardian">Phụ huynh</option>
            <option value="teacher">Giáo viên</option>
            <option value="academic">Giáo vụ</option>
            <option value="consultant">Tư vấn tuyển sinh</option>
            <option value="accountant">Kế toán</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </div>

        {/* Bảng danh sách người dùng */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Họ và Tên</th>
                  <th className="px-6 py-3.5">SĐT / Email</th>
                  <th className="px-6 py-3.5">Vai trò</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      {vi.common.loading}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      {vi.common.empty}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        {u.fullName}
                        {u.isYoungAccount && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            Học sinh nhỏ (&lt;16t)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        <div className="font-semibold">{u.phone || '—'}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {u.roles?.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleLock(u.id, u.status)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                            u.status === 'active'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tạo Người Dùng */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Tạo Tài Khoản Mới (Cấp Mật Khẩu Tạm)</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vai trò hệ thống</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="student">Học sinh</option>
                    <option value="guardian">Phụ huynh</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="academic">Giáo vụ</option>
                    <option value="consultant">Tư vấn tuyển sinh</option>
                    <option value="accountant">Kế toán</option>
                  </select>
                </div>

                {newUser.role === 'student' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Khối lớp (0 = Tiền tiểu học)</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={newUser.gradeLevel}
                      onChange={(e) => setNewUser({ ...newUser, gradeLevel: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Dưới lớp 6 sẽ tự động kích hoạt chế độ tài khoản học sinh nhỏ tuổi (bảo vệ quyền riêng tư).</p>
                  </div>
                )}

                {newUser.role === 'teacher' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Đơn vị công tác chính (trường đang giảng dạy)</label>
                    <input
                      type="text"
                      value={newUser.otherWorkplace}
                      onChange={(e) => setNewUser({ ...newUser, otherWorkplace: e.target.value })}
                      placeholder="VD: THPT Chuyên Hà Nội - Amsterdam..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    {vi.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
