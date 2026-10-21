# 00 — Project Brief: CoreLink Academy (Rebuild v3)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.0.0-baseline |
| Ngày | 2026-10-21 |
| Trạng thái | Baseline đã chốt sau discovery, đang triển khai Pha 1 |
| Nhánh | `rebuild/v3` (bản cũ giữ nguyên trên `main`) |

## 1. Vấn đề

Một học viện đào tạo đa môn (Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học) cho học sinh phổ thông cần:
- một website công khai để phụ huynh tìm khóa học và đăng ký học thử;
- một hệ thống nội bộ để quản lý khách tiềm năng, lớp, lịch, điểm danh, bài tập và điểm số;
- một cổng để học sinh làm bài và phụ huynh theo dõi việc học của con.

Bản trước (v1/v2) ôm quá nhiều phạm vi: 98 FR, 14 tính năng AI, 84 bảng, xây trong một ngày. Kết quả là tài liệu và code không khớp nhau và test không phản ánh đúng chất lượng. Bản v3 làm lại toàn bộ với phạm vi nhỏ hơn, có thể kiểm chứng.

## 2. Người dùng

| Actor | Mô tả |
|---|---|
| Khách (phụ huynh tiềm năng) | Xem khóa học, đăng ký học thử, không đăng nhập |
| Admin | Quản trị toàn hệ thống, danh mục, người dùng |
| Giáo vụ / Tư vấn (Staff) | Xử lý lead, mở lớp, ghi danh, sửa điểm danh sau hạn |
| Giáo viên | Điểm danh, giao bài, chấm, công bố điểm cho lớp mình dạy |
| Học sinh | Xem lịch, làm bài, xem điểm đã công bố |
| Phụ huynh | Theo dõi lịch, chuyên cần, điểm của con đã liên kết |

## 3. Mục tiêu và KPI

- GOAL-001: Phụ huynh đăng ký học thử trong ≤ 2 phút trên điện thoại. KPI-001: tỷ lệ submit/visit form ≥ 5% (đo sau khi có analytics; TBD).
- GOAL-002: Không lead nào bị bỏ quên. KPI-002: 100% lead NEW được xử lý (đổi trạng thái) trong 24 giờ, xem trên dashboard Staff.
- GOAL-003: Giáo viên điểm danh một buổi ≤ 30 giây (mặc định "có mặt").
- GOAL-004: Phụ huynh xem chuyên cần và điểm của con mà không cần hỏi giáo viên.

## 4. Phạm vi MVP (Pha 1)

1. **Web công khai và tuyển sinh**: trang chủ, danh mục khóa học theo môn/khối, chi tiết khóa, form học thử, quản lý lead, chuyển lead thành học viên.
2. **Đào tạo và điểm danh**: môn, khóa, phòng, lớp, sinh buổi học, kiểm tra trùng lịch, ghi danh, lịch tuần, điểm danh, cảnh báo vắng.
3. **Bài tập và chấm điểm**: bài tập trắc nghiệm, trả lời ngắn và tự luận; làm bài online; tự chấm; giáo viên chấm tự luận; công bố điểm; bảng điểm.
4. **Nền tảng**: đăng nhập, phân quyền 5 vai trò, cổng theo vai trò, nhật ký audit.

## 5. Ngoài phạm vi Pha 1 (Pha 2+)

Học phí/hóa đơn, lương giáo viên, chatbot và các tính năng AI, chat/nhắn tin, Web Push/email, upload file, điểm danh QR/GPS, báo cáo tháng, nhiều cơ sở, app di động.

## 6. Ràng buộc

- Stack: Next.js 15 fullstack + Prisma 6 + MySQL 8 (local `localhost:3306`, database `corelink`), xem [ADR-001](09-architecture/adr/ADR-001-stack-selection.md).
- Môi trường: Windows + PowerShell, một developer.
- Giao diện: chỉ tiếng Việt, mobile-first từ 360px, sáng, tối giản, học thuật.
- Không push git tự động (AGENTS.md). Không seed dữ liệu cá nhân thật.

## 7. Giả định và câu hỏi mở

Xem [17-open-questions-and-decisions.md](17-open-questions-and-decisions.md).

## 8. Liên kết

[01 Yêu cầu](01-requirements.md) · [03 Phân quyền](03-actors-roles-permissions.md) · [04 Use case](04-use-cases.md) · [10 Database](10-database-and-erd.md) · [15 Kế hoạch](15-project-plan-and-risk-register.md)
