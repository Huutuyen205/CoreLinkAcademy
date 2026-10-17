'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  type: 'worksheet' | 'vocabulary' | 'slides' | 'document' | 'video';
  sessionName: string;
  size: string;
  createdAt: string;
  isAi?: boolean;
}

export default function StudentMaterialsPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const materials: Material[] = [
    {
      id: 'mat-1',
      title: 'Phiếu bài tập từ vựng Unit 4: Family Members & Hobbies',
      type: 'worksheet',
      sessionName: 'Buổi 6: Gia đình và sở thích',
      size: '1.4 MB',
      createdAt: '16/10/2026',
    },
    {
      id: 'mat-2',
      title: 'Slide bài giảng Unit 4: Present Continuous for Activities',
      type: 'slides',
      sessionName: 'Buổi 6: Gia đình và sở thích',
      size: '8.2 MB',
      createdAt: '16/10/2026',
    },
    {
      id: 'mat-3',
      title: 'Danh sách từ vựng trọng tâm YLE Movers Unit 1 - 4',
      type: 'vocabulary',
      sessionName: 'Học liệu dùng chung',
      size: '512 KB',
      createdAt: '10/10/2026',
    },
    {
      id: 'mat-4',
      title: 'Video hướng dẫn phát âm đuôi -ing và liên kết từ',
      type: 'video',
      sessionName: 'Buổi 5: Ngữ âm chuyên sâu',
      size: '45 MB',
      createdAt: '12/10/2026',
    },
  ];

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.sessionName.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || m.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'worksheet':
        return { label: 'Phiếu bài tập', icon: '📝', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'slides':
        return { label: 'Slide bài giảng', icon: '📊', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'vocabulary':
        return { label: 'Từ vựng', icon: '🔤', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'video':
        return { label: 'Video bài giảng', icon: '🎬', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Tài liệu', icon: '📄', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-blue-600 hover:underline">
                ← Bảng điều khiển
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Kho tài liệu học tập</h1>
            <p className="text-slate-500 text-sm">
              Lớp: <span className="font-semibold text-slate-800">Cambridge Movers 01</span> • Tài liệu chuẩn hóa theo từng buổi học
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tài liệu, từ khóa, buổi học..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'worksheet', 'slides', 'vocabulary', 'video'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all'
                  ? 'Tất cả'
                  : type === 'worksheet'
                  ? 'Bài tập'
                  : type === 'slides'
                  ? 'Slides'
                  : type === 'vocabulary'
                  ? 'Từ vựng'
                  : 'Video'}
              </button>
            ))}
          </div>
        </div>

        {/* Material Items List */}
        <div className="space-y-3">
          {filteredMaterials.map((m) => {
            const badge = getTypeBadge(m.type);
            return (
              <div
                key={m.id}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">• {m.sessionName}</span>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dung lượng: {m.size} • Đăng ngày {m.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => alert(`Bắt đầu tải xuống: ${m.title}`)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⬇️</span> Tải về máy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
