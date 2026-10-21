# 19 — Vai trò dự án theo từng phía và sổ đăng ký tài liệu

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) |
| Owner | Trợ lý (Documentation Lead) · Phê duyệt: chủ dự án |
| Căn cứ | Skill `project-team-roles-master` — SOLO_DEVELOPER_ORCHESTRATION, DOCUMENTATION_FACTORY, danh mục vai trò §5.28–5.29, §18.1 |

## 1. Vai trò được kích hoạt (team MVP tối thiểu, §18.1)

Một chủ dự án + một trợ lý AI kiêm nhiệm. Vai trò là **trách nhiệm**, không phải nhân sự. Chỉ kích hoạt vai trò có việc thật ở Pha 1.

| Phía | Vai trò kích hoạt | Ai | Đầu ra sở hữu | Không kích hoạt (lý do) |
|---|---|---|---|---|
| Product / Business | Product Owner | Chủ dự án | Mục tiêu, phạm vi, quyết định, UAT | Market Research, PMM, Growth, Sales (chưa ra thị trường) |
| | PM / Delivery | Trợ lý | Kế hoạch, RAID (docs/15) | Scrum Master (1 người) |
| Requirements & Docs | BA, Requirements Engineer, Use Case Writer, Functional Analyst, Process Analyst | Trợ lý | docs/01, 02, 04, 05, 06, 07 | — |
| | Documentation Lead, Technical Writer | Trợ lý | Sổ tài liệu (§3), README, 20, 21 | — |
| Design | Product/UI Designer, UX Writer, Design Systems, Accessibility | Trợ lý | docs/08, `globals.css`, `components/ui` | Brand Strategist (chưa có logo — Q01), Mobile Designer (không có app) |
| Kiến trúc & Kỹ thuật | Solution Architect, Tech Lead | Trợ lý | docs/09, ADR | — |
| | Frontend (Web) | Trợ lý | `src/app`, `src/components`, docs/20 | Mobile FE/BE (không có app) |
| | Backend, API Contract Owner | Trợ lý | `src/server`, docs/11, 21 | Integration/Webhook (không có tích hợp) |
| | Database Engineer / Data Modeler | Trợ lý | `prisma/`, docs/10 | Data/Analytics Engineer (Q09) |
| Chất lượng & An toàn | QA Test Analyst, SDET | Trợ lý | docs/13, test | — |
| | Security / Privacy liaison | Trợ lý (soạn) · Chủ dự án (risk owner) | docs/12 | Pháp lý chuyên môn (Q10 — cần chuyên gia thật) |
| Vận hành | DevOps / Release Manager | Trợ lý (soạn) · Chủ dự án (chạy) | docs/14, 18 | SRE, Incident Manager chuyên trách (chưa production) |
| AI | — | — | — | AI/ML, LLMOps (AI ở Pha 2) |

**Giới hạn:** trợ lý không thể là reviewer độc lập cho chính đầu ra của mình (SOLO_DEVELOPER_ORCHESTRATION §6). Chủ dự án duyệt các điểm rủi ro cao: GAP-REPORT, DECISION-D15..D18, UAT, lệnh phá hủy DB, release.

## 2. Tài liệu theo từng phía

| Phía | Đọc trước | Tài liệu chính | Chỉ mục nhanh |
|---|---|---|---|
| **Product Owner** | 00 | 00, 01, 15, 17, 18 | Phạm vi, quyết định chờ duyệt (17 §1 "Đề xuất") |
| **BA / Requirements** | 00, 01 | 02, 03, 04-use-cases/, 05, 06, 07, 16 | FR → UC → BR → luồng |
| **Design / UX** | 00 §3, 08 | 08, 07 §1, portals/ | Screen inventory, token, copy |
| **Frontend** | 08, 20 | 20, 11 §2–3, 03 §6, portals/ | Mẫu form, trạng thái, component |
| **Backend** | 09, 21 | 21, 11, 06, 10, 03 §4 | Mẫu action/service, mã lỗi, transaction |
| **Database** | 10 | 10, 06 §3, 14 §3, §7 | Data dictionary, migration, backup |
| **QA** | 13 | 13, 16, 04-use-cases/, 03 §7 | Test case, UAT, ma trận quyền âm |
| **Security / Privacy** | 12 | 12, 03, 09 system-context §3 | Threat register, privacy review |
| **DevOps / Release** | 14 | 14, 18, 10 §6 | Lệnh, rollback, smoke test |
| **Theo cổng người dùng** | portals/ | P-01 Khách · P-02 Quản lý · P-03 Giáo viên · P-04 Học sinh · P-05 Phụ huynh | Mỗi cổng: màn hình, hành động, quyền, trạng thái, dữ liệu |

## 3. Sổ đăng ký tài liệu (DOC-GOV-001)

Trạng thái theo vòng đời §5.31: Draft · In Review · **Baselined** (dùng để triển khai) · Superseded.

| DOC ID | Path | Tài liệu | Owner (soạn) | Approver | Trạng thái | Version | Cập nhật |
|---|---|---|---|---|---|---|---|
| DOC-PROD-001 | `docs/00-project-brief.md` | Project Brief | PM/BA | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-004 | `docs/01-requirements.md` | Danh mục FR/NFR (nguồn chuẩn phạm vi) | BA | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-005 | `docs/02-srs.md` | SRS chi tiết | Requirements Eng. | PO | Baselined | 1.0 | 2026-10-21 |
| DOC-SEC-002 | `docs/03-actors-roles-permissions.md` | RBAC + phạm vi | BA + Security | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-008 | `docs/04-use-cases.md`, `docs/04-use-cases/UC-001..020` | Use case catalogue + đặc tả | Use Case Writer | PO | Baselined | 1.0–1.1 | 2026-10-21 |
| DOC-BA-006/007 | `docs/05-functional-decomposition.md` | Feature tree + inventory + Pha 2 | Functional Analyst | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-010/012 | `docs/06-business-rules-and-states.md` | BR + máy trạng thái | BA | PO | Baselined (D15–D18 chờ xác nhận) | 3.1 | 2026-10-21 |
| DOC-UX-001/002 | `docs/07-user-flows-and-logic-diagrams.md` | Sitemap, journey, sơ đồ logic | BA + Designer | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-UX-004/005 | `docs/08-ui-ux-and-design-system.md` | UI spec + design system | Designer | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-ARCH-001 | `docs/09-architecture/system-context.md` | C4 context/container, trust boundaries | Architect | PO | Baselined (deployment: proposed) | 1.0 | 2026-10-21 |
| DOC-ARCH-002 | `docs/09-architecture/component-architecture.md` | Component, quy tắc phụ thuộc | Architect | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-ARCH-003 | `docs/09-architecture/adr/ADR-001..004` | ADR | Architect | PO | Accepted | — | 2026-10-21 |
| DOC-DATA-001/002 | `docs/10-database-and-erd.md` | ERD + data dictionary | DBA | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-API-001/002 | `docs/11-api-specification.md` | Server Actions + error catalogue | API Owner | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-SEC-001 | `docs/12-security-and-privacy.md` | Threat model + privacy | Security | PO (risk owner) | In Review (chưa phê duyệt) | 3.1 | 2026-10-21 |
| DOC-QA-001..003 | `docs/13-test-strategy-and-test-cases.md` | Test strategy + cases + UAT | QA | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-OPS-001..004 | `docs/14-deployment-and-operations.md` | Runbook | DevOps | PO | Baselined (production: proposed) | 3.1 | 2026-10-21 |
| DOC-BA-014/015 | `docs/15-project-plan-and-risk-register.md` | Kế hoạch, RACI, rủi ro | PM | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-013 | `docs/16-traceability-matrix.md` | Ma trận truy vết | BA + QA | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-BA-014 | `docs/17-open-questions-and-decisions.md` | Quyết định, giả định, câu hỏi | BA/PM | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-REL-001 | `docs/18-release-checklist.md` | Release checklist | Release | PO | Baselined | 3.1 | 2026-10-21 |
| DOC-GOV-001 | `docs/19-team-roles-and-document-register.md` | Tài liệu này | Doc Lead | PO | Baselined | 1.0 | 2026-10-21 |
| DOC-DEV-001/009 | `docs/20-frontend-guide.md` | Hướng dẫn Frontend | Tech Writer + FE | PO | Baselined | 1.0 | 2026-10-21 |
| DOC-DEV-002/006 | `docs/21-backend-guide.md` | Hướng dẫn Backend / coding guide | Tech Writer + BE | PO | Baselined | 1.0 | 2026-10-21 |
| DOC-USER-002 | `docs/portals/P-01..P-05` | Đặc tả theo cổng người dùng | BA + Designer | PO | Baselined | 1.0 | 2026-10-21 |
| DOC-DEV-003 | `README.md` | Cài đặt từ máy mới | Tech Writer | PO | Baselined | 1.0 | 2026-10-21 |
| — | `docs/ACCOUNTS.md` | Tài khoản demo (không mật khẩu) | QA | PO | Baselined | v3 | 2026-10-21 |
| — | `docs/progress/PROGRESS.md` | Nhật ký tiến độ (kết quả lệnh thật) | Trợ lý | PO | Liên tục | — | 2026-10-21 |
| — | `docs/progress/GAP-REPORT-2026-10-21.md` | Báo cáo đối chiếu docs ↔ code | BA + QA | PO | In Review | 1.0 | 2026-10-21 |

## 4. Quy tắc cập nhật (Change impact)

Khi thay đổi code, cập nhật theo bảng (AGENTS.md: "Sau khi code thay đổi, cập nhật tài liệu liên quan và PROGRESS"):

| Thay đổi | Tài liệu bắt buộc xem lại |
|---|---|
| Thêm/sửa FR, quyền, BR | 01, 02, 03, 04-use-cases, 05, 06, 16 |
| Màn hình, copy, token | 08, portals/, 20 |
| Server Action, mã lỗi, truy vấn | 11, 21, 16 |
| Schema/migration | 10, 14 §3, 18 |
| Bảo mật/phiên/rate limit | 12, 03, 09 |
| Lệnh/biến môi trường | 14, README |
| Kết quả kiểm thử | 13 §8, 16 cột Bằng chứng, PROGRESS |

Không giữ hai bản mâu thuẫn: nguồn chuẩn phạm vi = 01; BR = 06; dữ liệu = `schema.prisma`; token = `globals.css`; quyền = `policy.ts` + 03.
