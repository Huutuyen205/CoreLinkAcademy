'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  coverImage: string;
  tags: string[];
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/public/blog')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setPosts(data);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback demo posts if API is offline
        setPosts([
          {
            slug: 'chien-thuat-tang-1-band-ielts-speaking-trong-3-thang',
            title: 'Chiến thuật bứt phá 1.0 Band IELTS Speaking trong 3 tháng cùng AI và Shadowing',
            summary: 'Khám phá phương pháp luyện phản xạ tự nhiên, sửa phát âm IPA chuẩn xác và xây dựng thói quen tự sửa lỗi với trợ lý AI.',
            category: 'IELTS Preparation',
            readTime: '6 phút đọc',
            publishedAt: '2026-10-15',
            author: 'Thầy David Miller (Giám khảo Khảo thí Quốc tế)',
            coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
            tags: ['IELTS Speaking', 'Phương pháp AI', 'Shadowing'],
          },
          {
            slug: 'bi-quyet-chinh-phuc-cambridge-flyers-cho-hoc-sinh-tieu-hoc',
            title: 'Bí quyết giúp học sinh tiểu học đạt 15 khiên Cambridge Flyers nhẹ nhàng không áp lực',
            summary: 'Lộ trình phát triển 4 kỹ năng tự nhiên qua dự án thực tế và học tương tác chuẩn khung châu Âu CEFR A2.',
            category: 'Cambridge Kids',
            readTime: '5 phút đọc',
            publishedAt: '2026-10-12',
            author: 'Cô Nguyễn Hồng Hạnh (Chuyên gia Đào tạo Cambridge)',
            coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
            tags: ['Cambridge YLE', 'Flyers', 'Tiểu học'],
          },
          {
            slug: 'phuong-phap-hoc-tu-vung-spaced-repetition-sm2',
            title: 'Phương pháp học từ vựng nhớ lâu gấp 3 lần với thuật toán lặp lại ngắt quãng (SM-2)',
            summary: 'Giải mã đường cong quên lãng của Ebbinghaus và cách áp dụng Flashcard thông minh để làm chủ 3.000 từ vựng Oxford.',
            category: 'Học tập thông minh',
            readTime: '7 phút đọc',
            publishedAt: '2026-10-08',
            author: 'Đội ngũ R&D EdTech CoreLink',
            coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
            tags: ['Từ vựng', 'Spaced Repetition', 'EdTech'],
          },
          {
            slug: '5-loi-ngu-phap-kinh-dien-trong-ielts-writing-task-2',
            title: '5 lỗi ngữ pháp kinh điển khiến bài thi IELTS Writing Task 2 bị kẹt ở Band 5.5',
            summary: 'Phân tích các lỗi cấu trúc câu phức, mạo từ và sự hòa hợp chủ vị - động từ kèm lời giải chi tiết và bài tập thực hành.',
            category: 'IELTS Preparation',
            readTime: '8 phút đọc',
            publishedAt: '2026-10-02',
            author: 'Thầy Trần Minh Quân (IELTS 8.5 Overall)',
            coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
            tags: ['IELTS Writing', 'Ngữ pháp', 'Task 2'],
          },
        ]);
        setIsLoading(false);
      });
  }, []);

  const categories = ['All', 'IELTS Preparation', 'Cambridge Kids', 'Học tập thông minh'];

  const filteredPosts = posts.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mb-4">
          ← Quay lại Trang Chủ
        </Link>
        <span className="block text-blue-500 font-semibold text-sm uppercase tracking-wider mb-2">
          Kho Tri Thức & Phương Pháp Học
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Bí Quyết & Mẹo Chinh Phục Tiếng Anh
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
          Tổng hợp bài học miễn phí, chiến thuật thi IELTS, ngữ pháp chuyên sâu và phương pháp học thích ứng cùng AI từ đội ngũ chuyên gia CoreLink Academy.
        </p>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat === 'All' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of posts */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Đang tải danh sách bài viết...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Không tìm thấy bài viết phù hợp.</div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden hover:border-slate-700 hover:shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-xs text-slate-500 mb-2 gap-3">
                    <span>{post.publishedAt}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-3 hover:text-blue-400 transition line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4 leading-relaxed">{post.summary}</p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-slate-800/40 flex items-center justify-between">
                <span className="text-xs text-slate-400 italic">{post.author}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
