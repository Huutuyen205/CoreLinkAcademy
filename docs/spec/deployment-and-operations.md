# HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH HỆ THỐNG — CORELINK ACADEMY (DEPLOYMENT & OPERATIONS)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: DevOps Engineer & Solution Architect  

---

## 1. YÊU CẦU MÔI TRƯỜNG & HẠ TẦNG (PREREQUISITES)

### 1.1. Môi trường Máy chủ Phát triển (Local Development)
- **Hệ điều hành**: Windows 10/11 (Hỗ trợ PowerShell 7+) hoặc Linux Ubuntu 22.04 LTS.
- **Node.js**: v22.x hoặc v24.x LTS.
- **Trình quản lý gói**: `pnpm` v9.x (`npm install -g pnpm`).
- **Cơ sở dữ liệu**: MySQL 8.4 LTS đang chạy tại `localhost:3306`.
- **Dịch vụ hỗ trợ (Docker Compose)**:
  - Redis 7: `localhost:6379`
  - MinIO S3: `localhost:9000` (Console: `localhost:9001`)
  - Mailpit: `localhost:1025` (Web UI: `localhost:8025`)

---

## 2. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG TỪ ĐẦU (SETUP GUIDE)

### Bước 1: Cài đặt Dependencies
```powershell
pnpm install
```

### Bước 2: Thiết lập Biến Môi trường
Sao chép tệp mẫu sang `.env` và điền thông tin cấu hình:
```powershell
Copy-Item .env.example .env
```

### Bước 3: Khởi tạo Cơ sở Dữ liệu & Prisma Client
- Database `corelink` được tạo trong MySQL Workbench với 84 bảng từ `db/000_schema.sql`.
- Tạo Prisma Client ánh xạ CSDL:
```powershell
pnpm db:generate
```

### Bước 4: Tạo Dữ liệu Mẫu & Tài khoản Quản trị
- Tạo tài khoản Super Admin đầu tiên:
```powershell
pnpm seed:admin
```
- Nạp dữ liệu giả lập để kiểm thử luồng giảng dạy:
```powershell
pnpm seed:demo
```

### Bước 5: Khởi chạy Ứng dụng
- **Terminal 1 — Backend API (Port 4000)**:
```powershell
pnpm --filter @corelink/api dev
```
- **Terminal 2 — Frontend Web (Port 3000)**:
```powershell
pnpm --filter @corelink/web dev
```

---

## 3. QUY TRÌNH SAO LƯU & KHÔI PHỤC CƠ SỞ DỮ LIỆU (BACKUP & RESTORE)

### 3.1. Sao lưu CSDL Tự động (Backup Procedure)
Sử dụng công cụ `mysqldump` để tạo bản sao lưu nhất quán hàng ngày:
```powershell
mysqldump -u root -p corelink --single-transaction --quick --lock-tables=false > backup_corelink_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### 3.2. Khôi phục CSDL khi Gặp Sự cố (Restore Procedure)
```powershell
mysql -u root -p corelink < backup_corelink_20261018.sql
```

---

## 4. CHIẾN LƯỢC TRIỂN KHAI PRODUCTION & ROLLBACK (PRODUCTION DEPLOYMENT)

### 4.1. Cấu trúc Triển khai Khuyến nghị
- **Reverse Proxy**: Nginx xử lý chấm dứt SSL/TLS 1.3, nén Gzip/Brotli và định tuyến:
  - `/` -> Proxy tới Next.js Web Server (Port 3000).
  - `/api/` -> Proxy tới NestJS API Server (Port 4000).
  - `/socket.io/` -> Proxy WebSocket tới NestJS Gateway.
- **Process Manager**: Quản lý tiến trình bằng PM2 để tự động khởi động lại khi có sự cố:
  ```bash
  pm2 start apps/api/dist/src/main.js --name "corelink-api"
  pm2 start apps/web/node_modules/next/dist/bin/next --name "corelink-web" -- start -p 3000
  ```

### 4.2. Kế hoạch Hoàn nguyên Sự cố (Rollback Plan)
1. Trường hợp lỗi mã nguồn ứng dụng:
   - Git checkout về commit ổn định gần nhất: `git checkout <previous_commit>`.
   - Chạy lệnh build: `pnpm --recursive build`.
   - Reload dịch vụ qua PM2: `pm2 reload all`.
2. Trường hợp lỗi do migration cơ sở dữ liệu:
   - Thực thi script rollback tương ứng trong `db/migrations/rollback_*.sql`.
   - Chạy lại lệnh sinh Prisma Client: `pnpm db:generate`.
