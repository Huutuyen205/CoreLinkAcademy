# HỆ THỐNG THIẾT KẾ GIAO DIỆN — CORELINK ACADEMY (DESIGN SYSTEM)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: UI/UX Designer & Design-System Engineer  

---

## 1. ĐỊNH HƯỚNG THẨM MỸ & BẢN SẮC THƯƠNG HIỆU GIÁO DỤC

Thiết kế giao diện CoreLink Academy định vị hình ảnh một tổ chức giáo dục chuẩn quốc tế: **Hiện đại, thân thiện, sáng sủa, đáng tin cậy và có chiều sâu học thuật**.

### 1.1. Nguyên tắc "Nói KHÔNG" với Giao diện AI Rập khuôn
- **Tuyệt đối tránh**:
  - Không lạm dụng nền tối cyberpunk (`#060911`), gradient tím/xanh điện và hiệu ứng phát sáng neon (glow) tràn lan.
  - Không lạm dụng glassmorphism mờ mịt gây khó đọc văn bản học thuật.
  - Không nhồi nhét các khối thẻ (card) rỗng vô nghĩa hoặc chỉ số thống kê giả lập.
  - Không sử dụng biểu tượng robot, mạng neuron hoặc emoji làm biểu tượng chính.
- **Tập trung vào**:
  - Bố cục thông thoáng, thứ bậc thị giác (visual hierarchy) rõ ràng, khoảng trắng hợp lý.
  - Tối ưu hóa khả năng đọc (Readability) trên mọi thiết bị, đặc biệt là bảng điểm, bài tập và giáo trình.

---

## 2. HỆ THỐNG DESIGN TOKENS CHUẨN MỰC

### 2.1. Bảng màu Thương hiệu Giáo dục (Color Tokens)
| Tên Token | Mã màu Hex | Ý nghĩa & Vai trò sử dụng |
|---|---|---|
| `--background` | `#F7F9FC` | Màu nền canvas tổng thể toàn hệ thống, tạo cảm giác sáng sủa và dễ chịu cho mắt |
| `--surface` | `#FFFFFF` | Nền các thẻ nội dung (Card), bảng điều khiển, modal và form nhập liệu |
| `--surface-hover` | `#F8FAFC` | Trạng thái di chuột nhẹ trên thẻ hoặc dòng bảng dữ liệu |
| `--primary` | `#2563EB` | Xanh dương giáo dục chuẩn mực: Dành cho nút hành động chính, tiêu đề nhấn mạnh |
| `--primary-hover` | `#1D4ED8` | Trạng thái hover của nút chính |
| `--primary-light` | `#EFF6FF` | Nền nhạt cho các huy hiệu (Badge) hoặc khối thông tin liên quan khóa học |
| `--secondary` | `#0F9D8A` | Xanh ngọc phát triển: Thể hiện sự tiến bộ học tập, tỷ lệ chuyên cần, điểm số tốt |
| `--secondary-light` | `#F0FDF4` | Nền trạng thái thành công nhẹ |
| `--accent` | `#F4B942` | Vàng ấm: Điểm nhấn học bổng, ưu đãi tuyển sinh, cảnh báo quan trọng |
| `--foreground` | `#172033` | Màu chữ chính (Slate Navy), độ tương phản cao đạt chuẩn WCAG 2.2 AA |
| `--text-muted` | `#64748B` | Màu chữ phụ, mô tả ngắn, nhãn thời gian |
| `--border` | `#E2E8F0` | Đường viền mảnh, tinh tế phân chia các khối nội dung |

### 2.2. Phông chữ & Thứ bậc Văn bản (Typography Tokens)
- **Font nội dung (Sans-serif)**: `Plus Jakarta Sans`, sans-serif (Hỗ trợ tiếng Việt hoàn hảo, nét chữ hiện đại, rõ ràng).
- **Font tiêu đề (Heading)**: `Outfit`, sans-serif (Tạo điểm nhấn mạnh mẽ, đẳng cấp cho các khối tiêu đề H1 - H3).
- **Type Scale**:
  - H1: `2.5rem` - `3rem` (40px - 48px), `font-extrabold`, `tracking-tight`
  - H2: `1.875rem` - `2.25rem` (30px - 36px), `font-bold`
  - H3: `1.25rem` - `1.5rem` (20px - 24px), `font-bold`
  - Body: `0.875rem` - `1rem` (14px - 16px), `font-normal`, `leading-relaxed`
  - Caption / Helper: `0.75rem` (12px), `text-slate-500`

### 2.3. Bo góc, Đổ bóng & Khoảng cách (Shape & Elevation Tokens)
- **Bo góc (Border Radius)**:
  - Nút bấm & Input: `rounded-xl` (12px)
  - Khối Card & Modal: `rounded-2xl` - `rounded-3xl` (16px - 24px)
  - Huy hiệu (Badge): `rounded-full` (9999px)
- **Đổ bóng (Box Shadow)**:
  - Thẻ mặc định: `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05)`
  - Thẻ hover: `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07)` kết hợp nâng nhẹ `transform: translateY(-2px)`

---

## 3. DANH MỤC COMPONENT DÙNG CHUNG (UI COMPONENT CATALOG)

1. **Card ([card.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/components/ui/card.tsx))**: Khối chứa thông tin nền trắng `#FFFFFF`, viền `#E2E8F0`, phân chia Header, Content, Footer rõ ràng.
2. **Button ([button.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/components/ui/button.tsx))**: Các biến thể `primary` (xanh dương), `secondary` (xanh ngọc), `outline` (viền mảnh), `ghost`, `destructive` (đỏ), có trạng thái loading tích hợp.
3. **Input ([input.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/components/ui/input.tsx))**: Ô nhập liệu chuẩn với nhãn trên, hiển thị lỗi đỏ bên dưới và focus ring xanh dương dịu mắt.
4. **Badge ([badge.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/components/ui/badge.tsx))**: Huy hiệu thể hiện cấp độ (IELTS 6.5+, Starters), trạng thái lớp (Đang học, Hoàn thành, Mở tuyển sinh).
5. **Navigation ([navigation.tsx](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/apps/web/src/components/ui/navigation.tsx))**: Thanh điều hướng trên máy tính với hiệu ứng mờ nhẹ và thanh tab điều hướng cố định dưới đáy (Bottom Nav) cho điện thoại di động (360px+).

---

## 4. TIÊU CHUẨN TIẾP CẬN & RESPONSIVE (ACCESSIBILITY & RESPONSIVE)

1. **Mobile-First Responsive (360px+)**:
   - Giao diện được kiểm thử từ kích thước màn hình nhỏ nhất 360px (Samsung Galaxy / iPhone SE).
   - Tuyệt đối không để xảy ra hiện tượng cuộn ngang màn hình trên thiết bị di động.
   - Các bảng dữ liệu lớn tự động chuyển đổi sang dạng thẻ danh sách hoặc có thanh cuộn ngang cục bộ có chỉ dẫn.
2. **Chuẩn Tiếp cận WCAG 2.2 AA**:
   - Đảm bảo tỷ lệ tương phản chữ trên nền tối thiểu 4.5:1 đối với văn bản thông thường và 3:1 đối với tiêu đề lớn.
   - Hỗ trợ đầy đủ điều hướng bằng bàn phím (Phím Tab, Enter, Space). Mọi trường nhập liệu đều có `aria-label` và `htmlFor` liên kết nhãn.
