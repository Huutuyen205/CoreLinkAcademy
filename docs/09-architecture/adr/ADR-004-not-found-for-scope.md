# ADR-004: Sai phạm vi dữ liệu trả 404; sai vai trò chuyển về tổng quan

- **Status:** Accepted · **Date:** 2026-10-21 · **Decision owner:** chủ dự án (DECISION-D11, D14) · **Reviewers:** trợ lý (Security, UX)
- **Related requirements:** NFR-001 · T-04 · docs/03 §6

## Context and problem
Khi GV mở lớp của GV khác, PH mở `?con=` của người khác, HS mở bài lớp khác: trả gì?

## Options considered
| Option | Ưu | Nhược |
|---|---|---|
| A. 403 "Không có quyền" | Rõ ràng | Xác nhận bản ghi tồn tại (rò rỉ thông tin, hỗ trợ dò id) |
| **B. 404 cho sai phạm vi + chuyển hướng cho sai vai trò** | Không rò rỉ; người dùng lạc khu vực được đưa về đúng nơi | Người dùng có quyền nhầm URL không biết lý do |

## Decision
Chọn **B**: `ForbiddenError` (sai phạm vi hoặc không tồn tại) → `notFound()` trong page (`orNotFound`) và action (`runAction`). Sai vai trò khi vào khu nội bộ → `redirect(HOME_BY_ROLE[role])`. Trang 404 nói "Trang không tồn tại hoặc bạn không có quyền xem nội dung này." và có liên kết về tổng quan khi đã đăng nhập (GAP-07).

## Consequences
- (+) Không phân biệt "không tồn tại" và "không được xem".
- (−) Debug khó hơn — chấp nhận; audit không ghi truy cập bị từ chối (Pha 2 nếu cần, QUESTION-Q05).

## Review trigger
Khi có API cho client khác: REST trả 404 tương tự cho tài nguyên ngoài phạm vi.
