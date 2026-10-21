# 13 — Chiến lược kiểm thử và test case

## 1. Cấp độ

| Cấp | Công cụ | Phạm vi |
|---|---|---|
| Unit | Vitest | Logic thuần trong `src/lib/**` và các hàm thuần của `src/server/**` (policy, state machine, chấm điểm, sinh lịch, trùng lịch, SĐT, khung điểm danh) |
| Integration | Vitest + MySQL thật (DB `corelink_test`) | Service có transaction: ghi danh, chuyển lead, nộp bài — **Pha 1.5**, chưa làm |
| E2E | Playwright desktop + 360px | Luồng chính — **Pha 1.5**, chưa làm |
| Tĩnh | `tsc --noEmit`, ESLint, `next build` | Toàn bộ |

Tên test chứa mã TC, ví dụ `it('TC-013 sinh đủ số buổi theo thứ')`.

**Trạng thái 2026-10-21:** 13 file, 70 unit test pass. Đã có test cho mọi TC cấp Unit (TC-001, 002, 004–006, 010, 011, 013, 014, 016–038). TC-003, 007, 008, 015 (Integration) và TC-009, 012 (Manual/E2E) chưa chạy — DB `corelink` chưa được migrate và tài khoản MySQL không có quyền tạo `corelink_test`.

## 2. Test case

| TC | Mô tả | FR/BR | Cấp |
|---|---|---|---|
| TC-001 | Chuẩn hóa SĐT `0912 345 678` → `+84912345678`; số sai bị từ chối | BR-001 | Unit |
| TC-002 | Form học thử thiếu đồng ý → lỗi | FR-004 | Unit (schema) |
| TC-003 | Trùng SĐT lead đang mở → thêm hoạt động, không tạo mới | FR-004 | Integration |
| TC-004 | Rate limit: lần thứ 6 trong 10 phút bị chặn | BR-002 | Unit (hàm quyết định) |
| TC-005 | Chuyển trạng thái lead hợp lệ/không hợp lệ theo BR-010 | FR-007 | Unit |
| TC-006 | LOST không có lý do → từ chối | FR-007 | Unit |
| TC-007 | Chuyển lead tạo HS + PH + liên kết + lead ENROLLED | FR-009 | Integration |
| TC-008 | Chuyển lead khi lớp đầy → không lưu gì | FR-009 | Integration |
| TC-009 | Đăng nhập đúng → phiên; sai → lỗi chung | FR-010 | Manual/E2E |
| TC-010 | Sai 5 lần → khóa 15 phút | BR-005 | Unit |
| TC-011 | Mật khẩu yếu bị từ chối | BR-006 | Unit |
| TC-012 | `mustChangePassword` chuyển về trang đổi mật khẩu | FR-012 | Manual/E2E |
| TC-013 | Sinh đủ số buổi theo thứ, đúng giờ VN → UTC | BR-023 | Unit |
| TC-014 | Phát hiện trùng khoảng thời gian, bỏ qua buổi hủy | BR-021 | Unit |
| TC-015 | Mở lớp trùng giáo viên → danh sách xung đột | FR-018 | Integration |
| TC-016 | Ghi danh khi đủ sĩ số → CLASS_FULL | BR-020 | Unit (hàm quyết định) |
| TC-017 | Ghi danh lớp COMPLETED → CLASS_CLOSED | BR-022 | Unit |
| TC-018 | Chuyển trạng thái ghi danh hợp lệ/không | FR-020 | Unit |
| TC-019 | Khung điểm danh giáo viên đúng biên | BR-030 | Unit |
| TC-020 | Staff ngoài khung thiếu lý do → từ chối | BR-031 | Unit |
| TC-021 | Tỷ lệ chuyên cần | BR-032 | Unit |
| TC-022 | Cảnh báo 2 buổi vắng liên tiếp | BR-033 | Unit |
| TC-023 | Xuất bản bài không có câu → NO_QUESTIONS | FR-028 | Unit |
| TC-024 | Chuyển trạng thái bài tập | FR-028 | Unit |
| TC-025 | Validate câu MCQ (2–6 lựa chọn, đáp án trong phạm vi) | FR-027 | Unit |
| TC-026 | Chấm MCQ đúng/sai | BR-040 | Unit |
| TC-027 | Chấm trả lời ngắn không phân biệt hoa thường/khoảng trắng | BR-041 | Unit |
| TC-028 | Nộp quá hạn: chặn hoặc đánh dấu muộn | BR-044 | Unit |
| TC-029 | Bài chỉ có câu khách quan → GRADED ngay | FR-030 | Unit |
| TC-030 | Điểm tự luận ngoài [0, max] hoặc lệch bước 0.25 → lỗi | BR-042 | Unit |
| TC-031 | Tổng điểm ưu tiên điểm giáo viên | BR-043 | Unit |
| TC-032 | Câu hỏi gửi cho học sinh không chứa đáp án trước công bố | FR-032 | Unit |
| TC-033 | Kết quả chỉ hiển thị sau công bố | BR-046 | Unit |
| TC-034 | Policy: phụ huynh chỉ xem con đã liên kết | NFR-001 | Unit |
| TC-035 | Policy: giáo viên chỉ truy cập lớp của mình | NFR-001 | Unit |
| TC-036 | Policy: STAFF không đổi được vai trò/xem audit | NFR-001 | Unit |
| TC-037 | Liên kết phụ huynh thứ 5 → MAX_GUARDIANS | BR-008 | Unit |
| TC-038 | Admin không tự khóa | FR-013 | Unit |

## 3. Dữ liệu test
Seed giả (`prisma/seed.ts`); không dùng dữ liệu thật.

## 4. Tiêu chí kết thúc Pha 1
Typecheck, lint, unit test, build đều xanh; kiểm tra thủ công các luồng UC-001..UC-012 bằng tài khoản seed; ghi kết quả thực tế vào `docs/progress/PROGRESS.md`. Test Integration/E2E là khoảng trống đã biết cho tới Pha 1.5.
