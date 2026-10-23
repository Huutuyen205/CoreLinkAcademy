# 22 — Khảo sát sản phẩm tương tự và các tính năng bổ sung

| Mục | Giá trị |
|---|---|
| Ngày | 2026-10-22 |
| Người soạn | Trợ lý AI (BA/UX) theo yêu cầu PO: "xem các trang tương tự, còn thiếu gì, note lại và code theo" |
| Quyết định | DECISION-D32 (docs/17) |
| Lưu ý độ tin cậy | Nguồn chủ yếu là trang giới thiệu của nhà cung cấp, App Store và trang tổng hợp đánh giá (Capterra, GetApp, G2). Tính năng ghi theo mô tả công khai, chưa dùng thử thật. |

## 1. Sản phẩm đã xem

| Sản phẩm | Loại | Điểm đáng chú ý (theo mô tả công khai) | Nguồn |
|---|---|---|---|
| Easy Edu (VN) | Quản lý trung tâm ngoại ngữ/giáo dục + app phụ huynh | Phụ huynh xem lịch học, lịch kiểm tra, **đánh giá của giáo viên**, tin tức/sự kiện; trung tâm nhận phản hồi từ học viên | [App Store](https://apps.apple.com/vn/app/easy-edu-v2/id6504491690) |
| MONA eLMS (VN) | Quản lý trung tâm ngoại ngữ | Tuyển sinh, học phí, tạo lịch học | [vietnamteachingjobs.com](https://vietnamteachingjobs.com/3-phan-mem-cskh-mien-phi-cho-trung-tam-ngoai-ngu/) |
| MISA AMIS CRM giáo dục (VN), Zoho CRM Education | CRM tuyển sinh | Chăm sóc học viên tiềm năng theo **giai đoạn (pipeline)**, tự động giao việc cho tư vấn viên | [MISA](https://amis.misa.vn/232653/crm-cho-giao-duc/), [Zoho](https://www.zoho.com/vi/crm/verticals/education/), [FitGap](https://us.fitgap.com/search/crm-software/education) |
| Teachworks, TutorBird | Quản lý trung tâm dạy kèm | Cổng PH/HS, **nhắc lịch tự động**, lịch lặp, hóa đơn tự động, **đồng bộ lịch**, nhiều cơ sở | [GetApp](https://www.getapp.ca/compare/113193/131859/teachworks/vs/tutorbird), [Capterra](https://www.capterra.co.uk/software/181623/tutorbird) |
| Wise (wise.live) | Nền tảng dạy kèm/trung tâm | Lịch 2 chiều, điểm danh, **nhắc buổi học**, **phản hồi sau buổi học**, báo cáo cho phụ huynh, thu học phí | [Capterra](https://www.capterra.in/software/1033151/wise), [Software Advice](https://www.softwareadvice.com/product/361546-Wise) |
| ClassDojo | Lớp học – phụ huynh | **Điểm hành vi**, báo cáo tiến độ nhìn nhanh, ảnh/video/thông báo, nhắn tin GV–PH | [Tech & Learning](https://www.techlearning.com/resources/app-offers-great-way-to-keep-parents-informed), [Educators Technology](https://www.educatorstechnology.com/2022/02/classdojo-full-review-for-teachers-and.html) |
| Kinderpedia | Quản lý trường/trung tâm | Điểm danh, tiến độ, thông báo, hóa đơn – thanh toán học phí trực tuyến | [G2](https://www.g2.com/products/kinderpedia/discuss) |

## 2. Đối chiếu với CoreLink (sau v3.4)

| Nhóm | Tính năng phổ biến | CoreLink | Quyết định |
|---|---|---|---|
| Tuyển sinh | Lead theo giai đoạn dạng **bảng Kanban** kéo thả | Chỉ có danh sách | **Làm ngay** (FEAT-B1) |
| Tuyển sinh | Giao lead cho tư vấn viên, hẹn gọi lại | Chưa | Pha 2 (P2-15) |
| Học tập | **Nhật ký buổi học**: GV ghi nội dung đã học + bài về nhà, PH/HS xem ngay | Chưa | **Làm ngay** (FEAT-B2) |
| Học tập | **Báo cáo tiến độ dạng biểu đồ** (xu hướng điểm, chuyên cần theo tháng) | Chỉ có danh sách | **Làm ngay** (FEAT-B3) |
| Lịch | **Nhắc lịch học tự động** trước buổi học | Chưa (chỉ báo khi đổi lịch) | **Làm ngay** (FEAT-B4) — cron hằng ngày |
| Lịch | **Đồng bộ / xuất lịch** sang Google Calendar, iPhone | Chưa (P2-12) | **Làm ngay** (FEAT-B5) — tải tệp `.ics` |
| Giao diện | **Tìm nhanh toàn hệ thống** (Ctrl+K) | Chưa | **Làm ngay** (FEAT-B6) |
| Giao diện | **Thông báo nổi (toast)** sau mỗi thao tác | Chỉ có chữ trong form | **Làm ngay** (FEAT-B7) |
| Học tập | Điểm hành vi/thái độ theo buổi (ClassDojo) | Chưa (P2-33) | Pha 2 — chờ tiêu chí của trung tâm |
| Tài chính | Học phí, hóa đơn, nhắc nợ, thanh toán online | Chưa (P2-01) | Pha 2 — DECISION-D05, cần discovery tài chính |
| Phản hồi | Phụ huynh đánh giá/góp ý trung tâm | Có thể nhắn tin trung tâm | Pha 2 (P2-45) — form khảo sát hài lòng |
| Lịch | Phụ huynh tự đặt lịch học thử/học bù | Chưa | Pha 2 (P2-46) |
| Vận hành | Nhiều cơ sở | Chưa (P2-19) | Pha 2 |
| Kênh | Ứng dụng di động | Đã có PWA (D31) | — |

## 3. Logic các tính năng làm ngay

- **FEAT-B1 Bảng Kanban lead** (`/quan-ly/lead?xem=bang`): 6 cột theo trạng thái, mỗi cột 30 lead mới nhất + tổng số. Kéo thẻ sang cột khác = đổi trạng thái qua đúng `changeLeadStatus` (BR-010, chặn chuyển sai, LOST bắt buộc lý do — hỏi bằng hộp nhập). Cột "Đã nhập học" không nhận thả: chuyển sang trang lead để làm "Chuyển thành học viên" (một giao dịch, FR-009). Điện thoại không kéo thả được → mỗi thẻ có ô "Chuyển sang…".
- **FEAT-B2 Nhật ký buổi học**: GV phụ trách hoặc GV dạy thay buổi đó ghi "Nội dung đã học" và "Bài tập về nhà" (≤ 5000 ký tự mỗi ô). Lưu lần đầu → thông báo HS đang học + PH của lớp (có thông báo đẩy); sửa sau đó không gửi lại. HS/PH thấy trên trang chi tiết buổi học; PH thấy cả ở tổng quan.
- **FEAT-B3 Biểu đồ tiến độ**: điểm % từng bài đã công bố theo thời gian (đường + điểm), tỷ lệ chuyên cần 6 tháng gần nhất (cột). Hàm thuần `buildProgress` (có test), vẽ SVG không thêm thư viện. Hiện ở Kết quả của HS, cổng PH, hồ sơ HS (quản lý/GV).
- **FEAT-B4 Nhắc lịch học**: Vercel Cron 1 lần/ngày lúc 19:00 giờ VN gọi `/api/cron/nhac-lich` (bảo vệ bằng `CRON_SECRET`), gửi thông báo + đẩy cho GV, HS, PH về các buổi **ngày mai** chưa hủy. Mỗi người một thông báo gộp mọi buổi. Không gửi lại nếu đã gửi cho ngày đó (khóa theo `kind = "reminder_day:<YYYY-MM-DD>"`).
- **FEAT-B5 Xuất lịch `.ics`**: nút "Thêm vào lịch điện thoại" ở trang lịch — tải tệp iCalendar các buổi 60 ngày tới trong phạm vi của người dùng (đúng `listSessionsInRange`, cùng quyền như trang lịch).
- **FEAT-B6 Tìm nhanh (Ctrl+K / nút kính lúp)**: quản lý tìm học sinh, phụ huynh, giáo viên, lớp, lead; giáo viên tìm lớp và học sinh lớp mình. Server Action kiểm tra vai trò + phạm vi, tối đa 5 kết quả mỗi nhóm; tìm không phân biệt hoa thường (`contains`), phải gõ đúng dấu vì Postgres chưa bật `unaccent` (P2-28).
- **FEAT-B7 Toast**: thông báo nổi góc dưới cho thao tác một chạm (khóa, xóa, hủy, kéo thả lead…), tự ẩn sau 4 giây, có `aria-live`.

## 4. Điểm giao diện đáng học

- Thẻ Kanban có màu theo giai đoạn, số lượng ở đầu cột, cảnh báo "quá 24 giờ" (đã có rule BR-003).
- Báo cáo cho phụ huynh ưu tiên **nhìn nhanh** (con số lớn + biểu đồ nhỏ) trước danh sách chi tiết.
- Mọi thao tác có phản hồi tức thì (toast) thay vì phải tìm dòng chữ trong form.
- Tìm kiếm toàn cục mở bằng phím tắt — quen thuộc với người dùng văn phòng.
