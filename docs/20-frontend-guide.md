# 20 — Hướng dẫn Frontend (Web)

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) |
| Owner | Trợ lý (Frontend + Technical Writer) · Phê duyệt: chủ dự án |
| Áp dụng cho | `src/app/**`, `src/components/**`, `src/app/globals.css` |

## 1. Purpose and scope
Cách xây màn hình mới đúng design system, đúng trạng thái và không phá vỡ phân quyền. Logic nghiệp vụ không nằm ở FE (NFR-012) — xem [21](21-backend-guide.md).

## 2. Toolchain
Next.js 15 App Router · React 19 (`useActionState`, `useFormStatus`) · TypeScript strict · Tailwind CSS 4 (`@theme` trong `globals.css`) · `next/font` (Be Vietnam Pro, Source Serif 4) · không dùng thư viện UI ngoài, không icon font.

## 3. Routing và khu vực

| Khu | Thư mục | Shell | Cổng quyền |
|---|---|---|---|
| Công khai | `src/app/(public)/` | `PublicShell` (header, footer, skip link) | Không |
| Đổi mật khẩu | `src/app/doi-mat-khau/` | Riêng (tối giản) | `requireActor({ allowPasswordChange: true })` |
| Quản lý | `src/app/quan-ly/` | `AppShell` + `managementNav(role)` | `requireRole("ADMIN","STAFF")` ở layout **và** mỗi page; trang chỉ Admin gọi `requireRole("ADMIN")` |
| Giáo viên / Học sinh / Phụ huynh | `src/app/giao-vien/`, `hoc-sinh/`, `phu-huynh/` | `AppShell` + nav + `bottomNav` | `requireRole("TEACHER" / "STUDENT" / "PARENT")` |

Tên route tiếng Việt không dấu, gạch nối (`/quan-ly/lop/moi`). Tham số query tiếng Việt ngắn: `mon`, `khoi`, `tuan`, `con`, `lop`, `quahan`, `thongbao`, `page`, `q`.

## 4. Mẫu một trang nội bộ (Server Component)

```tsx
// src/app/quan-ly/vi-du/[id]/page.tsx
import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { getSomething } from "@/server/<domain>/service";
import { PageHeader, EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Tên trang" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");          // 1. cổng quyền ở chính trang
  const data = await orNotFound(getSomething(actor, (await params).id)); // 2. đọc qua service (sai phạm vi → 404)
  return (
    <>
      <PageHeader title="…" description="…" />
      {data.items.length === 0 ? <EmptyState message="…" /> : /* 3. luôn có trạng thái rỗng */ null}
    </>
  );
}
```

Quy tắc: không import `db` trong page; không tin `searchParams` — kiểm tra enum/độ dài trước khi truyền service (xem `quan-ly/lead/page.tsx`); dùng `parsePage` cho `?page=`.

## 5. Mẫu form

### 5.1 Form cấu hình (`ConfigForm`) — ưu tiên cho form CRUD đơn giản

```tsx
<ConfigForm
  action={someAction}                 // (state, formData) => Promise<ActionState>
  hidden={{ classId: klass.id }}      // id ẩn — server vẫn kiểm tra phạm vi
  submitLabel="Lưu"
  columns={2}
  confirm="Thao tác khó hoàn tác? Tiếp tục?"   // chỉ khi phá hủy/không hoàn tác
  fields={[
    { type: "text", name: "code", label: "Mã lớp", required: true, maxLength: 30, hint: "Ví dụ: TOAN9-K1" },
    { type: "select", name: "teacherId", label: "Giáo viên", required: true, placeholder: "Chọn", options },
    { type: "checkbox", name: "isPublished", label: "Xuất bản", defaultChecked: true },
  ]}
/>
```
`ConfigForm` lo: lỗi chung (`FormMessage` + `details`), lỗi từng ô, giữ giá trị khi lỗi (kể cả checkbox khi action trả `values[name] = "on" | ""`), `useId` để nhiều form một trang không trùng id, nút pending.

### 5.2 Form riêng (client component)
Dùng khi form có hành vi động (đổi loại câu hỏi, lọc khóa theo môn, nhiều nút intent):

```tsx
"use client";
const [state, action] = useActionState(myAction, initialActionState);
const e = state.fieldErrors ?? {};
const v = state.ok ? {} : (state.values ?? {});   // React 19 reset form sau action → điền lại từ values
<form action={action} noValidate>
  <FormMessage state={state} />
  <TextField name="title" label="Tên" required defaultValue={v.title ?? initial?.title} error={e.title} />
  <SubmitButton>Lưu</SubmitButton>
</form>
```
Bắt buộc: `noValidate` (dùng thông điệp server tiếng Việt), `label` cho mọi ô, `maxLength` khớp schema server, không đặt `defaultValue` cho ô mật khẩu.

### 5.3 Kết quả có dữ liệu một lần (mật khẩu tạm)
Hiển thị bằng `CredentialsNotice` ngay từ `state` của lần gửi; không lưu vào URL/localStorage.

## 6. Trạng thái bắt buộc (docs/08 §3, §7)

| Trạng thái | Cách làm |
|---|---|
| Loading | `loading.tsx` dùng `PageSkeleton`; nút `SubmitButton` đổi nhãn + disabled |
| Empty | `EmptyState` (một câu + hành động nếu có quyền) |
| Validate / nghiệp vụ | `FormMessage` + `error` từng ô |
| Thành công | `Alert` success trong form hoặc `redirect(...?thongbao=<mã>)` + `Flash` (thêm mã vào `components/layout/flash.tsx`) |
| Không quyền | Không tự xử lý ở FE — server chuyển hướng hoặc 404 |
| Chỉ đọc | Ẩn form, hiện dữ liệu + `Alert` giải thích lý do |

## 7. Responsive và accessibility
- Mobile-first; kiểm 360px. Bảng dùng `DataTable` (tự chuyển danh sách < 768px). Không cuộn ngang trang; ngoại lệ phải nằm trong khung `overflow-x-auto` có `caption`.
- Vùng chạm ≥ 44px (`min-h-11`); nút dính đáy dùng `sticky bottom-16 lg:bottom-0` khi có thanh đáy.
- Nhóm radio/checkbox: `fieldset` + `legend`. Trạng thái dùng `Badge` có chữ.
- Màu chỉ lấy từ token (`text-primary`, `border-line-strong`…). Viền ô nhập dùng `line-strong` (WCAG 1.4.11); `line` chỉ cho đường kẻ trang trí.
- Không animation trang trí; không emoji/icon thay chữ.

## 8. Thêm một màn hình mới — từng bước
1. Kiểm FR trong docs/01 (không có → ghi 05 §5, dừng).
2. Thêm SCREEN vào docs/08 §3 (route, actor, trạng thái) và portal tương ứng.
3. BE: service đọc + action (docs/21 §8).
4. Tạo `page.tsx` theo §4; form theo §5.
5. Thêm mục điều hướng ở `components/layout/nav-config.ts` nếu cần (BottomNav tối đa 4 mục).
6. Kiểm 360px + bàn phím; chạy `pnpm typecheck; pnpm lint; pnpm build`.
7. Cập nhật docs/16 và PROGRESS.

## 9. Do / Don't

| Do | Don't |
|---|---|
| Đọc dữ liệu qua service nhận `actor` | `import { db }` trong component |
| Truyền cho client chỉ dữ liệu cần hiển thị (vd `toStudentQuestion`) | Truyền nguyên object Prisma có đáp án/hash xuống client |
| Thông điệp từ server, tiếng Việt | Hard-code lỗi tiếng Anh ở client |
| `confirm` cho thao tác không hoàn tác | Hỏi xác nhận cho mọi thao tác |
| Token màu | Mã màu hex trong className |
