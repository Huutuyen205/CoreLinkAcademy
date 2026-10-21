# 16 — Ma trận truy vết

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21, phiên 3) |
| Owner | Trợ lý (BA + QA) |
| Chuỗi | `FR → UC → FEAT / SCREEN → API / Q → ENT → TC → Bằng chứng` |

Bằng chứng ghi theo kết quả **thực tế** ngày 2026-10-21: **Unit ✓** = Vitest xanh (76/76) · **Int (skip)** = integration test đã viết, tự bỏ qua vì chưa có `TEST_DATABASE_URL` (Q08) — **chưa chạy** · **Manual —** = chưa kiểm thủ công vì DB `corelink` chưa migrate (RISK-007) · **Build ✓** = typecheck/lint/build xanh · **Smoke ✓** = `next start` không DB.

| FR | UC | FEAT / SCREEN | API / Q | ENT | TC | Bằng chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| FR-001 | UC-013 | FEAT-001 / SCREEN-001 | Q-001, Q-002 | ENT-004, 005 | TC-UAT-02 | Build ✓; Manual — | Implemented |
| FR-002 | UC-013 | FEAT-002 / SCREEN-002 | Q-003 | ENT-005 | `public.test.ts` | Unit ✓; Manual — | Implemented, unit-tested |
| FR-003 | UC-013 | FEAT-003 / SCREEN-003 | Q-004 | ENT-005, 007, 009 | TC-UAT-02 | Build ✓; Manual — | Implemented |
| FR-004 | UC-001 | FEAT-004 / SCREEN-004, 005 | API-001 | ENT-011, 012 | TC-001, 002, 003 | TC-001/002 Unit ✓; TC-003 Int (skip) | Implemented, unit-tested |
| FR-005 | UC-001 | FEAT-005 | API-001 | ENT-018 | TC-004 | Unit ✓; honeypot Manual — | Implemented, unit-tested |
| FR-006 | UC-002, UC-020 | FEAT-006, 007 / SCREEN-009, 011 | Q-005, API-021 | ENT-011, 012 | TC-039, 040, 045 | TC-039/045 Unit ✓; TC-040 Int (skip); Smoke ✓ (`/quan-ly/lead/moi` 307 khi chưa đăng nhập) | Nhập tay: implemented P3 |
| FR-007 | UC-002 | FEAT-008 / SCREEN-010 | API-002 | ENT-011, 012 | TC-005, 006 | Unit ✓ | Implemented, unit-tested |
| FR-008 | UC-002 | FEAT-008 / SCREEN-010 | API-003 | ENT-012 | TC-UAT-03 | Manual — | Implemented |
| FR-009 | UC-003 | FEAT-009 / SCREEN-010 | API-004, Q-011 | ENT-001, 003, 009, 011, 012, 017 | TC-007, 008 | Int (skip) | Implemented |
| FR-010 | UC-004 | FEAT-010 / SCREEN-006 | API-005, 006 | ENT-001, 002 | TC-009, 046 | Smoke ✓ (chuyển hướng); Manual — | Implemented; giữ ô email/SĐT P3 |
| FR-011 | UC-004 | FEAT-011 | API-005 | ENT-001, 018 | TC-010, 043 | Unit ✓ | Implemented, unit-tested; IP limit P3 |
| FR-012 | UC-004 | FEAT-012 / SCREEN-007 | API-007 | ENT-001, 002 | TC-011, 012 | TC-011 Unit ✓; TC-012 Manual — | Implemented |
| FR-013 | UC-012 | FEAT-013..015 / SCREEN-016..018 | API-008, Q-028, 029 | ENT-001, 002, 017 | TC-036, 038 | Unit ✓ | Implemented, unit-tested |
| FR-014 | UC-012 | FEAT-016 / SCREEN-016, 018 | API-009, Q-030, 031 | ENT-003 | TC-037 | Unit ✓ | Implemented, unit-tested |
| FR-015 | UC-014 | FEAT-022, 023 / SCREEN-019..021 | API-010, API-022, Q-033 | ENT-004, 005 | TC-041, 048 | TC-041 Int (skip); TC-048 Manual — | Xóa môn + checkbox: implemented P3 |
| FR-016 | UC-014 | FEAT-024 / SCREEN-022 | API-010 | ENT-006 | TC-UAT-14 | Manual — | Implemented |
| FR-017 | UC-005 | FEAT-017, 019 / SCREEN-012..014 | API-011, 012, Q-008, 009, 012 | ENT-007, 008 | TC-013 | Unit ✓ | Implemented, unit-tested |
| FR-018 | UC-005 | FEAT-018 | API-011, 014 | ENT-008 | TC-014, 015 | TC-014 Unit ✓; TC-015 Int (skip) | Implemented, unit-tested |
| FR-019 | UC-006 | FEAT-020 / SCREEN-014 | API-013, Q-010 | ENT-009 | TC-016, 017, 044 | Unit ✓; TC-044 cũng có Int (skip) | Implemented, unit-tested; HS bị khóa P3 |
| FR-020 | UC-006 | FEAT-021 / SCREEN-014 | API-013 | ENT-009 | TC-018 | Unit ✓ | Implemented, unit-tested |
| FR-021 | UC-015 | FEAT-035 / SCREEN-014 | API-014 | ENT-008, 017 | TC-014, 047 | TC-014 Unit ✓; TC-047 Int (skip) | Implemented; audit hủy P3 |
| FR-022 | UC-016 | FEAT-027 / SCREEN-025, 033, 034, 038 | Q-013 | ENT-008 | TC-013, `time.test.ts` | Unit ✓ | Implemented, unit-tested |
| FR-023 | UC-007 | FEAT-025 / SCREEN-028 | API-015, Q-016 | ENT-010 | TC-019 | Unit ✓ | Implemented, unit-tested |
| FR-024 | UC-007 | FEAT-026 / SCREEN-015 | API-015 | ENT-010, 017 | TC-020 | Unit ✓ | Implemented, unit-tested |
| FR-025 | UC-011, 017 | FEAT-037 / SCREEN-037, 038 | Q-018 | ENT-010 | TC-021 | Unit ✓ | Implemented, unit-tested |
| FR-026 | UC-018 | FEAT-043 / SCREEN-008, 024, 027 | Q-017 | ENT-010 | TC-022 | Unit ✓ | Implemented, unit-tested |
| FR-027 | UC-008 | FEAT-028 / SCREEN-029, 030 | API-016, Q-019 | ENT-013, 014 | TC-025 | Unit ✓ | Implemented, unit-tested |
| FR-028 | UC-008 | FEAT-029 / SCREEN-030 | API-017 | ENT-013 | TC-023, 024 | Unit ✓ | Implemented, unit-tested |
| FR-029 | UC-009 | FEAT-030 / SCREEN-035, 036 | API-018, Q-025, 026 | ENT-015, 016 | TC-028 | Unit ✓ | Implemented, unit-tested |
| FR-030 | UC-009 | FEAT-031 | API-018 | ENT-016 | TC-026, 027, 029 | Unit ✓ | Implemented, unit-tested |
| FR-031 | UC-010 | FEAT-032 / SCREEN-031, 032 | API-019, Q-021, 022 | ENT-015, 016 | TC-030, 031 | Unit ✓ | Implemented, unit-tested |
| FR-032 | UC-010 | FEAT-033 / SCREEN-030, 036 | API-020 | ENT-013 | TC-032, 033, 042 | Unit ✓; TC-UAT-10 (xem source) Manual — | Implemented; BR-047 P3 |
| FR-033 | UC-010, 017 | FEAT-034, 036 / SCREEN-027, 037, 038 | Q-023, Q-027 | ENT-015 | TC-031, 033, 042 | Unit ✓ | Implemented, unit-tested |
| FR-034 | UC-011, 018 | FEAT-038..041 / SCREEN-008, 024, 033, 038 | Q-007, 013, 014, 017, 024, 025, 027, 032 | nhiều | TC-034, 035 | Unit ✓ (policy); Manual — | Implemented; đếm tổng bài chờ chấm P3 |
| FR-035 | UC-019 | FEAT-042 / SCREEN-023 | Q-034 | ENT-017 | TC-036, TC-UAT-08 | Unit ✓ (policy); Manual — | Implemented |
| NFR-001 | tất cả | — | tất cả | — | TC-034..036, §6 N-01..N-10 | Unit ✓; N-01 Smoke ✓; còn lại Manual — | Implemented |
| NFR-003 | — | FEAT-044 | — | — | TC-UAT-15 | Token tương phản đo bằng công thức WCAG ✓; bàn phím Manual — | Skip link + line-strong P3 |
| NFR-008 | — | — | — | — | — | typecheck ✓, lint ✓, test 76/76 ✓, build ✓ (2026-10-21) | Đạt |
| NFR-010 | — | — | — | — | Smoke | Smoke ✓ | Đạt |

Phân biệt trạng thái (SKILL): **implemented** = có code; **tested** = có test xanh; **reviewed** = chỉ self-review của trợ lý, chưa có reviewer độc lập; **deployed/released** = chưa.
