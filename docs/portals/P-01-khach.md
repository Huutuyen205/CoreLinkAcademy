# P-01 — Cổng công khai (Khách / phụ huynh tiềm năng)

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Phụ huynh 30–50 tuổi, chủ yếu điện thoại; không đăng nhập |
| Mục tiêu cổng | Tìm khóa phù hợp → đăng ký học thử ≤ 2 phút (GOAL-001) |
| FR | FR-001..FR-005, FR-010 (vào cổng đăng nhập) · UC-013, UC-001, UC-004 |

## 1. Điều hướng
Header (mọi trang): logo chữ "CoreLink **Academy**" → `/` · "Khóa học" → `/khoa-hoc` · "Học thử" → `/dang-ky-hoc-thu` · nút "Đăng nhập" → `/dang-nhap`. Footer: tên học viện, "Địa chỉ và số điện thoại liên hệ sẽ được cập nhật." (Q02), liên kết Khóa học, Đăng ký học thử. Skip link "Bỏ qua tới nội dung".

## 2. Màn hình

### SCREEN-001 Trang chủ `/`
| Khối | Nội dung (dữ liệu thật từ DB) | Hành động |
|---|---|---|
| Giới thiệu | Nhãn "Học viện đào tạo phổ thông"; h1 "Học vững từng môn, tiến bộ từng buổi"; mô tả 6 môn, lớp nhỏ | "Đăng ký học thử" (primary), "Xem khóa học" |
| Các môn đang giảng dạy | Môn có ≥ 1 khóa xuất bản: tên, mô tả, "n khóa học" | Bấm tên môn → `/khoa-hoc?mon=` |
| Khóa học nổi bật | ≤ 3 khóa xuất bản + nổi bật (CourseCard) | Bấm thẻ → chi tiết; "Tất cả khóa học" |
| Bắt đầu như thế nào | 3 bước đánh số màu accent | "Đăng ký học thử miễn phí" |

Trạng thái: khối không có dữ liệu bị ẩn. Không có số liệu thống kê trang trí.

### SCREEN-002 Danh mục `/khoa-hoc`
- Form GET: "Môn học" (Tất cả môn + 6 môn), "Khối lớp" (Tất cả khối + Lớp 1..12), "Lọc", "Bỏ lọc" (khi đang lọc). Chạy không cần JavaScript.
- Kết quả: "n khóa học" (`aria-live`), lưới CourseCard (1/2/3 cột).
- Rỗng: "Chưa có khóa học phù hợp với lựa chọn này." / "Học viện đang cập nhật danh mục khóa học." + "Để lại thông tin để được tư vấn".

### SCREEN-003 Chi tiết khóa `/khoa-hoc/[slug]`
- Breadcrumb Khóa học / Môn; h1; mô tả; "Đăng ký học thử khóa này" (`?khoa=slug`).
- Thông tin: Đối tượng ("Lớp 6–9"), Trình độ, Số buổi ("24 buổi × 90 phút"), Học phí tham khảo ("3.600.000 ₫"/"Liên hệ") + "Học phí chỉ để tham khảo…".
- Mục tiêu, Lộ trình (đánh số), Lớp đang tuyển: "Lớp X", lịch, "Khai giảng dd/MM/yyyy", "Còn n chỗ"/"Đã đủ học sinh". Không lộ tên GV/HS.
- 404 khi khóa ẩn/không tồn tại.

### SCREEN-004 Đăng ký học thử `/dang-ky-hoc-thu`
| Ô | Bắt buộc | Kiểu / gợi ý | Ràng buộc |
|---|---|---|---|
| Họ tên phụ huynh | * | text, `autocomplete=name` | 2–120 |
| Số điện thoại | * | tel, "Ví dụ: 0912 345 678" | SĐT di động VN |
| Email | | email | ≤ 191 |
| Họ tên học sinh | * | text | 2–120 |
| Khối lớp | * | select Lớp 1..12 | |
| Môn quan tâm | * | select | Lọc danh sách khóa |
| Khóa học (nếu đã chọn) | | select "Chưa chọn" | Điền sẵn từ `?khoa=` |
| Ghi chú | | textarea "Mục tiêu học tập, thời gian có thể học…" | ≤ 1000 |
| Đồng ý liên hệ | * | checkbox | |

Nút "Gửi đăng ký" (đổi "Đang gửi…"). Honeypot ẩn. Lỗi: Alert chung + lỗi dưới ô, giữ giá trị. Rate limit: "Bạn đã gửi quá nhiều lần…".

### SCREEN-005 Cảm ơn (noindex)
"Cảm ơn quý phụ huynh" + bước tiếp theo; "Xem thêm khóa học", "Về trang chủ".

### SCREEN-006 Đăng nhập (noindex)
Chung mọi vai trò — xem [P-02 §2](P-02-quan-ly.md#2-đăng-nhập-và-đổi-mật-khẩu-chung-mọi-vai-trò).

## 3. Hành trình
1. Phụ huynh tìm khóa Toán lớp 9 → `/khoa-hoc?mon=toan&khoi=9`.
2. Xem "Toán 9 — Ôn thi vào lớp 10": lộ trình, còn chỗ.
3. "Đăng ký học thử khóa này" → form điền sẵn → gửi → cảm ơn.
4. Giáo vụ gọi lại → [P-02](P-02-quan-ly.md) xử lý lead.

## 4. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Gửi lại khi lead cũ còn mở | Không tạo lead mới; RESUBMITTED (khách vẫn thấy cảm ơn) |
| Bot điền honeypot | Cảm ơn giả, không lưu |
| `?khoa=` là khóa ẩn | Không điền sẵn |
| Mạng chậm | Nút disabled khi đang gửi |
| Đã đăng nhập mở `/dang-nhap` | Chuyển về cổng của mình |

## 5. Dữ liệu và quyền
Đọc công khai: subjects, courses (xuất bản), classes OPEN (mã, lịch, khai giảng, sĩ số). Ghi: leads, lead_activities, rate_limit_buckets.

## 6. Kiểm thử
TC-001..TC-004, TC-UAT-01, 02, 15.
