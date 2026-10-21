# 08 — UI/UX và Design System

## 1. Hướng thiết kế

**Sáng, học thuật, tối giản.** Người dùng chính là phụ huynh (30–50 tuổi, dùng điện thoại), giáo viên (điểm danh nhanh giữa giờ) và học sinh. Ưu tiên: đọc rõ, ít lựa chọn trên một màn hình, thao tác chính luôn nằm trong tầm ngón cái.

Lý do chọn: học viện bán **niềm tin vào chất lượng dạy**, không bán sự hào nhoáng. Giao diện giống một tạp chí/học bạ được trình bày cẩn thận: chữ có chân cho tiêu đề, nền giấy ngà, một màu mực chủ đạo.

**Tránh** (theo DESIGN_QUALITY_NOT_AI): gradient tím/xanh, glassmorphism, emoji làm icon, card lồng card, bóng đổ dày, chữ số thống kê bịa ("10.000+ học viên"), badge "AI" trang trí.

## 2. Design tokens (nguồn sự thật: `src/app/globals.css`)

| Token | Giá trị | Vai trò |
|---|---|---|
| `--color-paper` | `#FAF8F3` | Nền trang |
| `--color-surface` | `#FFFFFF` | Bề mặt bảng/form |
| `--color-ink` | `#1C2430` | Chữ chính (tương phản 15:1 trên paper) |
| `--color-muted` | `#5A6472` | Chữ phụ (≥ 5.5:1) |
| `--color-line` | `#E3DED3` | Viền, kẻ bảng |
| `--color-primary` | `#1F3A5F` | Màu mực navy: nút chính, link, tiêu điểm |
| `--color-primary-strong` | `#152A46` | Hover/active |
| `--color-primary-soft` | `#E8EEF5` | Nền nhấn nhẹ |
| `--color-accent` | `#A4471E` | Điểm nhấn hiếm (gạch chân tiêu đề, số thứ tự) |
| `--color-success` | `#2F6B47` | Có mặt, đạt |
| `--color-warning` | `#8A5A00` | Muộn, quá hạn |
| `--color-danger` | `#A3261B` | Vắng, lỗi |

Kiểu chữ: **Source Serif 4** cho tiêu đề (hỗ trợ tiếng Việt), **Be Vietnam Pro** cho nội dung/UI. Thang: 14 / 16 (body) / 18 / 22 / 28 / 36 / 48. Line-height body 1.6.

Khoảng cách: bội số 4px. Bo góc 6px (input, nút), 10px (khối lớn). Viền 1px `--color-line` thay cho bóng đổ.

## 3. Bố cục

- Công khai: header mảnh (logo chữ "CoreLink Academy", Khóa học, Đăng ký học thử, Đăng nhập), nội dung tối đa 1120px, footer địa chỉ/liên hệ (TBD — QUESTION-Q02).
- Nội bộ: trên ≥ 1024px sidebar trái 240px; dưới 1024px thanh trên + menu ngăn kéo. Học sinh/phụ huynh/giáo viên trên điện thoại có thanh điều hướng đáy ≤ 4 mục.
- Bảng dữ liệu trên điện thoại chuyển thành danh sách dòng (không cuộn ngang).

## 4. Component (src/components/ui)

Button/ButtonLink (primary / secondary / ghost / danger; size sm/md), SubmitButton (tự đổi "Đang lưu…"), TextField / SelectField / TextareaField / CheckboxField (label + hint + error, `aria-describedby`), Badge (trạng thái), DataTable (bảng ≥768px, danh sách dòng trên điện thoại), Pagination, EmptyState, PageHeader, Card, Alert, PageSkeleton.

Form: `components/forms/ConfigForm` dựng form từ cấu hình (lỗi từng ô, giữ giá trị khi lỗi, `useId` tránh trùng id, xác nhận trước thao tác khó hoàn tác). Form đặc thù: điểm danh, câu hỏi, làm bài, chấm bài, chuyển lead, tạo người dùng.

## 5. Trạng thái bắt buộc

| Trạng thái | Cách thể hiện |
|---|---|
| Loading | `loading.tsx` dạng khung xám tĩnh; nút submit đổi chữ "Đang lưu…" và disabled |
| Empty | EmptyState: một câu mô tả + hành động tiếp theo (nếu có quyền) |
| Error | Alert danger trên form + lỗi dưới từng ô (`aria-describedby`) |
| Success | Alert success hoặc chuyển trang kèm thông báo |
| Permission denied | Trang 404/403 lịch sự, có link về tổng quan |

## 6. Trạng thái màu theo nghiệp vụ

Có mặt = success · Muộn = warning · Vắng = danger · Có phép = muted. Lead NEW quá hạn = warning. Luôn kèm chữ, không chỉ dùng màu.

## 7. Khả năng tiếp cận

Focus ring 2px `--color-primary` offset 2px; mọi ô nhập có `<label>`; nhóm radio điểm danh dùng `fieldset/legend`; vùng chạm ≥ 44px trên điện thoại; tôn trọng `prefers-reduced-motion` (không có animation trang trí).
