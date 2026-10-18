# HỆ THỐNG USER STORIES & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)
**Dự án**: CoreLink Academy  

---

## 1. Người Dùng: Khách Truy Cập (Guest)

### US-G01: Tìm kiếm & Đăng ký Khóa học Phù hợp
- **Là một** phụ huynh hoặc học viên tiềm năng,
- **Tôi muốn** tìm kiếm khóa học theo độ tuổi (tiểu học, THCS, luyện thi IELTS) và xem lộ trình chi tiết cùng học phí,
- **Để** tôi có thể chọn được chương trình phù hợp và đăng ký học thử.
- **Tiêu chí nghiệm thu (Given - When - Then)**:
  - *Given*: Khách truy cập vào trang chủ hoặc trang `/courses`.
  - *When*: Chọn bộ lọc "Luyện thi IELTS" và chọn khóa học "IELTS Bứt phá 6.5".
  - *Then*: Hệ thống hiển thị mục tiêu đầu ra, thời lượng 60 buổi, biểu phí niêm yết và form đăng ký học thử 1 chạm.

### US-G02: Kiểm Tra Trình Độ Trực Tuyến Tức Thì
- **Là một** học viên mới,
- **Tôi muốn** làm bài kiểm tra tiếng Anh 25 câu hỏi trắc nghiệm ngay trên website,
- **Để** biết được trình độ CEFR hiện tại của mình và nhận đề xuất lộ trình học.
- **Tiêu chí nghiệm thu**:
  - *Given*: Người dùng bấm "Kiểm tra trình độ" trên Hero Section.
  - *When*: Hoàn thành 25 câu hỏi đánh giá 4 kỹ năng kèm đánh dấu mức độ tự tin.
  - *Then*: Hệ thống tính điểm và hiển thị kết quả CEFR (A2/B1/B2/C1) kèm phân tích điểm mạnh/yếu mà không cần chờ đợi.

---

## 2. Người Dùng: Học Sinh (Student)

### US-S01: Làm Bài Tập Trực Tuyến & Chống Gian Lận (AI-06)
- **Là một** học sinh,
- **Tôi muốn** làm bài tập về nhà trên máy tính hoặc điện thoại với giao diện rõ ràng,
- **Để** củng cố kiến thức đã học trên lớp.
- **Tiêu chí nghiệm thu**:
  - *Given*: Học sinh đang làm bài thi tại `/assignments/[id]/take`.
  - *When*: Học sinh chuyển tab sang ứng dụng khác quá 3 lần.
  - *Then*: Hệ thống ghi nhận cảnh báo vi phạm tính liêm chính học thuật và tự động nộp bài khi hết giờ.

### US-S02: Nhận Giải Thích Đáp Án Chi Tiết Từ AI
- **Là một** học sinh vừa làm sai một câu hỏi trắc nghiệm,
- **Tôi muốn** bấm nút "AI Giải thích câu này",
- **Để** hiểu rõ quy tắc ngữ pháp hoặc từ vựng tại sao đáp án của mình chưa đúng.
- **Tiêu chí nghiệm thu**:
  - *Given*: Học sinh đang ở trang xem kết quả bài thi `/assignments/[id]/results`.
  - *When*: Bấm "Hỏi AI về câu này".
  - *Then*: Trợ lý AI phân tích ngữ cảnh, chỉ ra bẫy ngữ pháp và đưa ra 1 ví dụ tương tự để ghi nhớ.

### US-S03: Luyện Nói Phản Xạ Cùng AI Speaking Coach
- **Là một** học sinh muốn cải thiện phát âm và độ lưu loát,
- **Tôi muốn** thu âm câu trả lời theo chủ đề luyện nói qua microphone,
- **Để** nhận được nhận xét phát âm chuẩn IPA và cách diễn đạt tự nhiên hơn.
- **Tiêu chí nghiệm thu**:
  - *Given*: Học sinh mở phòng luyện nói tại `/student/tutor`.
  - *When*: Bấm giữ nút Micro và nói câu trả lời trong 30 giây.
  - *Then*: Hệ thống chuyển giọng nói thành văn bản, AI chấm điểm độ lưu loát, từ vựng và gợi ý câu nói tự nhiên của người bản xứ.

---

## 3. Người Dùng: Phụ Huynh (Guardian)

### US-P01: Theo Dõi Báo Cáo Ngày & Tháng Của Con
- **Là một** phụ huynh bận rộn,
- **Tôi muốn** nhận báo cáo kết quả buổi học của con lúc 20:00 và báo cáo tổng kết tháng,
- **Để** đồng hành cùng sự tiến bộ của con mà không cần chờ đến họp phụ huynh.
- **Tiêu chí nghiệm thu**:
  - *Given*: Con tham gia buổi học hôm nay và được giáo viên điểm danh, nhận xét.
  - *When*: Đến 20:00 cùng ngày.
  - *Then*: Phụ huynh nhận thông báo tóm tắt trên ứng dụng: Trạng thái điểm danh (Có mặt), điểm bài tập về nhà và lời khen/nhắc nhở của thầy cô.

### US-P02: Thanh Toán Học Phí Một Chạm Bằng VietQR
- **Là một** phụ huynh cần đóng học phí,
- **Tôi muốn** quét mã VietQR tự động điền số tiền và nội dung chuyển khoản,
- **Để** thanh toán nhanh chóng và nhận biên lai tức thời.
- **Tiêu chí nghiệm thu**:
  - *Given*: Phụ huynh mở mục Học phí tại `/parent/tuition`.
  - *When*: Bấm "Thanh toán" một kỳ học phí.
  - *Then*: Hệ thống sinh mã VietQR chuẩn NAPAS 24/7; khi chuyển tiền thành công, trạng thái hóa đơn đổi sang `PAID` và xuất biên lai điện tử.

---

## 4. Người Dùng: Giáo Viên (Teacher)

### US-T01: Điểm Danh Buổi Học Bằng GPS & QR Động
- **Là một** giáo viên đứng lớp,
- **Tôi muốn** mở buổi học bằng cách quét QR tại phòng, chụp ảnh lớp và bật định vị GPS trong bán kính cơ sở (150m),
- **Để** hệ thống tự động ghi nhận buổi dạy, tính thù lao giảng dạy và cho học sinh quét QR điểm danh.
- **Tiêu chí nghiệm thu**:
  - *Given*: Giáo viên có mặt tại cơ sở đúng giờ dạy.
  - *When*: Bấm "Mở buổi học", hệ thống xác thực GPS < 150m và giáo viên chụp 1 bức ảnh lớp học.
  - *Then*: Buổi học chuyển sang trạng thái `in_progress`, hiển thị mã QR động 30s xoay một lần trên màn hình TV lớp học.

### US-T02: Chấm Bài Tự Luận Có AI Hỗ Trợ (AI-07)
- **Là một** giáo viên cần chấm 20 bài luận tiếng Anh của lớp,
- **Tôi muốn** AI gợi ý trước điểm số theo 4 tiêu chí IELTS và gạch chân lỗi ngữ pháp,
- **Để** tôi tiết kiệm thời gian chấm bài nhưng vẫn duy trì tính chính xác và sâu sắc trong nhận xét.
- **Tiêu chí nghiệm thu**:
  - *Given*: Học sinh nộp bài viết tự luận.
  - *When*: Giáo viên mở giao diện chấm bài tại `/teacher/grading/ai-assist`.
  - *Then*: AI hiển thị dự thảo điểm số (Task Response, Coherence, Lexical, Grammar); giáo viên có quyền giữ nguyên hoặc điều chỉnh trước khi bấm "Phê duyệt & Công bố".

---

## 5. Người Dùng: Quản Trị Viên & Ban Giám Đốc (Admin)

### US-A01: Cảnh Báo Sớm Nguy Cơ Thôi Học (AI-14)
- **Là một** Giám đốc trung tâm hoặc Trưởng phòng Đào tạo,
- **Tôi muốn** hệ thống AI tự động phát hiện những học sinh có nguy cơ thôi học (nghỉ học liên tiếp, sụt giảm điểm số, trễ hạn học phí),
- **Để** chỉ đạo bộ phận tư vấn và giáo viên chủ nhiệm chăm sóc kịp thời trước khi học viên rời bỏ trung tâm.
- **Tiêu chí nghiệm thu**:
  - *Given*: Dữ liệu học tập và tài chính của học sinh trong 30 ngày qua.
  - *When*: Tác vụ AI Assistant chạy phân tích định kỳ.
  - *Then*: Màn hình `/admin/early-warning` hiển thị danh sách học viên theo mức độ rủi ro (Cao, Trung bình, Thấp) kèm nguyên nhân cụ thể và hành động đề xuất.
