# LỘ TRÌNH TRIỂN KHAI & TÁI XÂY DỰNG — CORELINK ACADEMY (ROADMAP)

**Tài liệu**: Kế hoạch Thực thi & Các Cột mốc Nghiệm thu  
**Mục tiêu**: Xây dựng hoàn chỉnh từ nền tảng tới trải nghiệm thực tế  
**Phiên bản**: 2.0  

---

## 1. TỔNG QUAN CÁC GIAI ĐOẠN TRIỂN KHAI

Lộ trình được cấu trúc tuần tự thành 8 giai đoạn theo đúng chỉ đạo của Master Prompt:

```
[Giai đoạn 1: Audit Repository]            ---> [HOÀN THÀNH - Đã nghiệm thu]
[Giai đoạn 2: Kiến trúc & Kế hoạch]        ---> [HOÀN THÀNH - Bộ 8 tài liệu đã thiết lập]
[Giai đoạn 3: Thiết lập Nền tảng UI Tokens] ---> [ĐANG THỰC HIỆN - Chuyển đổi Educational Brand]
[Giai đoạn 4: Thiết kế & Triển khai UI]    ---> [Kế hoạch tiếp theo]
[Giai đoạn 5: Hoàn thiện Nghiệp vụ BE]     ---> [Kế hoạch tiếp theo]
[Giai đoạn 6: Kết nối Frontend & Backend]   ---> [Kế hoạch tiếp theo]
[Giai đoạn 7: Kiểm thử Tổng thể & E2E]      ---> [Kế hoạch tiếp theo]
[Giai đoạn 8: Nghiệm thu & Bàn giao]        ---> [Cột mốc kết thúc]
```

---

## 2. KẾ HOẠCH CHI TIẾT TỪNG GIAI ĐOẠN

### Giai đoạn 1: Audit Repository (ĐÃ XONG)
- Khảo sát toàn bộ 84 bảng MySQL 8.4, 15 module NestJS, 55 routes Next.js 15.
- Xác thực kết quả `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
- Lập báo cáo kiểm toán chi tiết tại `docs/rebuild/audit.md`.

### Giai đoạn 2: Kiến trúc & Kế hoạch (ĐÃ XONG)
- Thiết lập đầy đủ bộ hồ sơ kỹ thuật chuẩn:
  1. `docs/rebuild/requirements.md` (Đặc tả yêu cầu & tiêu chí nghiệm thu)
  2. `docs/rebuild/architecture.md` (Kiến trúc Modular Monolith & Luồng dữ liệu)
  3. `docs/rebuild/feature-matrix.md` (Ma trận chức năng & phân quyền RBAC 2 lớp)
  4. `docs/rebuild/database-design.md` (Thiết kế CSDL 84 bảng & quan hệ 3NF)
  5. `docs/rebuild/api-design.md` (Đặc tả REST API v1 RFC 7807 & WebSocket)
  6. `docs/rebuild/security-plan.md` (Kế hoạch bảo mật OWASP Top 10 & Nghị định 13)
  7. `docs/rebuild/testing-plan.md` (Kế hoạch kiểm thử đa tầng Unit/E2E/Accessibility)
  8. `docs/rebuild/implementation-roadmap.md` (Lộ trình triển khai thực tế)

### Giai đoạn 3: Thiết lập Nền tảng Giao diện Thương hiệu Giáo dục (THỰC HIỆN NGAY)
- **Design Tokens Mới**:
  - Loại bỏ hoàn toàn nền tối cyberpunk, glow neon và glassmorphism tím/xanh điện.
  - Thiết lập bảng màu giáo dục:
    - Nền sáng canvas: `#F7F9FC`
    - Bề mặt card & modal: `#FFFFFF`
    - Viền: `#E2E8F0`
    - Primary: Xanh dương giáo dục `#2563EB`
    - Secondary: Xanh ngọc `#0F9D8A`
    - Accent: Vàng ấm `#F4B942`
    - Text chính: `#172033` (Slate Navy)
    - Text phụ: `#64748B` (Muted Slate)
- **Sửa cảnh báo CSS**: Đưa `@import url(...)` lên đầu file trước `@import "tailwindcss"` để tuân thủ chuẩn CSS3.
- **Tối ưu typography**: Kết hợp Plus Jakarta Sans (Nội dung) và Outfit (Tiêu đề).

### Giai đoạn 4: Thiết kế & Nâng cấp Giao diện Trải nghiệm (UI Overhaul)
- **Trang chủ công khai (S01 - Landing Page)**:
  - Hero section chuyên nghiệp, đáng tin cậy.
  - Khối kiểm tra trình độ đầu vào nhanh 3 bước.
  - Lộ trình học tương tác sinh động (Cambridge / IELTS / Giao tiếp).
  - Đội ngũ giảng viên quốc tế có bằng cấp sư phạm.
  - Bảng học phí và cam kết chất lượng rõ ràng.
- **Khu vực học sinh (Interactive Student Hub)**:
  - AI Speaking Coach (phòng luyện phát âm trực quan qua Web Audio).
  - Flashcard Từ vựng Spaced Repetition (học từ vựng ghi nhớ ngắt quãng).

### Giai đoạn 5 & 6: Nghiệp vụ Backend & Kết nối Toàn diện
- Kiểm tra tính nhất quán giữa API và các biểu mẫu nhập liệu.
- Đảm bảo 100% các nút bấm trên giao diện đều kích hoạt hành động thật, không có nút giả hay mockup tĩnh.

### Giai đoạn 7: Kiểm thử Toàn diện & Xác thực
- Chạy toàn bộ test suites (`test`, `test:e2e`, `typecheck`, `build`).
- Đo lường và đảm bảo không có console errors hay broken links.

### Giai đoạn 8: Bàn giao & Tài liệu Vận hành
- Cập nhật hướng dẫn chạy dự án, tài liệu triển khai và tổng kết nghiệm thu.
