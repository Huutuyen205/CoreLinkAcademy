'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Calendar, ArrowRight, Search, Sparkles } from 'lucide-react';

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
  const INITIAL_POSTS: BlogPost[] = [
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
  ];

  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const categories = ['All', 'IELTS Preparation', 'Cambridge Kids', 'Học tập thông minh'];

  const filteredPosts = posts.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              CL
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">CoreLink Academy</span>
              <p className="text-xs text-slate-500 font-medium">Kho Tri Thức & Phương Pháp Học</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/courses" className="text-slate-600 hover:text-blue-600 transition-colors">Khóa học</Link>
            <Link href="/register-trial" className="text-slate-600 hover:text-blue-600 transition-colors">Đăng ký học thử</Link>
            <Link href="/blog" className="text-blue-600 font-semibold">Tài nguyên học</Link>
            <Link href="/login" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center py-12 px-4 sm:px-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Tài Nguyên Miễn Phí • Chuẩn Khảo Thí Quốc Tế
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Bí Quyết & Mẹo Chinh Phục Tiếng Anh
        </h1>
        <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
          Tổng hợp bài học miễn phí, chiến thuật thi IELTS, ngữ pháp chuyên sâu và phương pháp học thích ứng cùng AI từ đội ngũ chuyên gia CoreLink Academy.
        </p>

        {/* Search */}
        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề, kỹ năng, mẹo học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm shadow-xs"
          />
        </div>

        {/* Categories */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat === 'All' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Post Grid */}
      <main className="max-w-6xl mx-auto pb-16 px-4 sm:px-6">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Đang tải danh sách bài viết...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm italic">Không tìm thấy bài viết phù hợp.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-blue-700 text-xs px-2.5 py-1 rounded-md font-bold shadow-xs">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center text-xs text-slate-400 mb-2 gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.publishedAt}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">{post.summary}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-auto flex items-center justify-between text-xs">
                  <span className="text-slate-400 italic line-clamp-1 max-w-[180px]">{post.author}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
