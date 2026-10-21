# 16 — Ma trận truy vết

`FR → UC → Màn hình → Action → Bảng → TC`. Cột "Bằng chứng" ghi theo kết quả thực tế (2026-10-21). "Unit pass" = Vitest xanh; "Manual" = chưa kiểm tra thủ công vì DB `corelink` chưa được migrate (xem PROGRESS).

| FR | UC | Màn hình | Action | Bảng | TC | Bằng chứng |
|---|---|---|---|---|---|---|
| FR-001 | — | `/` | — | subjects, courses | — (manual) | Code xong; build pass; manual chờ DB |
| FR-002 | — | `/khoa-hoc` | — | courses | `public.test.ts` | Unit pass (where-clause lọc môn/khối); manual chờ DB |
| FR-003 | — | `/khoa-hoc/[slug]` | — | courses, classes | — (manual) | Code xong (khóa ẩn → 404); manual chờ DB |
| FR-004 | UC-001 | `/dang-ky-hoc-thu` | API-001 | leads, lead_activities | TC-001..003 | TC-001, 002 unit pass; TC-003 integration (Pha 1.5) |
| FR-005 | UC-001 | `/dang-ky-hoc-thu` | API-001 | rate_limit_buckets | TC-004 | Unit pass; honeypot manual chờ DB |
| FR-006..008 | UC-002 | `/quan-ly/lead*` | API-002, 003 | leads, lead_activities | TC-005, 006 | Unit pass |
| FR-009 | UC-003 | `/quan-ly/lead/[id]` | API-004 | users, guardianships, enrollments, leads, audit_logs | TC-007, 008 | Code xong (một transaction); integration Pha 1.5 |
| FR-010..012 | UC-004 | `/dang-nhap`, `/doi-mat-khau` | API-005..007 | users, sessions | TC-009..012 | TC-010, 011 unit pass; redirect khi chưa đăng nhập đã smoke test; TC-009, 012 chờ DB |
| FR-013, 014 | UC-012 | `/quan-ly/nguoi-dung*`, `/quan-ly/hoc-vien` | API-008, 009 | users, guardianships, audit_logs | TC-036..038 | Unit pass |
| FR-015, 016 | — | `/quan-ly/khoa-hoc*`, `/mon-hoc`, `/phong` | API-010 | subjects, courses, rooms | — (manual) | Code xong; manual chờ DB |
| FR-017, 018 | UC-005 | `/quan-ly/lop/moi` | API-011 | classes, class_sessions | TC-013..015 | TC-013, 014 unit pass; TC-015 integration Pha 1.5 |
| FR-019, 020 | UC-006 | `/quan-ly/lop/[id]` | API-013 | enrollments | TC-016..018 | Unit pass |
| FR-021 | — | `/quan-ly/lop/[id]` | API-014 | class_sessions, audit_logs | TC-014 | Unit pass (trùng lịch); manual chờ DB |
| FR-022 | UC-011 | `/giao-vien/lich`, `/hoc-sinh/lich`, `/hoc-sinh`, `/phu-huynh` | — | class_sessions | TC-013, time.test | Unit pass (tuần theo giờ VN) |
| FR-023, 024 | UC-007 | `/giao-vien/buoi/[id]`, `/quan-ly/buoi/[id]` | API-015 | attendances, audit_logs | TC-019, 020 | Unit pass |
| FR-025, 026 | UC-011 | `/hoc-sinh/ket-qua`, `/phu-huynh`, `/quan-ly`, `/giao-vien` | — | attendances | TC-021, 022 | Unit pass |
| FR-027, 028 | UC-008 | `/giao-vien/bai-tap/*` | API-016, 017 | assignments, questions | TC-023..025 | Unit pass |
| FR-029, 030 | UC-009 | `/hoc-sinh/bai-tap/[id]` | API-018 | submissions, answers | TC-026..029, 032 | Unit pass |
| FR-031..033 | UC-010 | `/giao-vien/bai-nop/[id]`, `/giao-vien/lop/[id]`, `/hoc-sinh/ket-qua` | API-019, 020 | submissions, answers, audit_logs | TC-030, 031, 033 | Unit pass |
| FR-034 | UC-011 | 4 dashboard | — | nhiều | TC-034, 035 | Unit pass (policy); manual chờ DB |
| FR-035 | — | `/quan-ly/nhat-ky` | — | audit_logs | — (manual) | Code xong (không có hàm xóa audit); manual chờ DB |
| NFR-001 | tất cả | — | tất cả | — | TC-034..036 | Unit pass; mọi trang/action gọi `requireRole` + service kiểm phạm vi |
