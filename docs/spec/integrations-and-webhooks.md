# TÍCH HỢP DỊCH VỤ NGOÀI & XỬ LÝ WEBHOOK — CORELINK ACADEMY (INTEGRATIONS & WEBHOOKS)

**Dự án**: CoreLink Academy  
**Tiêu chuẩn áp dụng**: Webhook Engineer Best Practices, Idempotent Processing, Signature Verification  
**Phiên bản**: 2.0  
**Tác giả**: Integration Engineer & Security Engineer  

---

## 1. KIẾN TRÚC TÍCH HỢP & NGUYÊN TẮC ADAPTER (INTEGRATION ARCHITECTURE)

Hệ thống tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns). Mọi dịch vụ bên ngoài đều được bọc qua các lớp Adapter/Interface để logic nghiệp vụ trung tâm không bị gắn cứng vào bất kỳ nhà cung cấp cụ thể nào:

```
[Business Core Services]
         │
         ▼
[Integration Adapter Layer]
 ├─► PaymentGatewayAdapter (VietQR, VNPay, Chuyển khoản thủ công)
 ├─► NotificationProviderAdapter (Mailpit Dev, SendGrid, WebPush)
 ├─► StorageProviderAdapter (MinIO S3 Compatible Client)
 └─► AiProviderAdapter (Claude 3.5 Sonnet, Gemini 1.5 Flash)
```

---

## 2. NGUYÊN TẮC BẢO MẬT & XỬ LÝ WEBHOOK (WEBHOOK RECEIVER SPECIFICATION)

Đối với các sự kiện Webhook nhận từ đối tác (ví dụ cổng thanh toán hoặc ngân hàng):

### 2.1. Xác thực Chữ ký trên Raw Request Body
- Bắt buộc kiểm tra chữ ký điện tử (HMAC-SHA256) trên **Raw Buffer** của request body trước khi thực hiện parse sang JSON:
  ```ts
  const rawBody = req.rawBody;
  const signature = req.headers['x-provider-signature'];
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  ```
- Sử dụng hàm so sánh an toàn `crypto.timingSafeEqual` để chống tấn công phân tích thời gian (Timing Attacks).

### 2.2. Xử lý Chống Trùng lặp & Tính Bất Biến (Idempotency & Deduplication)
- Mọi sự kiện Webhook gửi đến đều có mã định danh `provider_event_id`.
- Hệ thống kiểm tra trong bảng `webhooks_log`. Nếu sự kiện đã được xử lý thành công trước đó:
  - Trả về ngay lập tức mã `200 OK`.
  - Tuyệt đối không ghi nhận cộng tiền hoặc cập nhật trạng thái hóa đơn lần thứ hai.

### 2.3. Xử lý Sự kiện Đến Sai Thứ tự (Out-of-Order Events)
- Kiểm tra dấu thời gian hoặc số tuần tự (`sequence_number`) của sự kiện so với trạng thái hiện tại của hóa đơn. Không bao giờ cho phép một sự kiện cũ ghi đè lên trạng thái mới hơn (ví dụ sự kiện `PAYMENT_PENDING` đến muộn không được ghi đè trạng thái `PAID`).

---

## 3. TRẠNG THÁI CỦA CÁC TÍCH HỢP HIỆN TẠI

| Dịch vụ tích hợp | Nhà cung cấp | Trạng thái hiện tại | Giải pháp thay thế / Fallback |
|---|---|---|---|
| **Cơ sở dữ liệu** | MySQL 8.4 LTS | **Hoàn thành — đã kết nối** | Kết nối trực tiếp tại `localhost:3306` |
| **Lưu trữ Tệp tin** | MinIO S3 Compatible | **Hoàn thành — đã kết nối** | Presigned URL cục bộ tại `localhost:9000` |
| **Gửi Email** | Mailpit (Dev) | **Hoàn thành — đã kết nối** | Bắt toàn bộ email thử nghiệm tại `localhost:8025` |
| **Trí tuệ Nhân tạo (AI)**| Claude 3.5 & Gemini 1.5 | **Hoàn thành — có Mock & Budget Guard** | Chạy mock tự động khi chưa có API Key, hạn mức $150/tháng |
| **Cổng thanh toán** | VietQR / VNPay | **Chưa cấu hình Secret thật** | Hỗ trợ quét mã VietQR tĩnh và ghi nhận đối soát thủ công có chứng từ |
| **Tin nhắn SMS** | Twilio / eSMS | **Chưa cấu hình** | Hiển thị thông báo in-app và Web Push trên trình duyệt |
