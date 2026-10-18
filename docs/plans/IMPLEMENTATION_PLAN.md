# KẾ HOẠCH TRIỂN KHAI NÂNG CẤP TOÀN DIỆN (IMPLEMENTATION PLAN)
**Dự án**: CoreLink Academy — Nâng Tầm Chất Lượng Đạt Chuẩn Quốc Tế  
**Nguyên tắc**: Triển khai theo từng bước độc lập, kiểm thử nghiêm ngặt, bảo toàn 100% các tính năng và dữ liệu đã hoàn thành.

---

## 1. Tổng Quan Lộ Trình Triển Khai

| Giai Đoạn | Tên Bước | Trọng Tâm Phát Triển | Thời Gian Dự Kiến | Kết Quả Đầu Ra |
|---|---|---|---|---|
| **Bước I** | Nâng Cấp Trang Chủ Chuẩn Thương Mại | Hero Section đỉnh cao, Phễu test trình độ 3 bước, Lộ trình học tương tác, Blog & Tài nguyên | Giai đoạn 1 | Trang chủ đạt chuẩn VUS/ILA, tăng tỷ lệ chuyển đổi |
| **Bước II** | AI Speaking Coach (Phòng Luyện Nói Microphone) | Web Audio API thu âm trực tiếp, AI phân tích phát âm IPA, độ lưu loát & gợi ý diễn đạt | Giai đoạn 2 | Học sinh luyện nói 1-1 qua giọng nói thật |
| **Bước III** | AI Vocabulary Flashcard (Spaced Repetition) | Sổ tay từ vựng cá nhân, thuật toán lặp lại ngắt quãng SM-2, ôn tập thông minh | Giai đoạn 3 | Học sinh ghi nhớ từ vựng lâu dài |
| **Bước IV** | Tối Ưu Hóa PWA, Kiểm Thử Toàn Diện & Bàn Giao | Kiểm thử hồi quy 100% test cases, tối ưu Core Web Vitals, đóng gói tài liệu bàn giao | Giai đoạn 4 | Hệ thống sẵn sàng vận hành thương mại 100% |

---

## 2. Kế Hoạch Chi Tiết Từng Bước

### Bước I: Nâng Cấp Trang Chủ Thương Mại & Tài Nguyên Học Tập (Public & Blog)
- **Mục tiêu**: Đưa giao diện trang chủ từ mức chuẩn kỹ thuật lên chuẩn thương mại cao cấp, truyền cảm hứng học tập và tối ưu chuyển đổi tuyển sinh giống VUS và ILA.
- **Phạm vi được phép sửa**:
  - Frontend: `apps/web/src/app/page.tsx`, `apps/web/src/components/landing/*`, `apps/web/src/app/blog/*`
  - Backend: `apps/api/src/modules/public-leads/`
- **Công việc chi tiết**:
  1. *Hero Section*: Thiết kế tiêu đề truyền cảm hứng ("Chinh phục tiếng Anh chuẩn quốc tế cùng trợ lý AI cá nhân hóa"), 2 CTA nổi bật (Làm bài kiểm tra trình độ miễn phí 3 bước / Nhận tư vấn lộ trình), Huy hiệu "Đạt chuẩn CEFR & Cambridge", Bộ đếm thành tích thực tế.
  2. *Bộ Lọc Khóa Học Trực Quan*: Phân loại 4 nhóm đối tượng: Tiếng Anh Thiếu Nhi (YLE), Thiếu Niên (Junior), Luyện Thi IELTS và Tiếng Anh Giao Tiếp.
  3. *Lộ Trình Học Tương Tác*: Trực quan hóa các chặng học (Foundation -> Breakthrough -> Mastery) với mục tiêu đầu ra và thời lượng rõ ràng.
  4. *Đội Ngũ Giáo Viên*: Giới thiệu giảng viên bản ngữ và Việt Nam đạt chuẩn CELTA, TESOL, IELTS 8.0+.
  5. *Mục Blog & Tài Nguyên Học Thuật*: Danh sách bài viết chia sẻ bí quyết học tiếng Anh, bài tập ngữ pháp và mẹo làm bài thi.
- **Kiểm thử**: Chạy `pnpm build` xác thực trang chủ và các trang con render tĩnh/động mượt mà, responsive trên 5 kích thước màn hình.
- **Module không ảnh hưởng**: Cổng học sinh, cổng giáo viên, CSDL `db/000_schema.sql`.

---

### Bước II: AI Speaking Coach (Phòng Luyện Nói Thu Âm Trực Tiếp)
- **Mục tiêu**: Bổ sung tính năng luyện nói tương tác bằng giọng nói thật qua microphone trình duyệt, có AI phân tích phát âm và ngữ pháp.
- **Phạm vi được phép sửa**:
  - Frontend: `apps/web/src/app/student/speaking/page.tsx`, `apps/web/src/components/audio/AudioRecorder.tsx`
  - Backend: `apps/api/src/modules/competency/`
  - Package AI: `packages/ai/src/gateway.ts`
- **Công việc chi tiết**:
  1. Xây dựng component `AudioRecorder` sử dụng Web Audio API / MediaRecorder, hiển thị hiệu ứng sóng âm khi học sinh phát âm.
  2. Backend tiếp nhận âm thanh / văn bản nhận diện, gửi tới AI Gateway phân tích theo 3 tiêu chí:
     - Pronunciation & IPA (Nhận diện từ phát âm chưa chuẩn).
     - Fluency & Coherence (Độ ngắt nghỉ và mạch lạc).
     - Lexical & Grammar (Ngữ pháp và gợi ý cách diễn đạt tự nhiên hơn).
  3. Có cơ chế fallback mượt mà nếu trình duyệt không hỗ trợ microphone hoặc người dùng chưa cấp quyền.
- **Kiểm thử**: Viết test case E2E kiểm tra endpoint phân tích Speaking, đảm bảo phản hồi trong thời gian < 3 giây.
- **Module không ảnh hưởng**: Tài chính, điểm danh QR, cổng phụ huynh.

---

### Bước III: AI Vocabulary Flashcards & Thuật Toán Spaced Repetition (SM-2)
- **Mục tiêu**: Hỗ trợ học viên lưu từ vựng từ các bài học và luyện tập ngắt quãng theo thuật toán SuperMemo-2 (SM-2).
- **Phạm vi được phép sửa**:
  - Frontend: `apps/web/src/app/student/vocabulary/page.tsx`
  - Backend: `apps/api/src/modules/competency/`
- **Công việc chi tiết**:
  1. Giao diện thẻ Flashcard lật 2 mặt (từ vựng, phát âm, từ loại, nghĩa tiếng Việt, ví dụ câu ngữ cảnh và âm thanh mẫu).
  2. Triển khai thuật toán tính toán khoảng thời gian ôn tập (Interval, Repetition, Ease Factor) khi học sinh đánh giá mức độ nhớ: Rất khó (0), Khó (3), Tốt (4), Rất dễ (5).
  3. Nhắc nhở danh sách từ vựng cần ôn lại trong ngày trên Dashboard học sinh.
- **Kiểm thử**: Kiểm tra tính toán chính xác chu kỳ lặp lại ngắt quãng qua unit test.
- **Module không ảnh hưởng**: Tuyển sinh, CRM, quản lý lớp học.

---

### Bước IV: Tối Ưu Hóa PWA, Kiểm Thử Hồi Quy & Đóng Gói Bàn Giao
- **Mục tiêu**: Kiểm tra hồi quy toàn diện 100% test cases của toàn bộ hệ thống, đảm bảo không có bất kỳ lỗi biên dịch nào.
- **Công việc chi tiết**:
  1. Chạy `pnpm typecheck` (Đảm bảo 0 lỗi TypeScript trên cả 6 workspace projects).
  2. Chạy `pnpm build` (Xác thực đóng gói hoàn tất cho cả API và Web).
  3. Chạy toàn bộ 16 bộ test E2E (`pnpm test:e2e`).
  4. Cập nhật tài liệu tiến độ `docs/PROGRESS.md` và tài liệu tổng kết.
