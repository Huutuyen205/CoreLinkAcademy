# THIẾT KẾ KIẾN TRÚC HỆ THỐNG — CORELINK ACADEMY (ARCHITECTURE)

**Tài liệu**: Kiến trúc Kỹ thuật Tổng thể (Software Architecture Document)  
**Phiên bản**: 2.0  
**Ngày phê duyệt**: 18/10/2026  
**Kiến trúc sư**: Principal Software Architect & Tech Lead  

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG THỂ (MODULAR MONOLITH)

Hệ thống được xây dựng theo mô hình **Modular Monolith** kết hợp phân tách giao diện người dùng (Micro-Frontend / Multi-Role Portal), giúp tối ưu hóa khả năng bảo trì, đơn giản hóa quy trình triển khai và loại bỏ độ trễ phân tán không cần thiết:

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  +---------------------------------------------------------------------------------+  |
|  |                     Next.js 15 (App Router, React 19, TypeScript)               |  |
|  |  +----------------+  +----------------+  +----------------+  +----------------+ |  |
|  |  | Public Portal  |  | Student Portal |  | Parent Portal  |  | Teacher Portal | |  |
|  |  | (Landing, CRM) |  | (LMS, AI Coach)|  | (Progress, Fee)|  | (Attendance)   | |  |
|  |  +----------------+  +----------------+  +----------------+  +----------------+ |  |
|  |  +------------------------------------+  +------------------------------------+ |  |
|  |  | Staff / Consultant / Admissions    |  | Admin & Financial Dashboard        | |  |
|  |  +------------------------------------+  +------------------------------------+ |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
                                           | HTTP / REST API v1 (JSON / SSE)
                                           | WebSocket / Socket.IO (Real-time)
+---------------------------------------------------------------------------------------+
|                                    BACKEND API LAYER                                  |
|  +---------------------------------------------------------------------------------+  |
|  |                           NestJS 11 Application Gateway                         |  |
|  |  - Global Exception Filter (RFC 7807)     - Passport JWT & HttpOnly Cookies     |  |
|  |  - Two-Layer RBAC & Scope Policy Guards   - Zod / Class-Validator Pipelines    |  |
|  +---------------------------------------------------------------------------------+  |
|                                          |                                            |
|   [Business Domain Modules]              |           [Cross-Cutting Modules]          |
|   - Auth & Users Module                  |           - AI Gateway & Anonymizer        |
|   - Admissions & Lead CRM                |           - Notification & WebPush         |
|   - Academic & Scheduling (Conflict Det) |           - Storage (MinIO / S3 Adapter)   |
|   - Attendance (HMAC QR + GPS Verification)          - Audit Logging Engine           |
|   - Assessment & Smart Question Bank     |           - Health & Readiness Checks      |
|   - Finance, Invoicing & Payroll Engine  |                                            |
|   - Parent & Student Progress Engine     |                                            |
+---------------------------------------------------------------------------------------+
                      |                                        |
                      | Prisma ORM (Database-First)           | BullMQ Workflows
+-------------------------------+                     +---------------------------------+
|      PERSISTENCE LAYER        |                     |      BACKGROUND WORKER          |
|  +-------------------------+  |                     |  +---------------------------+  |
|  |   MySQL 8.4 LTS         |  |                     |  |  NestJS Worker Service    |  |
|  |   - 84 Tables           |  |                     |  |  - Daily Summary (20:00)  |  |
|  |   - 11 DB Triggers      |  |                     |  |  - QR Code Rotation       |  |
|  |   - 4 Analysis Views    |  |                     |  |  - Unattended Alerts      |  |
|  |   - Row-level Lockings  |  |                     |  |  - Video/Media Rendering  |  |
|  +-------------------------+  |                     |  +---------------------------+  |
+-------------------------------+                     +---------------------------------+
                      |                                                |
                      +------------------+-----------------------------+
                                         |
                            +--------------------------+
                            |     CACHE & QUEUE        |
                            |     Redis 7.x Server     |
                            +--------------------------+
```

---

## 2. PHÂN TÁCH TRÁCH NHIỆM VÀ LUỒNG DỮ LIỆU (DATA FLOW)

### 2.1. Luồng Xác thực và Phân quyền 2 lớp (Two-Layer Authorization Flow)
1. **Lớp 1 (Role-Based Access Control - RBAC)**:
   - Decorator `@Roles(Role.TEACHER, Role.ADMIN)` kiểm tra vai trò người dùng trong JWT Payload.
   - Nếu vai trò không khớp, từ chối ngay lập tức với mã lỗi `403 Forbidden`.
2. **Lớp 2 (Data-Scope Policy Verification)**:
   - Decorator `@Scope(ScopeType.CLASS_TEACHER)` hoặc Policy Handler tương ứng xác thực quyền sở hữu dữ liệu thực tế:
     - Giáo viên chỉ được truy cập dữ liệu của lớp mình đang trực tiếp giảng dạy (`class_teachers` hoặc `class_sessions.teacher_id`).
     - Phụ huynh chỉ được xem thông tin học sinh trong bảng liên kết `guardianships` đã được phê duyệt.
     - Nhân viên chỉ được xem và xử lý dữ liệu thuộc chi nhánh (`branch_id`) được phân công.
   - Ngăn chặn triệt để lỗ hổng IDOR (Insecure Direct Object References).

### 2.2. Luồng Xử lý AI Có Đạo đức (Ethical AI Pipeline)
1. Request từ Client gửi tới Controller nghiệp vụ (VD: Chấm bài viết hoặc Chatbot tư vấn).
2. Controller gọi tới `AiGateway` thông qua interface chuẩn hóa:
   ```ts
   AiGateway.generate({ feature, system, messages, jsonSchema, actorId, entity })
   ```
3. **Anonymizer Engine**: Tự động rà soát và thay thế toàn bộ thông tin nhận dạng cá nhân (PII: Tên, SĐT, Email, Tên trường) thành các nhãn ẩn danh `[HS_1]`, `[PH_1]`, `[GV_1]`.
4. **Budget Guard**: Kiểm tra hạn mức chi tiêu hàng tháng (`monthly_budget_usd`). Nếu vượt quá 80%, kích hoạt cảnh báo; nếu đạt 100%, tự động từ chối các tác vụ nặng để bảo vệ chi phí.
5. **Gọi Model AI**: Gửi dữ liệu đã ẩn danh tới Claude 3.5 Sonnet hoặc Gemini 1.5 Flash.
6. **Ghép nối và Phê duyệt**: Nhận kết quả từ AI, phục hồi lại danh tính thật, lưu trữ với cờ `is_ai = 1`, `approved_by = NULL`. Kết quả này chỉ được công bố cho học viên/phụ huynh sau khi giáo viên chuyên môn duyệt.

---

## 3. THIẾT KẾ CÔNG NGHỆ VÀ GIAO TIẾP

| Thành phần | Lựa chọn công nghệ | Lý do kiến trúc & Ưu điểm |
|---|---|---|
| **Frontend Framework** | Next.js 15 (App Router) + React 19 | SSR cho trang công khai (tối ưu SEO); Client Components linh hoạt cho bảng điều khiển quản trị; quản lý routing phân cấp rõ ràng. |
| **Giao diện & CSS** | Tailwind CSS 4 + Modern Design System | Tối ưu kích thước bundle; quản trị token màu sắc, typography và spacing tập trung; hỗ trợ responsive đa thiết bị từ 360px. |
| **Backend Core** | NestJS 11 + TypeScript Strict | Kiến trúc Dependency Injection chuẩn mực, dễ kiểm thử tự động, tích hợp OpenAPI/Swagger tự động. |
| **ORM & Database** | Prisma Client + MySQL 8.4 LTS | Phương thức tiếp cận **Database-First** bảo toàn 84 bảng schema đã chuẩn hóa và tối ưu chỉ mục; kiểm soát chặt chẽ quan hệ và giao dịch tài chính. |
| **Queue & Real-time** | BullMQ + Redis 7 + Socket.IO | Quản lý hàng đợi tác vụ bất đồng bộ đáng tin cậy, tự động retry khi gặp lỗi mạng, truyền phát thông báo và tin nhắn tức thời. |
| **Lưu trữ tệp tin** | MinIO S3 Compatible Object Storage | Lưu trữ an toàn ảnh điểm danh, file ghi âm giọng nói, tài liệu giáo trình qua Presigned URLs có thời hạn sử dụng. |

---

## 4. CHIẾN LƯỢC QUẢN TRỊ TRẠNG THÁI VÀ BỘ NHỚ ĐỆM (CACHING & STATE)

1. **Server State (Frontend)**: Sử dụng `@tanstack/react-query` v5 với `staleTime` và `cacheTime` cấu hình theo từng loại dữ liệu:
   - Dữ liệu ít thay đổi (Danh mục khóa học, thông tin cơ sở): Cache 15-30 phút.
   - Dữ liệu thời gian thực (Lịch học, điểm danh, thông báo): Invalidate ngay khi có thao tác đột biến (mutation) hoặc nhận event qua WebSocket.
2. **Backend In-Memory Cache (Redis)**:
   - Bộ đệm danh mục quyền hạn người dùng (User Permissions Cache) thời hạn 15 phút.
   - Bộ đệm nhúng văn bản (Embedding Cache) của các đoạn tri thức Chatbot phục vụ tìm kiếm vector tức thời.
