# LỘ TRÌNH THỰC THI 10 GIAI ĐOẠN — CORELINK ACADEMY (IMPLEMENTATION ROADMAP)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Tech Lead & Project Manager  

---

## 1. TỔNG QUAN 10 GIAI ĐOẠN THỰC THI (PHASE 0 ĐẾN PHASE 9)

```
[Phase 0: Safety & Baseline]            ──► [HOÀN THÀNH - Đã kiểm tra môi trường & baseline test]
[Phase 1: Audit & Specification]        ──► [HOÀN THÀNH - Bộ 17 tài liệu đặc tả docs/spec/ hoàn tất]
[Phase 2: Foundation & Educational UI]  ──► [HOÀN THÀNH - Thiết lập Design tokens & CSS theme sáng]
[Phase 3: Public Portal & Lead Pipeline]──► [HOÀN THÀNH - Landing S01, Mini test 3 phút, CRM Leads]
[Phase 4: Academic & Scheduling Core]   ──► [HOÀN THÀNH - Xếp lớp, chống xung đột lịch, ghi danh]
[Phase 5: Role Portals & Learning Flow] ──► [HOÀN THÀNH - Cổng Học viên, Phụ huynh, Giảng viên]
[Phase 6: Finance & Daily Reporting]    ──► [HOÀN THÀNH - Học phí, biên nhận, báo cáo ngày 20:00]
[Phase 7: Reports & AI Learning Hub]    ──► [HOÀN THÀNH - AI Speaking Coach, Flashcard từ vựng]
[Phase 8: Hardening & Multi-Layer QA]   ──► [HOÀN THÀNH - Typecheck, Unit, E2E 154 TCs, Build]
[Phase 9: Delivery & Operations]        ──► [HOÀN THÀNH - Cập nhật README, tài liệu vận hành]
```

---

## 2. KẾ HOẠCH CHI TIẾT & TIẾN ĐỘ TỪNG GIAI ĐOẠN

### Phase 0: An toàn & Điểm chuẩn (Safety & Baseline)
- Kiểm tra trạng thái Git, lockfile, kết nối cơ sở dữ liệu MySQL 8.4 LTS tại `localhost:3306`.
- Đảm bảo quy tắc bảo toàn dữ liệu: Tuyệt đối không xóa database, không chạy reset migration, không sửa `db/000_schema.sql`.

### Phase 1: Kiểm toán & Lập hồ sơ Đặc tả (Audit & Specification)
- Rà soát toàn bộ 84 bảng CSDL, 15 module backend, 55 routes frontend.
- Soạn thảo và hoàn thiện 17 tài liệu kỹ thuật chuẩn mực trong `docs/spec/`.

### Phase 2: Nền tảng & Hệ thống Thiết kế Thương hiệu Giáo dục (Foundation)
- Chuyển đổi toàn diện sang **Educational Brand Identity**: Nền canvas `#F7F9FC`, thẻ trắng `#FFFFFF`, viền `#E2E8F0`, màu chủ đạo xanh dương `#2563EB`, xanh ngọc `#0F9D8A`, vàng ấm `#F4B942`.
- Sửa lỗi thứ tự `@import` Google Fonts loại bỏ 100% cảnh báo CSS.

### Phase 3: Website Công khai & Phễu Tuyển sinh (Public & CRM)
- Nâng cấp Trang chủ Landing Page S01 theo chuẩn quốc tế (Hero section, bài đánh giá năng lực 3 phút, danh mục khóa học, đội ngũ giảng viên).
- Kết nối biểu mẫu đăng ký học thử trực tiếp vào API `/api/v1/public/leads` với client validation và chống spam.

### Phase 4: Quản lý Đào tạo Cốt lõi (Academic Core)
- Vận hành cấu trúc chương trình, lớp học, thuật toán phát hiện xung đột lịch 3 chiều (phòng, giáo viên, học sinh).
- Ghi danh học viên có khóa dòng bi quan kiểm soát sĩ số tối đa `max_capacity`.

### Phase 5: Cổng Tác vụ theo Vai trò (Role Portals)
- Cổng Giảng viên: Mở lớp học qua QR + GPS 150m, điểm danh, giao bài và chấm bài thi tự luận.
- Cổng Học viên: Lịch học, bài tập online, radar năng lực 4 kỹ năng CEFR, AI Speaking Coach.
- Cổng Phụ huynh: Điểm danh thời gian thực, bảng điểm con, bản tóm tắt học tập lúc 20:00 hằng ngày.

### Phase 6: Tài chính & Báo cáo Học phí (Finance)
- Lập hóa đơn học phí, cấp biên nhận tuần tự chống trùng lặp qua khóa dòng `receipt_counters`.
- Tính lương giáo viên tự động chỉ dựa trên các buổi học đã được xác thực chuyên cần thành công.

### Phase 7: Báo cáo Quản trị & Trung tâm Luyện tập AI (Reports & AI Hub)
- Dashboard tổng quan doanh thu, tỷ lệ lấp đầy lớp và chi phí sử dụng AI ($150 limit).
- AI Speaking Coach ghi âm trực tiếp trên trình duyệt và Flashcard Spaced Repetition.

### Phase 8: Kiểm thử Đa tầng & Đóng gói (Hardening & QA)
- Thực thi toàn bộ bộ lệnh `typecheck`, `test`, `test:e2e` và `build` đảm bảo 100% thành công không có lỗi.

### Phase 9: Bàn giao & Vận hành (Delivery & Operations)
- Cập nhật `README.md`, `IMPLEMENTATION_PROGRESS.md` và tài liệu hướng dẫn vận hành chi tiết.
