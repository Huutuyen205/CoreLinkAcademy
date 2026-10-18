# KẾ HOẠCH KIỂM THỬ HỆ THỐNG — CORELINK ACADEMY (TESTING PLAN)

**Tài liệu**: Chiến lược & Kế hoạch Kiểm thử Đa tầng  
**Mục tiêu chất lượng**: Đảm bảo 100% tính đúng đắn của logic nghiệp vụ, bảo mật RBAC và trải nghiệm người dùng  
**Phiên bản**: 2.0  
**Kỹ sư phụ trách**: Lead QA Automation Engineer & Tech Lead  

---

## 1. MÔ HÌNH THÁP KIỂM THỬ (TESTING PYRAMID)

Hệ thống áp dụng chiến lược kiểm thử đa tầng từ đơn vị tới tổng thể:

```
                  / \
                 / E \       End-to-End Tests (Playwright / Supertest E2E)
                /--2--\      - 154 Test Cases nghiệp vụ (TC-001 -> TC-154)
               /       \     - Kiểm tra toàn bộ luồng đăng ký, học tập, thu phí
              / Integration \   Integration & API Tests (Jest + Supertest)
             /---------------\  - Xác thực Token, RBAC 2 lớp, Transaction CSDL
            /      Unit       \ Unit Tests (Jest / Vitest)
           /-------------------\- Validation logic, Anonymizer, HMAC Token, Thuật toán
```

---

## 2. PHÂN LOẠI CÁC BÀI KIỂM THỬ TỰ ĐỘNG

### 2.1. Kiểm thử Đơn vị (Unit Tests)
- **Logic Tài chính**: Kiểm tra tính toán học phí, chính sách chiết khấu, phụ thu và tỷ lệ lấp đầy lớp.
- **Thuật toán Xếp lịch**: Kiểm tra tính toán ngày học loại trừ ngày lễ quốc gia, phát hiện xung đột phòng học.
- **Anonymizer Engine**: Kiểm tra đầu vào chứa PII thực tế được chuyển đổi 100% sang nhãn ẩn danh `[HS_1]`, `[PH_1]` trước khi gửi tới AI.
- **Mã hóa HMAC**: Kiểm tra sinh và xác minh mã QR điểm danh còn hạn trong 30 giây, từ chối mã giả mạo hoặc hết hạn.

### 2.2. Kiểm thử Tích hợp & API End-to-End (Supertest E2E)
Được ánh xạ trực tiếp theo 154 Test Cases trong tài liệu đặc tả `docs/CORELINK_MASTER.md`:
1. `health.e2e-spec.ts`: Kiểm tra kết nối cơ sở dữ liệu thật MySQL 8.4 LTS (TC-154).
2. `auth-rbac.e2e-spec.ts`: Kiểm tra 15 test cases (TC-024 đến TC-038) về tạo tài khoản, đổi mật khẩu lần đầu, khóa tài khoản sau 5 lần sai, xác thực 2FA của Admin và kiểm tra truy cập chéo dữ liệu.
3. `public-leads.e2e-spec.ts`: Kiểm tra 14 test cases (TC-001 đến TC-008, TC-015 đến TC-020) về phễu tuyển sinh, chuẩn hóa số điện thoại, đăng ký học thử và chuyển đổi Lead thành học viên.
4. `ai-chatbot.e2e-spec.ts`: Kiểm tra 6 test cases và bộ **30 câu hỏi bẫy** thử thách Chatbot RAG (chống chèn lệnh, chống cam kết điểm, chống bịa học phí).
5. `academic.e2e-spec.ts`: Kiểm tra 12 test cases (TC-039 đến TC-050) về sinh lịch học, kiểm tra va chạm lịch 3 chiều và quy trình ghi danh.
6. `attendance.e2e-spec.ts`: Kiểm tra 15 test cases (TC-051 đến TC-065) về quét mã QR động, xác thực tọa độ GPS 150m cơ sở và gửi thông báo vắng mặt.
7. `assessment.e2e-spec.ts`: Kiểm tra 17 test cases (TC-076 đến TC-091, TC-098) về làm bài thi trắc nghiệm, tính giờ đếm ngược, nộp bài tự động và chống nộp đúp.
8. `finance-admin.e2e-spec.ts`: Kiểm tra 24 test cases về thu học phí, cấp biên nhận tuần tự không trùng lặp và tính bảng lương giáo viên.

### 2.3. Kiểm thử Giao diện & Tiếp cận (UI & Accessibility Tests)
- **Responsive Testing**: Kiểm thử khả năng hiển thị hoàn hảo trên các độ phân giải:
  - Mobile nhỏ: 360px (Samsung Galaxy / iPhone SE) — Không bị vỡ khung, không cuộn ngang.
  - Tablet: 768px (iPad Mini / Portrait).
  - Desktop: 1280px và 1920px (Full HD).
- **Accessibility (WCAG 2.2 AA)**:
  - Kiểm tra tỷ lệ tương phản chữ/nền tối thiểu 4.5:1.
  - Kiểm tra đầy đủ nhãn `aria-label`, khả năng điều hướng bàn phím bằng phím `Tab` và `Enter`.

---

## 3. QUY TRÌNH CHẠY KIỂM THỬ TRONG CI/CD PIPELINE

Mọi thay đổi mã nguồn trước khi tích hợp vào nhánh chính đều phải vượt qua bộ lệnh tiêu chuẩn:
```powershell
# 1. Kiểm tra tĩnh kiểu dữ liệu TypeScript
pnpm typecheck

# 2. Chạy bài kiểm thử đơn vị
pnpm test

# 3. Chạy bài kiểm thử tích hợp API & Database
pnpm --filter @corelink/api test:e2e

# 4. Kiểm tra khả năng build production
pnpm build
```
Chỉ khi toàn bộ các bước trên trả về mã thoát `0` (Exit code 0), phiên làm việc mới được coi là đạt tiêu chuẩn bàn giao.
