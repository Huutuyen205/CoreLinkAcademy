# 17 — Câu hỏi mở, giả định và quyết định

## Quyết định (đã chốt với chủ dự án ngày 2026-10-21)

| ID | Quyết định | Lý do / đánh đổi |
|---|---|---|
| DECISION-D01 | Làm lại toàn bộ kể cả DB trên nhánh `rebuild/v3`; `main` giữ bản cũ | Bản cũ tài liệu và code không khớp nhau, phạm vi quá lớn |
| DECISION-D02 | Sản phẩm: học viện đa môn (Toán, Văn, Anh, Lý, Hóa, Tin) | Theo chủ dự án |
| DECISION-D03 | Stack: Next.js 15 fullstack + Prisma 6 + MySQL 8 | ADR-001 |
| DECISION-D04 | Mỗi tài khoản một vai trò | Đơn giản hóa phân quyền; người vừa là GV vừa là PH dùng 2 tài khoản (đánh đổi nhỏ) |
| DECISION-D05 | MVP = công khai/tuyển sinh + đào tạo/điểm danh + bài tập/chấm | Theo chủ dự án; học phí và AI để Pha 2 |
| DECISION-D06 | Xóa và dùng lại database `corelink` (có backup trước) | Theo chủ dự án |
| DECISION-D07 | Giao diện sáng, học thuật, tối giản; navy `#1F3A5F` | Theo chủ dự án; xem 08 |
| DECISION-D08 | Chỉ tiếng Việt, không dùng thư viện i18n ở Pha 1 | Không có nhu cầu đa ngôn ngữ; giảm độ phức tạp |
| DECISION-D09 | Phiên lưu trong DB (cookie token), không dùng JWT/NextAuth | Thu hồi phiên được ngay, ít phụ thuộc |
| DECISION-D10 | Điểm số lưu kiểu `Float`, làm tròn 2 chữ số ở tầng logic | Tránh chuyển đổi Decimal qua Server/Client Components; thang điểm nhỏ nên sai số không đáng kể |
| DECISION-D11 | Trang lỗi phạm vi trả 404 thay vì 403 | Không tiết lộ bản ghi tồn tại |
| DECISION-D12 | Học sinh đăng nhập bằng email hoặc SĐT riêng (FR-010); form chuyển lead có ô email/SĐT học sinh tùy chọn. Không có thì tài khoản HS vẫn được tạo nhưng chưa đăng nhập được cho đến khi Admin bổ sung | Giữ đúng FR-010; đăng nhập bằng mã HS là ý tưởng Pha 2 (QUESTION-Q07) |
| DECISION-D13 | Server Action trả lại giá trị đã nhập (`ActionState.values`) khi lỗi | React 19 tự reset form sau action; không trả mật khẩu |
| DECISION-D14 | Sai vai trò trong khu nội bộ → chuyển về tổng quan của vai trò mình; sai phạm vi bản ghi → 404 | Theo docs/03 §3 |

## Giả định

| ID | Giả định | Cách xác minh |
|---|---|---|
| ASSUMPTION-A01 | Một cơ sở duy nhất | Hỏi chủ dự án trước Pha 2 |
| ASSUMPTION-A02 | Học sinh từ lớp 1 đến lớp 12 | Như trên |
| ASSUMPTION-A03 | Học phí trên web chỉ là "tham khảo", không thanh toán online | Như trên |
| ASSUMPTION-A04 | Staff được tạo tài khoản học sinh/phụ huynh, chỉ Admin tạo tài khoản nhân sự | Như trên |

## Câu hỏi mở

| ID | Câu hỏi | Tác động | Cần trước |
|---|---|---|---|
| QUESTION-Q01 | Logo, tên miền chính thức? | Header, metadata | Production |
| QUESTION-Q02 | Địa chỉ, hotline, giờ làm việc thật cho footer? | Nội dung công khai (đang để placeholder rõ ràng) | Production |
| QUESTION-Q03 | Giữ lead LOST bao lâu? | Chính sách riêng tư | Production |
| QUESTION-Q04 | Hosting (VPS, Vercel + MySQL cloud…)? | Triển khai | Production |
| QUESTION-Q05 | Có cần CSP chặt, giám sát lỗi? | Bảo mật/vận hành | Production |
| QUESTION-Q06 | Thứ tự ưu tiên Pha 2 (học phí, thông báo, AI, QR)? | Kế hoạch | Sau Pha 1 |
| QUESTION-Q07 | Học sinh nhỏ tuổi không có email/SĐT: có cần đăng nhập bằng mã học sinh không? | FR-010, trải nghiệm HS tiểu học | Trước khi có HS thật |
| QUESTION-Q08 | Cấp quyền tạo database `corelink_test` cho tài khoản MySQL dev? | Integration test Pha 1.5 | Pha 1.5 |
