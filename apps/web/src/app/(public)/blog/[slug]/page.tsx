'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`http://localhost:4000/api/v1/public/blog/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPost(data);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback demo content
        setPost({
          slug,
          title: 'Chiến thuật bứt phá 1.0 Band IELTS Speaking trong 3 tháng cùng AI và Shadowing',
          author: 'Thầy David Miller (Giám khảo Khảo thí Quốc tế)',
          publishedAt: '2026-10-15',
          readTime: '6 phút đọc',
          category: 'IELTS Preparation',
          coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          summary: 'Khám phá phương pháp luyện phản xạ tự nhiên, sửa phát âm IPA chuẩn xác và xây dựng thói quen tự sửa lỗi với trợ lý AI.',
          content: `
### Giới thiệu vấn đề
Trong quá trình học và luyện thi chứng chỉ tiếng Anh quốc tế, nhiều học viên gặp tình trạng dù học rất nhiều từ vựng và ngữ pháp nhưng khi bước vào phòng thi hoặc giao tiếp thực tế lại bị ngập ngừng, thiếu phản xạ hoặc mắc các lỗi ngữ pháp cơ bản.

### 3 Trụ Cột Đột Phá Tại CoreLink Academy
1. **Luyện tập lặp lại ngắt quãng (Spaced Repetition)**: Ôn tập đúng vào thời điểm não bộ sắp quên từ vựng để chuyển kiến thức vào bộ nhớ dài hạn.
2. **AI Speaking Coach phản hồi tức thì**: Ghi âm và so sánh biểu đồ phát âm với người bản xứ, phân tích chuẩn xác từng âm vị IPA.
3. **Thực hành viết có giáo viên và AI song hành**: AI chỉ ra bẫy ngữ pháp và giáo viên định hướng phong cách viết học thuật tự nhiên.

### Lời khuyên từ chuyên gia
Hãy duy trì thói quen luyện tập tối thiểu 20 phút mỗi ngày trên hệ thống CoreLink Academy thay vì học dồn vào cuối tuần. Chúc các bạn sớm đạt được band điểm mục tiêu!
          `,
          relatedPrograms: [
            { code: 'IELTS-65', name: 'Luyện thi IELTS Bứt phá Target 6.5', target: '6.5' },
            { code: 'ENG-FLYERS', name: 'Tiếng Anh Thiếu Nhi Flyers (A2)', target: 'A2' },
          ],
        });
        setIsLoading(false);
      });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
        <Link href="/blog" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500">
          ← Quay lại danh mục Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/blog" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
            ← Tất cả bài viết
          </Link>
          <span className="text-xs bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full border border-blue-800/40">
            {post.category}
          </span>
        </div>

        {/* Title & Metadata */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pb-6 border-b border-slate-800 mb-8">
          <span className="text-white font-medium">{post.author}</span>
          <span>•</span>
          <span>{post.publishedAt}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        {/* Cover image */}
        <div className="rounded-2xl overflow-hidden mb-10 max-h-96 w-full">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Summary Box */}
        <div className="p-6 rounded-2xl bg-blue-950/30 border border-blue-900/40 mb-10 text-slate-200 text-base leading-relaxed italic">
          "{post.summary}"
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none text-slate-300 space-y-6 leading-relaxed text-base sm:text-lg whitespace-pre-line">
          {post.content}
        </div>

        {/* Call to action card */}
        <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-800/40 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Muốn kiểm tra trình độ tiếng Anh chuẩn quốc tế ngay hôm nay?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Làm bài test 25 câu hỏi đánh giá 4 kỹ năng được phân tích bởi AI và nhận đề xuất lộ trình học tối ưu từ chuyên gia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/placement-test"
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition"
            >
              Làm bài kiểm tra miễn phí
            </Link>
            <Link
              href="/register-trial"
              className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-700 transition"
            >
              Đăng ký học thử 1 buổi
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
