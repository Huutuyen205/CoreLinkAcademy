'use client';

import React, { useEffect, useState } from 'react';
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
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản Lý Tài Khoản & Phân Quyền</h1>
          <p className="text-slate-400 text-sm mt-0.5">Màn hình quản trị S43 — Kiểm soát người dùng và vai trò</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
        >
          + Tạo tài khoản mới
        </button>
      </div>

      {createdInfo && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-1">
          <p className="font-bold">Đã tạo tài khoản thành công:</p>
          <p>- Họ tên: {createdInfo.fullName} (Vai trò: {createdInfo.role})</p>
          <p>- Mật khẩu tạm 72h: <strong className="text-white bg-slate-900 px-2 py-0.5 rounded">{createdInfo.tempPassword}</strong></p>
          <p className="text-xs text-slate-400">Vui lòng cung cấp mật khẩu tạm này cho người dùng để đổi lần đầu.</p>
        </div>
      )}

      {/* Bộ lọc & Tìm kiếm */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
        >
          <option value="">Tất cả vai trò</option>
          <option value="student">Học sinh</option>
          <option value="guardian">Phụ huynh</option>
          <option value="teacher">Giáo viên</option>
          <option value="academic">Giáo vụ</option>
          <option value="consultant">Tư vấn</option>
          <option value="accountant">Kế toán</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">SĐT / Email</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {vi.common.loading}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {vi.common.empty}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium text-white">
                      {u.fullName}
                      {u.isYoungAccount && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Học sinh nhỏ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div>{u.phone || '—'}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {u.roles?.join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleLock(u.id, u.status)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          u.status === 'active'
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-white">Tạo Người Dùng Mới (FR-201)</h2>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vai trò</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value="student">Học sinh</option>
                  <option value="guardian">Phụ huynh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="academic">Giáo vụ</option>
                  <option value="consultant">Tư vấn</option>
                  <option value="accountant">Kế toán</option>
                </select>
              </div>

              {newUser.role === 'student' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Khối lớp (0 = Tiền tiểu học)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={newUser.gradeLevel}
                    onChange={(e) => setNewUser({ ...newUser, gradeLevel: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Dưới lớp 6 sẽ tự động kích hoạt tài khoản nhỏ.</p>
                </div>
              )}

              {newUser.role === 'teacher' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nơi công tác khác (trường đang dạy)</label>
                  <input
                    type="text"
                    value={newUser.otherWorkplace}
                    onChange={(e) => setNewUser({ ...newUser, otherWorkplace: e.target.value })}
                    placeholder="THPT Chuyên..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
                >
                  {vi.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
