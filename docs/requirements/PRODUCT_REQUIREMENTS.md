# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)
**Dự án**: CoreLink Academy — Nền Tảng Quản Lý & Đào Tạo Tiếng Anh Thế Hệ Mới Tích Hợp AI  
**Phiên bản**: v2.0  
**Tác giả**: Đội ngũ Product Owner & Business Analyst  

---

## 1. Tầm Nhìn Sản Phẩm (Product Vision)

CoreLink Academy được định vị là **hệ sinh thái EdTech toàn diện**, kết hợp giữa:
1. **Website thương mại & tuyển sinh chuyên nghiệp**: Quảng bá thương hiệu, giới thiệu khóa học chuẩn quốc tế (Cambridge YLE, IELTS, Tiếng Anh giao tiếp), cung cấp bài thi xếp lớp trực tuyến và chuyển đổi khách hàng tiềm năng.
2. **Hệ thống quản lý học tập (LMS) thế hệ mới**: Học viên học tập có định hướng, làm bài tập chống gian lận, luyện tập thích ứng với radar năng lực 4 kỹ năng và gia sư AI đồng hành 24/7.
3. **Cổng phụ huynh minh bạch (Parent Portal)**: Giúp phụ huynh nắm bắt sát sao từng buổi học của con qua báo cáo ngày và báo cáo tháng do AI tổng hợp, giáo viên phê duyệt.
4. **Hệ thống điều hành trung tâm tự động hóa**: Điểm danh QR động bảo mật GPS, xếp lớp, quản lý học phí trực tuyến, tính lương giáo viên tự động và cảnh báo sớm học viên có nguy cơ bỏ học.

---

## 2. Hệ Thống Vai Trò Người Dùng (User Roles & Access Control)

Hệ thống hỗ trợ 7 vai trò người dùng chuẩn hóa theo mô hình RBAC:
1. **Khách truy cập (Guest)**: Xem trang chủ, tìm kiếm khóa học, thi xếp lớp thử, gửi yêu cầu tư vấn, trò chuyện với Chatbot AI tuyển sinh.
2. **Học sinh (Student)**: Làm bài tập, làm bài thi online, xem kết quả và giải thích đáp án, luyện tập với AI Tutor 1-1, AI Speaking Coach, ôn từ vựng Flashcard, quét mã QR điểm danh.
3. **Phụ huynh (Guardian)**: Xem tiến độ học tập của các con, xem báo cáo nhận xét của giáo viên, đóng học phí trực tuyến qua VietQR/VNPay, làm khảo sát độ hài lòng NPS, giới thiệu học viên nhận thưởng.
4. **Giáo viên (Teacher)**: Quản lý lớp được phân công, điểm danh buổi học bằng QR & GPS, giao bài tập, chấm điểm tự luận có AI hỗ trợ, duyệt báo cáo tháng, xem bảng lương cá nhân.
5. **Giáo vụ (Academic)**: Quản lý chương trình đào tạo, mở lớp, xếp phòng học, điều phối lịch học, duyệt giáo trình điện tử và video bài giảng AI.
6. **Tư vấn viên (Consultant)**: Quản lý phễu leads tuyển sinh, chăm sóc khách hàng, phân bổ lịch thi xếp lớp và tư vấn lộ trình học.
7. **Kế toán (Accountant)**: Quản lý biểu phí, theo dõi công nợ học phí, xuất hóa đơn, tính toán và chi trả bảng lương giáo viên.
8. **Quản trị viên (Admin)**: Toàn quyền quản trị hệ thống, quản lý người dùng, phân quyền, cấu hình hệ thống, kho tri thức RAG, theo dõi ngân sách AI và nhận báo cáo điều hành từ AI Executive Assistant.

---

## 3. Yêu Cầu Chức Năng Chi Tiết (Functional Requirements)

### 3.1. Phân Hệ Công Khai & Tuyển Sinh (Public & Admission)
- **FR-PUB-01 (Trang chủ hiện đại)**: Hero Section ấn tượng, bộ lọc khóa học theo độ tuổi, giới thiệu phương pháp học Blended Learning, đội ngũ giáo viên chuẩn quốc tế, chứng thực kết quả học viên thực tế.
- **FR-PUB-02 (Kiểm tra trình độ Online)**: Cung cấp bài thi xếp lớp 25 câu hỏi trắc nghiệm kèm đánh giá mức độ tự tin, tính điểm và gợi ý lộ trình CEFR A1–C1 tự động.
- **FR-PUB-03 (Chatbot AI RAG tuyển sinh)**: Trợ lý AI nổi trên web, trả lời chính xác dựa trên tài liệu Knowledge Base đã được duyệt, chặn các câu hỏi ngoài phạm vi hoặc cố ý bẫy giá.
- **FR-PUB-04 (Thu thập Lead & Đăng ký học thử)**: Form đăng ký 1 chạm có chống spam, ghi nhận vào CRM cho tư vấn viên tiếp nhận trong vòng 15 phút.
- **FR-PUB-05 (Blog & Tài nguyên học tập)**: Đăng tải bài học miễn phí, mẹo luyện thi IELTS, kiến thức ngữ pháp và tài liệu tải về.

### 3.2. Phân Hệ Học Tập Trực Tuyến & Học Tập Thích Ứng (Student LMS)
- **FR-LMS-01 (Làm bài kiểm tra & Chống gian lận AI-06)**: Làm bài trắc nghiệm và tự luận trực tuyến; tự động khóa bài khi chuyển tab hoặc mất focus quá số lần cho phép.
- **FR-LMS-02 (Chấm điểm tự động & Giải thích chi tiết AI)**: Chấm điểm trắc nghiệm tức thời; nút "AI giải thích câu này" phân tích chi tiết lỗi sai và quy tắc ngữ pháp liên quan.
- **FR-LMS-03 (AI Tutor 1-kèm-1)**: Hội thoại văn bản hoặc đàm thoại với AI Tutor theo ngữ cảnh bài học, giải thích từ vựng, ngữ pháp theo trình độ.
- **FR-LMS-04 (AI Speaking Coach)**: Ghi âm giọng nói qua microphone, phân tích ngữ âm (IPA), độ lưu loát và ngữ pháp, đưa ra gợi ý cách diễn đạt tự nhiên hơn.
- **FR-LMS-05 (AI Vocabulary Flashcard - Spaced Repetition)**: Ôn tập từ vựng cá nhân hóa theo thuật toán lặp lại ngắt quãng SM-2.
- **FR-LMS-06 (Bản đồ năng lực 4 kỹ năng)**: Radar Chart hiển thị tiến độ 4 kỹ năng Nghe - Nói - Đọc - Viết so chiếu theo khung CEFR và Cambridge.

### 3.3. Phân Hệ Phụ Huynh (Parent Portal)
- **FR-PAR-01 (Báo cáo ngày tự động)**: Gửi thông báo tóm tắt buổi học (điểm danh, bài tập, nhận xét của GV) lúc 20:00 mỗi ngày có buổi học.
- **FR-PAR-02 (Báo cáo tháng AI)**: AI tổng hợp dữ liệu học tập trong tháng, soạn dự thảo nhận xét sâu sắc để giáo viên xem xét và duyệt trước ngày 3 hàng tháng.
- **FR-PAR-03 (Thanh toán học phí VietQR/VNPay)**: Hiển thị thông báo học phí, mã QR chuyển khoản tự động khớp lệnh qua Webhook an toàn.
- **FR-PAR-04 (Khảo sát NPS)**: Thu thập phản hồi định kỳ của phụ huynh qua liên kết an toàn mã hóa token HMAC-SHA256.

### 3.4. Phân Hệ Giảng Dạy & Chấm Bài (Teacher Studio)
- **FR-TEA-01 (Điểm danh GPS & QR động)**: Giáo viên check-in GPS trong bán kính cơ sở (150m) kèm ảnh chụp lớp học; sinh mã QR động 30s xoay một lần cho học sinh quét.
- **FR-TEA-02 (Chấm bài tự luận có AI hỗ trợ AI-07)**: AI chấm sơ bộ theo thang đo chuẩn (Grammar, Vocabulary, Task Achievement), giáo viên duyệt hoặc sửa điểm trước khi công bố.
- **FR-TEA-03 (Sinh đề thi & Bài tập AI)**: Giáo viên nhập chủ đề hoặc tải tài liệu, AI sinh câu hỏi trắc nghiệm đa dạng có kiểm duyệt.

### 3.5. Phân Hệ Điều Hành, Tài Chính & AI Assistant
- **FR-ADM-01 (Cảnh báo sớm nguy cơ thôi học AI-14)**: Phân tích chuyên cần, điểm số suy giảm, chậm đóng học phí để cảnh báo giáo vụ chăm sóc kịp thời.
- **FR-ADM-02 (Trợ lý điều hành AI-15)**: Báo cáo phân tích doanh thu, tỷ lệ chuyển đổi leads, năng suất giảng dạy theo thời gian thực (chế độ chỉ đọc an toàn).
- **FR-ADM-03 (Kiểm soát ngân sách AI)**: Tự động ngắt kết nối gọi AI nếu chi phí trong tháng chạm ngưỡng ngân sách thiết lập (mặc định $150/tháng).

---

## 4. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

1. **Hiệu năng & Tốc độ**: Thời gian phản hồi API < 200ms cho các truy vấn dữ liệu chuẩn, tải trang web < 1.5s trên mạng 4G.
2. **Khả năng mở rộng**: Cấu trúc Monorepo và Database 3NF sẵn sàng mở rộng chuỗi nhiều cơ sở (`branch_id`).
3. **Bảo mật**: Mật khẩu mã hóa Argon2id, xác thực JWT kép (Access 15m, Refresh 7d), mã hóa HMAC cho QR điểm danh và khảo sát, tuân thủ Nghị định 13/2023/NĐ-CP về quyền riêng tư.
4. **Trải nghiệm di động (PWA)**: Hoạt động trơn tru trên thiết bị di động, có thể cài đặt về màn hình chính, hỗ trợ push notification.
