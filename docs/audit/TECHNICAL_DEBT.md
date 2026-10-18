# BÁO CÁO NỢ KỸ THUẬT & ĐIỂM CẦN NÂNG CẤP (TECHNICAL DEBT)
**Dự án**: CoreLink Academy  
**Mục tiêu**: Nhận diện các điểm thắt cổ chai, nợ kỹ thuật và cơ hội tối ưu hóa để đưa hệ thống đạt chuẩn doanh nghiệp quốc tế.

---

## 1. Frontend & Trải Nghiệm Người Dùng (UI/UX Debt)

- **Trang chủ Landing Page (`apps/web/src/app/page.tsx`)**:
  - *Hiện trạng*: Trang chủ hiện tại đã có bố cục đầy đủ (Hero, Giá trị cốt lõi, Khóa học, Phương pháp AI, CTA) nhưng cảm giác thị giác còn mang tính chất hệ thống quản trị, chưa đủ "hút mắt" và truyền cảm hứng thương hiệu như VUS hay ILA.
  - *Giải pháp*: Tái cấu trúc Hero Section với Typography hiện đại, badge "Công nghệ AI độc quyền", nút CTA đa tầng (Kiểm tra trình độ miễn phí 3 bước / Đăng ký nhận lộ trình), bộ đếm học viên & điểm số thực tế, thẻ preview lớp học trực quan.
- **Microphone & Thu Âm Luyện Nói (Speaking Coach)**:
  - *Hiện trạng*: Đang hỗ trợ text-based AI tutor; chưa có giao diện ghi âm bằng microphone trực tiếp trên trình duyệt.
  - *Giải pháp*: Xây dựng component `AudioRecorder` dùng HTML5 `MediaRecorder` API và Web Audio API, hiển thị sóng âm trực quan (waveform visualizer) và gửi audio blob / transcript lên AI phân tích.
- **Hệ thống Thông Báo Toast & Modal**:
  - *Hiện trạng*: Sử dụng `alert()` hoặc state cục bộ ở một vài form nhỏ.
  - *Giải pháp*: Chuẩn hóa bộ component Toast / Dialog toàn hệ thống với animation mượt mà.

---

## 2. Backend & Kiến Trúc AI (Backend & AI Gateway Debt)

- **AI Speaking Analysis Pipeline**:
  - *Hiện trạng*: Hệ thống AI Gateway đã hỗ trợ Claude 3.5 Sonnet và Gemini 1.5 Flash nhưng chủ yếu xử lý text prompt và RAG embeddings.
  - *Giải pháp*: Bổ sung endpoint `/api/v1/ai/speaking-analyze` nhận diện lỗi phát âm (IPA), độ mạch lạc (Fluency), ngữ pháp và đề xuất cách diễn đạt tự nhiên hơn theo khung CEFR.
- **Thuật Toán Lặp Lại Ngắt Quãng SM-2 (Spaced Repetition)**:
  - *Hiện trạng*: Học sinh luyện bài tập theo danh sách tĩnh hoặc đề xuất thích ứng đơn giản.
  - *Giải pháp*: Tích hợp công thức SuperMemo-2 (SM-2: Ease Factor, Interval, Repetitions) cho tính năng ôn từ vựng thông minh (AI Vocabulary Flashcards).
- **Hạn Mức Ngân Sách AI (AI Budget Guard)**:
  - *Hiện trạng*: Đã có biến `AI_MONTHLY_BUDGET_USD=150` và ghi nhận usage token trong `ai_usage_logs`.
  - *Điểm tối ưu*: Cần bổ sung cảnh báo qua WebPush/Email cho Quản trị viên khi ngân sách vượt ngưỡng 80% ($120) trong tháng.

---

## 3. Cơ Sở Dữ Liệu & Hiệu Năng (Database & Query Performance)

- **Nguyên tắc cốt lõi**: Giữ vững nguyên tắc **Database-First** và không chỉnh sửa `db/000_schema.sql`.
- **Tận dụng các trường JSON & Metadata có sẵn**:
  - Các bảng `competencies`, `curriculum_lessons`, `ai_usage_logs` đều có các trường `json` mở rộng cho phép lưu trữ cấu trúc âm thanh, IPA, và tham số flashcard SM-2 mà không phá vỡ cấu trúc CSDL hiện hành.
- **Tối ưu hóa chỉ mục (Indexes)**:
  - Đảm bảo các truy vấn phân trang trên `leads`, `submissions`, `class_sessions` đều tận dụng composite indexes có sẵn.

---

## 4. Kế Hoạch Giải Quyết Nợ Kỹ Thuật

| Hạng mục | Độ ưu tiên | Thời gian dự kiến | Rủi ro ảnh hưởng |
|---|:---:|:---:|:---:|
| Nâng cấp Trang Chủ chuẩn thương mại VUS/ILA | **Cao (P1)** | Giai đoạn nâng cấp UI | Không ảnh hưởng backend API |
| Bổ sung AI Speaking Coach (Thu âm Microphone) | **Cao (P1)** | Giai đoạn nâng cấp AI | Độc lập, không ảnh hưởng module khác |
| Bổ sung AI Flashcard Ôn tập từ vựng SM-2 | **Vừa (P2)** | Giai đoạn nâng cấp Học tập | Tận dụng API hiện tại |
| Trang Blog & Tài nguyên luyện thi công khai | **Vừa (P2)** | Giai đoạn Public Web | Hoàn toàn mới, độc lập |
