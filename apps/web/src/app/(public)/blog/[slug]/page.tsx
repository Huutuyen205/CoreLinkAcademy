'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/public/blog/${slug}`)
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
      <div className="min-h-screen bg-[#F7F9FC] text-slate-600 flex items-center justify-center text-sm font-medium">
        Đang tải nội dung bài viết...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Không tìm thấy bài viết</h1>
        <Link href="/blog" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-xs">
          ← Quay lại danh mục Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tất cả bài viết
          </Link>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full border border-blue-200">
            {post.category}
          </span>
        </div>
      </header>

      <article className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        {/* Title & Metadata */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 pb-6 border-b border-slate-200 mb-8">
          <span className="font-semibold text-slate-800">{post.author}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{post.publishedAt}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
        </div>

        {/* Cover image */}
        <div className="rounded-2xl overflow-hidden mb-8 max-h-96 w-full shadow-xs bg-slate-100">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Summary Box */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 mb-8 text-blue-950 text-sm leading-relaxed italic">
          "{post.summary}"
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm text-slate-700 space-y-5 leading-relaxed text-sm sm:text-base whitespace-pre-line">
          {post.content}
        </div>

        {/* Call to action card */}
        <div className="mt-10 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-center shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Khảo Thí Tiếng Anh Chuẩn Quốc Tế
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
            Muốn kiểm tra trình độ tiếng Anh chuẩn quốc tế ngay hôm nay?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto mb-6">
            Làm bài test đánh giá năng lực phản xạ ngôn ngữ và nhận tư vấn lộ trình học tối ưu từ ban cố vấn học thuật CoreLink.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/placement-test/sample"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              Làm bài kiểm tra miễn phí
            </Link>
            <Link
              href="/register-trial"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 text-xs sm:text-sm transition-all"
            >
              Đăng ký học thử 1 buổi
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
