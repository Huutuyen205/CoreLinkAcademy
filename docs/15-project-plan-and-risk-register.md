# 15 — Kế hoạch dự án, RACI và sổ rủi ro

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — thêm pha 1e (phiên 3), RACI, rủi ro RISK-008..012 |
| Owner | Trợ lý (Project/Delivery) · Approver: chủ dự án |

## 1. Các pha

| Pha | Nội dung | Đầu ra | Cổng (approval gate) | Ước lượng (giả định 1 dev) | Trạng thái (2026-10-21) |
|---|---|---|---|---|---|
| 0 | Discovery + tài liệu baseline | `docs/00..18` | Chủ dự án chốt D01..D14 | — | Xong |
| 1a | Nền tảng: scaffold, Prisma, migration offline, seed, design system, xác thực, layout | Đăng nhập 5 vai trò | typecheck/lint/test/build xanh | — | Code xong; **chờ migrate DB** |
| 1b | Công khai + tuyển sinh (FR-001..009) | Form → lead → học viên | như trên | — | Code xong; chờ DB |
| 1c | Đào tạo + điểm danh (FR-013..026) | Lớp, ghi danh, điểm danh, lịch | như trên | — | Code xong; chờ DB |
| 1d | Bài tập + chấm (FR-027..035) | Làm bài → chấm → công bố | như trên | — | Code xong; chờ DB |
| **1e** | **Tài liệu chi tiết theo từng phía + cổng; đối chiếu code; bổ sung GAP-01..14; integration test** | docs 00–21, `04-use-cases/`, `portals/`, GAP-REPORT, code bổ sung | typecheck/lint/test/build xanh; chủ dự án duyệt GAP-REPORT | 1 phiên | **Phiên này** |
| 1.5 | Chạy trên DB thật: UAT TC-UAT-01..15, integration test trên DB test, Playwright E2E 360px + axe, đo NFR-009, thử restore backup | Bằng chứng kiểm thử | Không còn lỗi mức Cao; chủ dự án ký UAT | 2–4 phiên | Chờ `pnpm db:reset` (chủ dự án) + Q08 |
| 1.9 | Chuẩn bị production: chọn hosting (Q04), CSP (Q05), chính sách dữ liệu (Q03, Q10, Q11), nội dung thật (Q01, Q02) | Release candidate | docs/18 đạt + phê duyệt | TBD | Chưa bắt đầu |
| 2 | Theo ưu tiên của chủ dự án (05 §5) | — | Discovery bổ sung | — | Chưa bắt đầu (Q06) |

Phụ thuộc chính: 1.5 phụ thuộc chủ dự án chạy `pnpm db:reset` và cấp quyền DB test; 1.9 phụ thuộc quyết định hosting.

## 2. RACI (theo ROLE_OWNERSHIP_RACI_TEMPLATE)

R = thực hiện, A = chịu trách nhiệm cuối (một người), C = tham vấn, I = được báo. "AI" = trợ lý AI kiêm vai trò; "PO" = chủ dự án.

| Deliverable / quyết định | R | A | C | I | Approver | Bằng chứng / điều kiện |
|---|---|---|---|---|---|---|
| Mục tiêu, KPI, phạm vi | AI (PM/BA) | PO | — | — | PO | docs/00, 01 baseline |
| Requirements / use cases | AI (BA, Use Case Writer) | PO | AI (QA) | — | PO | docs/01, 02, 04 |
| Phân rã chức năng | AI (Functional Analyst) | PO | AI (Architect) | — | PO | docs/05 |
| Luồng / thiết kế UI | AI (Designer, UX Writer) | PO | AI (FE, Accessibility) | — | PO | docs/07, 08 |
| Kiến trúc / ADR | AI (Architect) | PO | AI (Security, DBA) | — | PO | docs/09 |
| API contract | AI (API Owner) | AI (Tech Lead) | AI (FE, QA) | PO | — | docs/11 |
| Data model / migration | AI (DBA) | AI (Tech Lead) | AI (BE) | PO | PO (khi phá hủy) | docs/10, `prisma/` |
| Implementation | AI (FE, BE) | AI (Tech Lead) | — | PO | — | Code + lệnh xanh |
| Test strategy / quality report | AI (QA) | AI (QA Lead) | AI (BA) | PO | PO (UAT) | docs/13, PROGRESS |
| Security / privacy review | AI (Security) | PO (risk owner) | — | — | PO | docs/12 |
| Chạy lệnh phá hủy DB (`db:reset`) | PO | PO | AI | — | PO | PROGRESS ghi kết quả |
| Commit / push | PO | PO | — | — | PO | Trợ lý không commit/push |
| Release readiness / rollback | AI (Release) | PO | AI (QA, DevOps) | — | PO | docs/18 |
| Vận hành / sự cố | PO | PO | AI | — | PO | docs/14 |

Giới hạn trung thực: các vai trò "AI" là một trợ lý kiêm nhiệm — **không có review độc lập** giữa các vai trò; chủ dự án là reviewer/approver duy nhất cho thay đổi rủi ro cao.

## 3. Sổ rủi ro

| ID | Rủi ro | L | I | Giảm thiểu | Dấu hiệu kích hoạt | Owner | Dự phòng |
|---|---|---|---|---|---|---|---|
| RISK-001 | Xóa DB `corelink` cũ làm mất dữ liệu | Thấp | Cao | Backup `backup/corelink-v2-20261021.sql` (84 bảng) trước khi reset | Cần dữ liệu v2 | PO | Restore vào DB riêng |
| RISK-002 | Phạm vi phình như v1/v2 | Cao | Cao | Chỉ 35 FR; ý tưởng mới vào 05 §5; GAP chỉ làm rõ FR đã có | Yêu cầu tính năng ngoài FR | PO | Từ chối/ghi Pha 2 |
| RISK-003 | Server Action thiếu kiểm quyền | TB | Cao | Mẫu action chuẩn; checklist 21 §8; unit test policy | Action mới không gọi `requireRole` | AI | Review mọi `actions.ts` trước release |
| RISK-004 | Thiếu integration/E2E | Chắc chắn | TB | Integration test viết sẵn (P3), Pha 1.5 chạy; UAT thủ công có ghi chép | — | AI | UAT thủ công kỹ hơn |
| RISK-005 | Sai lệch múi giờ khi sinh lịch | TB | TB | Một module `time.ts` + unit test | Lịch lệch 7 giờ | AI | Sửa + migration dữ liệu |
| RISK-006 | Hosting chưa chọn | — | TB | Chọn trước khi có người dùng thật (Q04) | Có kế hoạch go-live | PO | — |
| RISK-007 | Code chưa chạy trên DB thật | Chắc chắn | Cao | PO chạy `pnpm db:reset`; UAT TC-UAT-01..15 | — | PO + AI | Sửa lỗi runtime phát hiện ở 1.5 |
| RISK-008 | Tài liệu và code lệch lại sau thay đổi | TB | TB | AGENTS.md: cập nhật docs + PROGRESS sau mỗi thay đổi; GAP-REPORT định kỳ | PR không sửa docs | AI | Đối chiếu lại như phiên 3 |
| RISK-009 | Rate limit theo IP bị né/giả mạo sau proxy | TB | TB | Proxy production ghi đè `X-Forwarded-For` | Lead spam tăng | PO | Thêm CAPTCHA (Pha 2) |
| RISK-010 | Phiên hết hạn tích tụ trong `sessions` | Cao | Thấp | Dọn định kỳ (Pha 2); dung lượng nhỏ | Bảng > 100k dòng | AI | `DELETE … WHERE expiresAt < NOW()` thủ công |
| RISK-011 | Backup chưa từng thử restore | TB | Cao | Thử restore vào DB tạm ở Pha 1.5 | Sự cố cần restore | PO | — |
| RISK-012 | Một người kiêm mọi vai trò → thiếu review độc lập | Cao | TB | PO review GAP-REPORT, quyết định D15–D18, UAT | Lỗi lọt qua | PO | Nhờ người ngoài review trước production |
