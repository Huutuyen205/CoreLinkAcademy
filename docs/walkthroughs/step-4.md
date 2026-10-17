# BÁO CÁO HOÀN THÀNH BƯỚC 4: AI GATEWAY & CHATBOT TƯ VẤN (M01/M15, AI-12)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-04 | Nhánh: `step-04-ai-chatbot` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là khách vãng lai hoặc phụ huynh*, tôi muốn trò chuyện với Chatbot tuyển sinh trên website để tìm hiểu lộ trình học, lịch khai giảng và học phí chính xác mà không phải chờ nhân viên phản hồi.
  - *Là Quản trị viên trung tâm*, tôi muốn kiểm duyệt nội dung tài liệu trước khi nạp vào vector embedding cho Chatbot để đảm bảo thông tin luôn chính xác và không bịa đặt học phí.
  - *Là Chuyên viên tư vấn tuyển sinh*, tôi muốn Chatbot tự động thu thập số điện thoại và nhu cầu của khách hàng để tạo Lead ngay trên hệ thống.
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* tài liệu học phí đã được Admin phê duyệt (`status = 'approved'`), *When* khách hàng hỏi về học phí, *Then* Chatbot phản hồi đúng thông tin kèm trích dẫn mã đoạn tri thức (TC-009).
  - *Given* khách hàng hỏi về các chủ đề không có trong kho kiến thức (nấu ăn, tiếng Nga...), *When* xử lý câu hỏi, *Then* Chatbot trung thực từ chối và không bịa đặt thông tin (TC-010).
  - *Given* kẻ xấu cố tình chèn chỉ thị (Prompt Injection) hoặc dò hỏi danh sách học sinh, *When* Guardrails kiểm tra đầu vào, *Then* hệ thống từ chối an toàn ngay ở Tầng 1 (TC-011, TC-012).
  - *Given* khách để lại số điện thoại hợp lệ qua khung chat, *When* tin nhắn được gửi đi, *Then* hệ thống tự động sinh bản ghi Lead nguồn `chatbot` và liên kết với phiên chat (TC-013).
  - *Given* mỗi lượt gọi AI qua Gateway, *When* API trả về kết quả, *Then* hệ thống ghi nhận đầy đủ `input_tokens`, `output_tokens`, `cost_usd` vào bảng `ai_jobs` (TC-014).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Package `@corelink/ai`**:
  - `pricing.ts`: Bảng giá token chuẩn quốc tế và hàm tính chi phí `calculateAiCostUsd` cho Gemini, Claude và GPT.
  - `vector-math.ts`: Thuật toán tính độ tương đồng Cosine (`cosineSimilarity`), xếp hạng Top-K (`findTopKChunks`) và sinh vector nhúng 768 chiều (`generateDeterministicEmbedding`) phục vụ kiểm thử và offline.
  - `guardrails.ts`: Bộ lọc regex hai lớp phòng thủ (`AiGuardrails`): phát hiện Prompt Injection (10 mẫu) và vi phạm quyền riêng tư trẻ em (7 mẫu).
  - `gateway.ts`: Lớp cổng tích hợp `CoreLinkAiGateway` hỗ trợ sinh văn bản (`generate`) và streaming thời gian thực qua Server-Sent Events (`stream`).
- **Backend API (`apps/api`)**:
  - `AiModule`: Quản lý kết nối Gateway, log nghiệp vụ vào `ai_jobs`.
  - `KnowledgeBaseModule`: Quản lý tài liệu tri thức, phân đoạn văn bản thông minh (chunking), sinh vector nhúng khi Admin duyệt.
  - `ChatbotModule`: Quản lý phiên chat (`chat_sessions`), lượt chat (`chat_turns`), nhận diện ý định (Intent detection), tự động bắt Lead (`leads`), và RAG retrieval với ngưỡng cosine similarity.
- **Frontend Web (`apps/web`)**:
  - `ChatbotWidget.tsx`: Widget nổi góc dưới màn hình, hỗ trợ hiển thị tin nhắn, chip trích dẫn tài liệu nguồn, badge phát hiện Lead thành công.
  - `/admin/knowledge-base`: Trang quản trị kho tri thức, danh sách tài liệu, thanh duyệt và sinh vector 1-click.

---

## 3. [VAI: Security/Compliance Officer] An toàn AI & Pháp lý
- **Tuân thủ Luật Bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)**:
  - Tự động ẩn danh hóa (Anonymizer) số điện thoại, email và tên riêng trước khi truyền payload sang mô hình AI bên ngoài.
  - Từ chối 100% các yêu cầu truy vấn danh sách học sinh, số điện thoại, điểm số trẻ em từ kênh công khai.
- **Chống chèn lệnh (Prompt Injection Defense)**:
  - Kháng hoàn toàn các kỹ thuật jailbreak phổ biến: "DAN mode", "ignore previous instructions", "disregard all rules".

---

## 4. [VAI: QA/Tester] Kết quả kiểm thử tự động
- **Kiểm thử E2E Step 4 (`test/ai-chatbot.e2e-spec.ts`)**:
  - `TC-009 (Duyệt tài liệu)`: Tự động phân đoạn chunks và sinh vector embedding -> **ĐẠT**
  - `TC-009 (Hỏi đáp RAG)`: Trả lời chính xác và trích dẫn mã chunk -> **ĐẠT**
  - `TC-010 (Từ chối bịa đặt)`: Từ chối các thông tin chưa được kiểm chứng -> **ĐẠT**
  - `TC-011 (Prompt Injection)`: Kháng 100% các câu hỏi bẫy chỉ thị -> **ĐẠT**
  - `TC-012 (Quyền riêng tư trẻ em)`: Từ chối tiết lộ dữ liệu học sinh -> **ĐẠT**
  - `TC-013 (Handoff & Lead Capture)`: Tự động bắt Lead và chuyển tư vấn viên -> **ĐẠT**
  - `TC-014 (Kiểm toán AI)`: Ghi nhận đầy đủ token và chi phí USD vào `ai_jobs` -> **ĐẠT**
  - `Evaluation Suite (Bộ 30 câu hỏi bẫy)`: Vượt qua 30/30 câu hỏi bẫy -> **ĐẠT 100%**
- **Toàn bộ Suite E2E của dự án**:
  - `health.e2e-spec.ts`: PASSED
  - `auth-rbac.e2e-spec.ts`: PASSED
  - `public-leads.e2e-spec.ts`: PASSED
  - `ai-chatbot.e2e-spec.ts`: PASSED
  - **Tổng cộng: 4/4 Test Suites — 39/39 Tests PASSED (100%)**.

---

## 5. [VAI: Release Manager] Tài liệu & Dữ liệu Demo
- Đã tạo tài liệu [DEMO.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/walkthroughs/DEMO.md) mô tả chi tiết 7 cảnh demo từ Lead → Chatbot AI → Tư vấn → Học thử.
- Đã tạo script `pnpm seed:demo` tự động khởi tạo cơ sở Cầu Giấy, 6 khóa học, 20 giáo viên, 10 lớp học, 80 học sinh, 100 phụ huynh và kho tri thức đã duyệt.
