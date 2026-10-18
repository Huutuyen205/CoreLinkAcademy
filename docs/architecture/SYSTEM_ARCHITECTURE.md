# KIẾN TRÚC HỆ THỐNG TỔNG THỂ (SYSTEM ARCHITECTURE SPECIFICATION)
**Dự án**: CoreLink Academy  
**Tác giả**: Solution Architect & Tech Lead  

---

## 1. Sơ Đồ Kiến Trúc Khối Tổng Thể (System Architecture Topology)

```mermaid
flowchart TB
    subgraph ClientLayer ["1. Lớp Trình Duyệt & Ứng Dụng (Client Layer)"]
        WebGuest["Website Khách & Landing Page\n(Next.js 15 App Router)"]
        WebStudent["Cổng Học Sinh & LMS\n(PWA / Mobile Responsive)"]
        WebParent["Cổng Phụ Huynh & Thanh Toán\n(VietQR / Báo cáo AI)"]
        WebStaff["Cổng Giáo Viên / Giáo Vụ / Admin\n(Dashboard Quản Trị)"]
    end

    subgraph GatewayLayer ["2. Lớp Cổng Giao Tiếp & Định Tuyến (Ingress / API Gateway)"]
        Nginx["Reverse Proxy / SSL / CORS / Helmet"]
        APIRest["NestJS 11 Core REST API\n(/api/v1/*, Swagger /api/docs)"]
    end

    subgraph ServiceLayer ["3. Lớp Dịch Vụ Nghiệp Vụ (Application & Domain Services)"]
        AuthSvc["Auth & RBAC Service\n(Argon2id, JWT Kép)"]
        PublicSvc["Public & Leads Service\n(CRM, Placement Test)"]
        AcademicSvc["Academic & Attendance Service\n(QR HMAC, GPS 150m)"]
        AssessSvc["Assessment & Anti-Cheat Service\n(Shuffle, Auto-grade)"]
        ParentSvc["Parent & Report Service\n(Daily 20h, Monthly Report)"]
        FinanceSvc["Finance & Payroll Service\n(VietQR Webhook, Lương GV)"]
    end

    subgraph AIEngineLayer ["4. Lớp AI Gateway Đa Tầng (@corelink/ai)"]
        AIGateway["AI Gateway Manager\n(Budget Guard $150, Safety Filter)"]
        Claude["Anthropic Claude 3.5 Sonnet\n(Chấm tự luận, Báo cáo tháng)"]
        Gemini["Google Gemini 1.5 Flash\n(Chatbot RAG, Giải thích đáp án)"]
        HeyGen["HeyGen Video API\n(Sinh Video bài giảng)"]
        Embeddings["Deterministic Vector Engine\n(768-dim RAG Search)"]
    end

    subgraph WorkerLayer ["5. Hàng Đợi & Tác Vụ Nền (Worker & Queue Layer)"]
        BullQueue["BullMQ Queue Manager"]
        BackgroundWorker["NestJS Worker\n(WebPush, Sync Embeddings, Cron)"]
    end

    subgraph DataStorageLayer ["6. Lớp Lưu Trữ Dữ Liệu (Persistence Layer)"]
        MySQL[("MySQL 8.4 Enterprise\n(48 Bảng Chuẩn 3NF, Foreign Keys)")]
        Redis[("Redis 7 In-Memory Cache\n(Session, Token Blocklist, Queue)")]
        MinIO[("MinIO S3 Compatible Object Storage\n(Audio, Ảnh lớp, Video bài giảng)")]
    end

    ClientLayer -->|HTTPS / REST / WebSocket| GatewayLayer
    GatewayLayer --> ServiceLayer
    ServiceLayer -->|Prisma Client| MySQL
    ServiceLayer -->|Cache / Queue| Redis
    ServiceLayer -->|Invoke AI| AIEngineLayer
    ServiceLayer -->|Dispatch Job| BullQueue
    BullQueue --> BackgroundWorker
    BackgroundWorker -->|Update Status| MySQL
    ServiceLayer -->|Presigned URL| MinIO
```

---

## 2. Các Lớp Kiến Trúc Chi Tiết

### 2.1. Frontend Web Client (`apps/web`)
- **Khung phát triển**: Next.js 15 (App Router), React 19, TypeScript.
- **Phong cách giao diện**: Tailwind CSS, Dark mode hiện đại (#0f172a, #2563eb, #60a5fa), bố cục Glassmorphism, chuẩn responsive 5 cấp độ (360px, 390px, 768px, 1024px, 1440px).
- **Hỗ trợ PWA**: Đầy đủ manifest.json, service worker cache offline, icons 192px/512px, có thể cài đặt trực tiếp lên điện thoại iOS/Android.

### 2.2. Backend REST API (`apps/api`)
- **Khung phát triển**: NestJS 11 trên nền tảng Express, TypeScript.
- **Bảo mật mạng**: Helmet bảo vệ HTTP headers, CORS cấu hình chặt chẽ theo `CORS_ORIGIN`, Rate Limiting chống DDoS.
- **Validation Pipe**: Tự động lọc dữ liệu độc hại với `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`, kết hợp DTOs và Zod schema.
- **Xác thực & Phân quyền**: Passport JWT kép (Access Token 15 phút, Refresh Token 7 ngày lưu trong cơ sở dữ liệu), Guards kiểm tra vai trò RBAC chặt chẽ tại từng Endpoint.

### 2.3. AI Gateway Chuyên Biệt (`packages/ai`)
- **Bộ điều hợp đa mô hình (Provider Adapter Pattern)**: Cho phép chuyển đổi linh hoạt giữa Claude 3.5 Sonnet, Gemini 1.5 Flash và các mô hình nội bộ.
- **Bộ lọc an toàn trẻ em (`AiSafetyFilter`)**: Kiểm duyệt đầu vào và đầu ra, loại bỏ các nội dung bạo lực, nhạy cảm hoặc không phù hợp với lứa tuổi học sinh.
- **Bộ kiểm soát chi phí (`AiBudgetGuard`)**: Giám sát thời gian thực chi phí token gọi API, tự động kích hoạt chế độ tiết kiệm/ngắt kết nối khi chạm ngưỡng $150/tháng để tránh phát sinh chi phí ngoài dự kiến.
- **Công cụ Vector Embeddings (`Deterministic Vector Engine`)**: Sinh vector 768 chiều phục vụ tìm kiếm ngữ nghĩa siêu nhanh cho kho tri thức tuyển sinh (RAG).

### 2.4. Hàng Đợi Công Việc & Worker (`apps/worker`)
- Sử dụng **BullMQ** trên nền **Redis 7** để xử lý các tác vụ bất đồng bộ nặng:
  - Gửi thông báo đẩy WebPush tới điện thoại phụ huynh lúc 20:00.
  - Phân tích hàng loạt rủi ro thôi học (Early Warning Batch Job) mỗi đêm.
  - Xử lý Webhook từ cổng thanh toán VietQR / VNPay.
  - Tải và nén tài liệu, đồng bộ vector embeddings cho tài liệu tri thức mới.

### 2.5. Cơ Sở Dữ Liệu (MySQL 8.4 Database-First)
- Thiết kế chuẩn hóa **3NF** gồm **48 bảng** liên kết chặt chẽ bằng ràng buộc khóa ngoại (Foreign Keys), Unique Constraints và Check Constraints.
- Sử dụng **Prisma ORM** với phương pháp `prisma db pull` & `prisma generate`, giữ nguyên vẹn cấu trúc file gốc `db/000_schema.sql`.
