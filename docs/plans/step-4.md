# Kế Hoạch Thiết Kế BƯỚC 4: AiGateway & Chatbot Tư Vấn (M01/M15, AI-12)

## 1. Phân tích Nghiệp vụ (BA)
- **Mục tiêu**: Xây dựng cổng AI trung tâm (`AiGateway`), hệ thống RAG (Retrieval-Augmented Generation) quản lý kho kiến thức và chatbot tư vấn tuyển sinh trực tuyến (S03) hoạt động theo thời gian thực (SSE), tuân thủ tiêu chuẩn an toàn AI nghiêm ngặt.
- **User Stories**:
  - *US-01 (Chatbot tư vấn khách hàng)*: Là khách truy cập website, tôi muốn trò chuyện với trợ lý ảo CoreLink để được giải đáp thắc mắc về khóa học, học phí, lịch học và đăng ký học thử ngay trong chat.
  - *US-02 (RAG & Trích nguồn)*: Là người dùng, tôi muốn chatbot trả lời chính xác dựa trên thông tin chính thống của trung tâm và trích dẫn rõ nguồn tài liệu, không trả lời lan man hoặc bịa đặt.
  - *US-03 (Chống tấn công & Bảo vệ dữ liệu)*: Chatbot phải kháng 100% các cuộc tấn công Prompt Injection, từ chối tiết lộ thông tin cá nhân của trẻ em và tuân thủ giới hạn phạm vi giáo dục.
  - *US-04 (Quản lý kho kiến thức)*: Là Admin, tôi muốn tải lên tài liệu, tự động phân đoạn (chunking), sinh vector embedding và kiểm duyệt trước khi đưa vào kho tri thức của Chatbot.
  - *US-05 (Chuyển tiếp Tư vấn viên)*: Khi khách hàng có nhu cầu xếp lớp hoặc câu hỏi phức tạp, chatbot tự động thu thập SĐT, tạo Lead và chuyển tiếp đến tư vấn viên con người.
  - *US-06 (Kiểm soát chi phí & Audit)*: Mọi tác vụ gọi AI đều được ghi vết vào `ai_jobs`, tính toán chi phí USD theo bảng giá và kiểm soát hạn mức ngân sách tháng.

---

## 2. Thiết kế Kỹ thuật (Tech Lead)
### 2.1 Cấu trúc Module & Package
- `packages/ai`:
  - `pricing.ts`: Bảng giá token cho Anthropic (Sonnet 3.5, Haiku 3.5), Google (Gemini Flash, Text-Embedding-004), tính toán `cost_usd`.
  - `prompts/chatbot.md`: Prompt hệ thống cho Chatbot tuyển sinh CoreLink Academy.
  - `gateway.ts`: Lớp `CoreLinkAiGateway` triển khai `AiGateway` interface, tích hợp cơ chế fallback, tính cosine similarity vector ở tầng ứng dụng, stream SSE.
  - `guardrails.ts`: Bộ lọc tiền xử lý & hậu xử lý chống Prompt Injection, kiểm tra an toàn dữ liệu trẻ em và phát hiện ý định (intent detection).
- `apps/api`:
  - `modules/ai`:
    - `ai.service.ts`: Wrapper gọi AiGateway, ghi nhận `ai_jobs`, theo dõi hạn mức chi phí chi nhánh.
    - `knowledge-base.service.ts` & `knowledge-base.controller.ts`: CRUD tài liệu `kb_documents`, duyệt tài liệu, chunking và lưu vector `kb_chunks`.
    - `chatbot.service.ts` & `chatbot.controller.ts`: Endpoint `/api/v1/chatbot/chat` (hỗ trợ SSE stream và JSON), quản lý `chat_sessions`, `chat_turns`, chuyển đổi sang Lead.
- `apps/web`:
  - `components/chatbot/ChatbotWidget.tsx`: Nút chat tròn nổi ở góc dưới mọi màn hình công khai (`S03`), giao diện chat glassmorphism, hiển thị nguồn trích dẫn, nút gọi tư vấn viên và form đăng ký nhanh.
  - `app/(staff)/admin/knowledge-base/page.tsx`: Màn hình Admin quản lý kho tri thức, tạo tài liệu, xem các đoạn chunk và duyệt xuất bản.

---

## 3. Ma trận Kiểm thử (Tester)
- **TC-009**: Chatbot trả lời đúng từ kho tri thức và có trích nguồn chunk (`citedChunkIds`).
- **TC-010**: Chatbot từ chối thông tin ngoài phạm vi hoặc chưa kiểm duyệt.
- **TC-011**: Kháng 100% các câu hỏi Prompt Injection bẫy hệ thống.
- **TC-012**: Bảo vệ quyền riêng tư học sinh, không tiết lộ PII.
- **TC-013**: Nhận diện ý định đăng ký học và tự động tạo Lead / chuyển tư vấn viên.
- **TC-014**: Ghi chép đầy đủ chi phí, token, latency vào `ai_jobs`.
- **Suite 30 câu hỏi bẫy**: Đánh giá tự động theo Phần B6.

---

## 4. Dữ liệu Demo 23/10/2026
- Script seed mẫu: `pnpm seed:demo` tạo 1 cơ sở, 6 khóa học, 10 lớp, 20 giáo viên, 80 học sinh, 100 phụ huynh, kho tài liệu kiến thức phong phú.
- Tài liệu tổng kết: `docs/walkthroughs/DEMO.md`.
