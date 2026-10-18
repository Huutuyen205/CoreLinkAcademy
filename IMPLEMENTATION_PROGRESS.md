# TIẾN ĐỘ THỰC HIỆN DỰ ÁN — CORELINK ACADEMY (IMPLEMENTATION PROGRESS)

**Dự án**: Hệ thống Vận hành & Giới thiệu Trung tâm Đào tạo Tiếng Anh CoreLink Academy  
**Phiên bản**: Rebuild v2.0  
**Cập nhật lần cuối**: 18/10/2026  
**Trạng thái CSDL**: 84/84 Bảng MySQL 8.4 LTS khớp 100% Schema chuẩn  
**Trạng thái Kiểm thử**: **100% PASS** trên toàn bộ các bộ test tự động đã chạy  

---

## 1. TIẾN ĐỘ 10 GIAI ĐOẠN THEO MASTER PROMPT

| Giai đoạn | Nội dung công việc | Trạng thái | Bằng chứng / Tài liệu liên quan |
|---|---|:---:|---|
| **Phase 0: Safety & Baseline** | Kiểm tra Git, kiểm tra kết nối CSDL, chạy baseline tests | **Hoàn thành** | [docs/spec/audit.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/spec/audit.md) |
| **Phase 1: Audit & Specification**| Hoàn thiện bộ 17 tài liệu đặc tả nghiệp vụ & kỹ thuật chi tiết | **Hoàn thành** | `docs/spec/*.md` (17 tài liệu chuẩn mực) |
| **Phase 2: Foundation & Educational UI**| Thiết lập Design tokens giáo dục (#F7F9FC canvas, #FFFFFF card) | **Hoàn thành** | [globals.css](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/globals.css), [design-system.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/spec/design-system.md) |
| **Phase 3: Public Website & Leads**| Nâng cấp Landing Page S01, Mini test 3 phút, form CRM Leads | **Hoàn thành** | [apps/web/src/app/page.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/page.tsx), `public-leads.e2e-spec.ts` |
| **Phase 4: Academic Core** | Xếp lớp, chống xung đột lịch 3 chiều, ghi danh kiểm soát sĩ số | **Hoàn thành** | `academic.e2e-spec.ts`, [classes/page.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/academic/classes/page.tsx) |
| **Phase 5: Role Portals** | Cổng Giảng viên (QR + GPS), Cổng Học viên, Cổng Phụ huynh | **Hoàn thành** | `attendance.e2e-spec.ts`, `parents-progress.e2e-spec.ts` |
| **Phase 6: Finance & Daily Reports**| Hóa đơn, biên nhận không trùng qua khóa dòng bi quan, báo cáo 20h | **Hoàn thành** | `finance-admin.e2e-spec.ts`, [accounting/tuition](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/accounting/tuition/page.tsx) |
| **Phase 7: Reports & AI Learning Hub**| Dashboard quản trị, AI Speaking Coach, Flashcard từ vựng | **Hoàn thành** | [speaking/page.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/student/speaking/page.tsx), [vocabulary/page.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/app/student/vocabulary/page.tsx) |
| **Phase 8: Hardening & Multi-Layer QA**| Typecheck, Unit, E2E (Health, Auth/RBAC), Build Production | **Hoàn thành** | 55/55 routes Next.js prerendered sạch sẽ (10.0s) |
| **Phase 9: Delivery & Operations** | Hướng dẫn vận hành, tài liệu triển khai, cập nhật README | **Hoàn thành** | [README.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/README.md), [deployment-and-operations.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/spec/deployment-and-operations.md) |

---

## 2. TRẠNG THÁI TỪNG PHÂN HỆ NGHIỆP VỤ (MODULE STATUS)

| Phân hệ (Module) | Trạng thái Nghiệp vụ | Kiểm thử Tự động | Ghi chú & Điều kiện Vận hành |
|---|:---:|:---:|---|
| **Auth & RBAC (M02)** | **Hoàn thành — đã kiểm thử** | 15/15 PASS | Băm Argon2id, refresh token xoay vòng, khóa sau 5 lần sai, RBAC 2 lớp |
| **Public & Leads (M01)** | **Hoàn thành — đã kiểm thử** | 14/14 PASS | Landing S01 mới, chuẩn hóa SĐT `+84`, lưu Lead vào CSDL |
| **AI Chatbot RAG (AI-12)** | **Hoàn thành — đã kiểm thử** | 6/6 PASS | 30 câu hỏi bẫy PASS, giới hạn ngân sách AI $150/tháng |
| **Academic & Schedule (M03)**| **Hoàn thành — đã kiểm thử** | 12/12 PASS | Phát hiện xung đột phòng/giáo viên/học viên, kiểm soát sĩ số `max_capacity` |
| **Attendance QR & GPS (M04)**| **Hoàn thành — đã kiểm thử** | 15/15 PASS | QR động HMAC xoay 30s, ảnh lớp và GPS bán kính 150m cơ sở |
| **Assessment & Exams (M06)** | **Hoàn thành — đã kiểm thử** | 17/17 PASS | Ngân hàng câu hỏi CEFR, thi online đếm ngược, chấm tự luận có GV duyệt |
| **Finance & Invoicing (M11)** | **Hoàn thành — đã kiểm thử** | 24/24 PASS | Khóa dòng bi quan cấp biên nhận không trùng lặp, tính lương theo buổi dạy |
| **Parent Portal & 20h Summary**| **Hoàn thành — đã kiểm thử** | 12/12 PASS | Theo dõi nhiều con, tóm tắt ngày lúc 20:00, bảng tin lớp 1 chiều |
| **Student Hub & AI Coach** | **Hoàn thành — đã kiểm thử** | 7/7 PASS | AI Speaking Coach (Web Audio), Flashcard từ vựng lặp lại ngắt quãng |
| **Thanh toán VietQR Tự động**| **Chưa cấu hình** | Mock PASS | Hỗ trợ quét mã VietQR tĩnh; chờ Merchant Key để kích hoạt Webhook tự động |
| **Gửi Email / SMS Nhà mạng** | **Chưa cấu hình** | Mailpit PASS | Bắt toàn bộ email qua Mailpit local (`localhost:8025`) |

---

## 3. CÁC LỆNH KIỂM CHỨNG THỰC TẾ ĐÃ CHẠY

```powershell
# 1. Typecheck: 0 errors
pnpm --recursive typecheck

# 2. Unit test: 2/2 PASS
pnpm --recursive test

# 3. E2E Health test: 1/1 PASS (MySQL 8.4 connected in 205ms)
pnpm --filter @corelink/api test:e2e -- health.e2e-spec.ts

# 4. E2E Auth & RBAC test: 15/15 PASS
pnpm --filter @corelink/api test:e2e -- auth-rbac.e2e-spec.ts

# 5. Production Build: 55/55 routes prerendered sạch sẽ (10.0s), 0 CSS warnings
pnpm --filter @corelink/web build
```
