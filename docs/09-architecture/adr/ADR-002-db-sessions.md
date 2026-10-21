# ADR-002: Phiên đăng nhập lưu trong database

- **Status:** Accepted · **Date:** 2026-10-21 · **Decision owner:** chủ dự án (DECISION-D09) · **Reviewers:** trợ lý (Security)
- **Related requirements:** FR-010, FR-011, FR-012, FR-013 · BR-051 · T-03

## Context and problem
Cần xác thực 5 vai trò cho một app Next.js một tiến trình. Yêu cầu: khóa tài khoản/đổi vai trò/đặt lại mật khẩu phải có hiệu lực **ngay** (thu hồi phiên), không thêm hạ tầng (Redis) và ít thư viện.

## Decision drivers / constraints
Thu hồi tức thời · một developer · không Redis · cookie an toàn · dễ kiểm thử.

## Options considered
| Option | Ưu | Nhược | Chi phí/rủi ro |
|---|---|---|---|
| A. JWT ký (stateless) | Không truy vấn DB mỗi request | Không thu hồi được trước hạn (cần blacklist → lại cần store) | Lộ token = dùng tới hết hạn |
| B. NextAuth/Auth.js | Nhiều provider | Phụ thuộc lớn, cấu hình credentials không khuyến khích, khó tùy biến khóa tạm | Phụ thuộc/upgrade |
| **C. Bảng `sessions` + cookie token ngẫu nhiên** | Thu hồi ngay; đơn giản; ít phụ thuộc | Một truy vấn DB/request (đã `cache()` trong request) | Thấp |

## Decision
Chọn **C**. Token 32 byte (`randomBytes`, base64url) trong cookie `cl_session` (httpOnly, SameSite=Lax, Secure khi production, path `/`, 7 ngày). DB lưu `sha256(token)` làm khóa chính → lộ DB không lộ cookie dùng được. `getCurrentActor` bỏ qua phiên hết hạn hoặc user không ACTIVE.

## Consequences and trade-offs
- (+) Khóa/đổi vai trò/đặt lại mật khẩu → `deleteMany` phiên → đăng xuất ngay.
- (+) Đổi mật khẩu giữ phiên hiện tại, thu hồi phiên khác.
- (−) Phiên hết hạn không tự dọn khỏi DB → cần job dọn định kỳ (Pha 2, RISK-010; dung lượng nhỏ).
- (−) Không có "đăng nhập trên thiết bị khác" (danh sách phiên) — chưa cần.

## Security / privacy / performance / operations / cost impact
Một truy vấn `findUnique` theo PK mỗi request (rẻ). Không có secret ký JWT để xoay vòng.

## Migration, rollout and rollback
Có trong migration `init`. Rollback = xóa bảng `sessions` (mọi người đăng xuất).

## Review trigger
Khi có app di động/REST cần token (P2-20) → ADR mới cho token API.
