# ADR-003: Server Actions là API nội bộ; chưa có REST công khai

- **Status:** Accepted · **Date:** 2026-10-21 · **Decision owner:** chủ dự án · **Reviewers:** trợ lý (Architect, Security)
- **Related requirements:** NFR-001, NFR-012 · ADR-001 · T-05, T-07

## Context and problem
Pha 1 chỉ có một client (web). Cần cách ghi dữ liệu ít mã lặp (DTO, API client) nhưng vẫn kiểm quyền chặt.

## Decision drivers / constraints
Một developer · form hoạt động với `useActionState` · CSRF · khả năng tách API sau này.

## Options considered
| Option | Ưu | Nhược |
|---|---|---|
| A. Route Handlers REST `/api/*` + fetch từ client | Contract rõ, dùng lại cho mobile | Gấp đôi mã (route + client + DTO), tự lo CSRF |
| **B. Server Actions gọi từ form** | Ít mã, type-safe, Next kiểm tra Origin | Endpoint POST "ẩn" nhưng vẫn công khai; không dùng được cho mobile |
| C. tRPC/GraphQL | Type-safe | Phụ thuộc thêm, quá mức cho Pha 1 |

## Decision
Chọn **B**. Mỗi action: `requireRole` → Zod → `runAction(service(actor, …))` → `revalidatePath`/`redirect`. Service ở `src/server/**` độc lập React để có thể bọc thành REST sau này.

## Consequences and trade-offs
- (+) Không có tầng DTO/API client; lỗi validate trả trực tiếp về form.
- (−) Server Action là endpoint POST công khai → **mọi action phải tự kiểm phiên + quyền + phạm vi**, không tin field ẩn (đã áp dụng; review trong 21 §checklist).
- (−) Không có OpenAPI; contract ghi ở docs/11 (ActionState + mã lỗi).

## Security / performance / operations impact
Next.js kiểm tra header `Origin` khớp host cho Server Actions (CSRF); cookie SameSite=Lax là lớp thứ hai.

## Migration, rollout and rollback
Khi cần mobile (P2-20): thêm Route Handlers `/api/v1/*` gọi cùng service + ADR về token.

## Review trigger
Có client thứ hai hoặc tích hợp bên ngoài.
