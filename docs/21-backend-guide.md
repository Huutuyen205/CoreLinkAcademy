# 21 — Hướng dẫn Backend và Coding Guide

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) |
| Owner | Trợ lý (Backend + Tech Lead + Technical Writer) · Phê duyệt: chủ dự án |
| Áp dụng cho | `src/server/**`, `src/lib/**`, `prisma/**` |

## 1. Purpose and scope
Mẫu chuẩn để viết nghiệp vụ, Server Action, truy vấn và test sao cho **mọi đường đều kiểm quyền phía server**, lỗi có cấu trúc, dữ liệu nhất quán.

## 2. Toolchain
Node ≥ 22 · pnpm 9 · TypeScript 5 strict · Prisma 6 (MySQL 8) · Zod 3 · `@node-rs/argon2` · `date-fns` 4 + `@date-fns/tz` · Vitest 3.

## 3. Cấu trúc và trách nhiệm
Xem [09 component §1–3](09-architecture/component-architecture.md). Mỗi domain: `rules.ts` (thuần) · `schemas.ts` (Zod dùng lại) · `service.ts` (nghiệp vụ + quyền + Prisma) · `actions.ts` (`"use server"`, mỏng).

## 4. Dependency rules
1. `rules.ts`, `src/lib/**`: thuần, có unit test, nhận `now` làm tham số khi phụ thuộc thời gian.
2. `service.ts`: tham số đầu là `actor: Actor` (trừ dữ liệu công khai); gọi `assertCan` / hàm scope **trước** khi đọc dữ liệu nhạy cảm.
3. `actions.ts`: chỉ `requireRole` → `formFields` → `parseForm` → `runAction` → `revalidatePath`/`redirect`. Không chứa quy tắc nghiệp vụ.
4. Không import `next/*` trong service (trừ `cookies`/`headers` trong `auth/session.ts`, `request.ts`).

## 5. Naming, types, lint
- Hàm động từ: `createClass`, `listLeads`, `getLead`, `assertCanViewClass`. Action: `<verb><Noun>Action`.
- Mã lỗi `UPPER_SNAKE`; thông điệp tiếng Việt cho người dùng cuối.
- Không dùng `any`; JSON từ DB đọc qua hàm kiểm kiểu (`jsonStrings`, `asSyllabus`).
- Comment ghi ID yêu cầu: `/** API-013 — FR-019. */`, `// BR-020`.

## 6. Errors, validation, logging
- Validate input bằng Zod ở action (`parseForm`), giới hạn độ dài mọi chuỗi, id 1–40.
- Lỗi nghiệp vụ: `throw new DomainError(code, messageVi, fieldErrors?, details?)`.
- Không tồn tại / sai phạm vi: `throw new ForbiddenError()` (→ 404, ADR-004). Không phân biệt hai trường hợp.
- Lỗi unique Prisma (`P2002`): bắt bằng `isUniqueViolation(error, field)` → `DomainError` thân thiện. Khóa ngoại (`P2003`, xóa trong lúc bản ghi vừa được tham chiếu): `isForeignKeyViolation` → cùng thông báo "đang được dùng". Không tồn tại khi cập nhật (`P2025`): `isRecordNotFound` → `ForbiddenError`.
- Không `console.log` dữ liệu người dùng; không log mật khẩu/token/PII (NFR-006).

## 7. AuthN, AuthZ, privacy, secrets
- Trang/action nội bộ: `requireRole(...roles)`; đổi mật khẩu: `requireActor({ allowPasswordChange: true })`.
- Quyền theo vai trò: `assertCan(actor, "permission.key")` — thêm key mới vào `PERMISSIONS` trong `policy.ts` + docs/03 §4 + unit test.
- Phạm vi: dùng/viết hàm trong `auth/scope.ts`; với GV phân biệt GV chính (`assertTeacherOwnsClass`) và GV dạy thay (`assertCanViewClass`).
- **Không tin field ẩn**: đối chiếu id gửi lên với DB (vd lọc `studentIds` theo ghi danh của lớp; `answerId` phải thuộc submission).
- Dữ liệu gửi cho HS/PH phải qua hàm lọc (`toStudentQuestion`, `submissionResultVisible`).
- Secrets chỉ từ `process.env`; không hard-code.

## 8. Thêm một Server Action mới — từng bước

```ts
// src/server/<domain>/service.ts
/** API-0xx — FR-0yy. */
export async function doThing(actor: Actor, input: ThingInput): Promise<string> {
  assertCan(actor, "thing.manage");                        // 1. quyền vai trò
  return db.$transaction(async (tx) => {                    // 2. transaction nếu > 1 ghi
    const row = await tx.thing.findUnique({ where: { id: input.id }, select: { status: true } });
    if (!row) throw new ForbiddenError();                   // 3. không tồn tại = 404
    const error = checkThingTransition(row.status, input.to); // 4. quy tắc thuần (rules.ts, có test)
    if (error) throw new DomainError(error, MESSAGES[error]);
    const { count } = await tx.thing.updateMany({ where: { id: input.id, status: row.status }, data: { status: input.to } });
    if (count === 0) throw new DomainError("STALE", "… vừa được người khác cập nhật. Vui lòng tải lại trang."); // 5. chống ghi đè
    await writeAudit({ actorId: actor.id, action: "thing.change", entity: "Thing", entityId: input.id, detail: { from: row.status, to: input.to } }, tx); // 6. nếu FR-035 yêu cầu
    return input.id;
  });
}

// src/server/<domain>/actions.ts
"use server";
const schema = z.object({ id: z.string().min(1).max(40), to: z.enum(STATUSES) });
export async function doThingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");                 // a. phiên + vai trò
  const fields = formFields(formData, ["id", "to"]);                 // b. chỉ field liệt kê (chống mass assignment)
  const parsed = parseForm(schema, fields);                          // c. Zod
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => doThing(actor, parsed.data), fields); // d. DomainError → state; Forbidden → 404
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/thing/${parsed.data.id}`);                // e. làm mới
  return { ok: true, message: "Đã cập nhật." };                      // (hoặc redirect SAU runAction)
}
```

Sau đó: thêm mã lỗi vào docs/11 §3, API vào §4, BR vào docs/06, test (§9), cập nhật docs/16 + PROGRESS.

## 9. Testing
- **Unit** (`*.test.ts` cạnh file): mọi hàm `rules.ts`, `src/lib/**`, policy/scope thuần, schema Zod. Tên test có mã TC.
- **Integration** (`*.int.test.ts`): service có transaction; chạy `pnpm test:integration` với `TEST_DATABASE_URL` trỏ DB riêng đã `prisma migrate deploy`; dữ liệu có hậu tố ngẫu nhiên, tự dọn; tự `skip` khi thiếu biến. **Không bao giờ** trỏ vào `corelink`.
- Không sửa test chỉ để xanh; thất bại phải phân loại (code/môi trường/test).

## 10. Database contract conventions
- Thay đổi schema: sửa `schema.prisma` → `pnpm db:migrate:new -- --name <tên>` → đọc SQL → docs/10 → `pnpm db:migrate`.
- Migration chỉ **thêm** trong cùng release (expand/contract).
- Ràng buộc bất biến bằng unique/FK; kiểm tra phức tạp ở service trong transaction; khóa dòng bằng `` tx.$queryRaw`SELECT id FROM … WHERE id = ${id} FOR UPDATE` `` (tagged template = tham số hóa).
- Thời gian lưu UTC; chuyển đổi qua `src/lib/time.ts`.

### 10.1 Hiệu năng (DB ở xa — đếm round-trip)

DB là Supabase (Singapore); đo từ máy dev mỗi round-trip ~250 ms, dữ liệu còn nhỏ nên **thời gian phản hồi ≈ số round-trip tuần tự × RTT**. Quy tắc:

- `relationJoins` đang bật (`prisma/schema.prisma`): một `findX` với `include`/`select` quan hệ = **một** câu SQL. Không tách quan hệ thành query riêng.
- Query độc lập → `Promise.all` (chỉ song song thật khi `connection_limit` > 1, xem `.env.example`).
- Đếm nhiều điều kiện trên cùng bảng → một query (`count(*) FILTER (…)` hoặc `groupBy`), không N lần `count`.
- Ghi nhiều dòng → `createMany`/`updateMany` theo lô; không vòng `await` trong transaction (vd. `planAttendanceWrites`).
- Kiểm tra + ghi trên cùng bản ghi → một lệnh lồng/nguyên tử (`update` + `activities.create`, `INSERT … ON CONFLICT`); bắt `P2025` bằng `isRecordNotFound`.
- Cache (`src/server/cache.ts`, Next Data Cache): chỉ dữ liệu không phụ thuộc người xem, kiểm tra quyền chạy **ngoài** hàm cache, không trả `Date`. Mỗi tag có `invalidate(...)` ở Server Action ghi tương ứng + TTL dự phòng. Hiện có: `subjects` (danh sách môn, 1 giờ), `dashboard` (số liệu tổng quan, 60 s/300 s).
- Danh sách tăng theo thời gian phải phân trang (`page` + `*_PAGE_SIZE`): lead 20, người dùng/học viên 25, lớp 50, nhật ký 50. Danh mục nhỏ có giới hạn tự nhiên (môn, phòng, khóa) không phân trang.
- Đo: `pnpm bench:admin` (chỉ đọc) — so sánh trước/sau khi đổi query. Log: query ≥ `SLOW_QUERY_MS` (mặc định 300) in `[db] CHẬM …` (chỉ câu SQL có `$1`, không in tham số/PII); `DB_LOG_QUERIES=1` in mọi query.

## 11. Git, commit, review
Nhánh `rebuild/v3`. Trợ lý không commit/push (chủ dự án làm). Trước khi bàn giao: tự review diff theo checklist §12.

## 12. Checklist review Backend (bắt buộc cho mọi thay đổi `src/server/**`)
- [ ] Action mới gọi `requireRole`/`requireActor` dòng đầu (trừ API-001, API-005).
- [ ] Service gọi `assertCan` hoặc hàm scope trước khi đọc/ghi dữ liệu nội bộ.
- [ ] Id ẩn từ client được đối chiếu với DB.
- [ ] Zod giới hạn độ dài/enum; chỉ đọc field liệt kê.
- [ ] Nhiều ghi → transaction; chống ghi đè/gửi trùng khi cần.
- [ ] Thao tác thuộc danh sách FR-035 → `writeAudit` trong cùng transaction; `detail` không chứa secret.
- [ ] Không trả đáp án/điểm cho HS/PH ngoài BR-046/047.
- [ ] Không log PII/secret.
- [ ] Unit test cho logic thuần mới; integration test nếu có transaction quan trọng.
- [ ] Docs 06/10/11/16 + PROGRESS cập nhật.

## 13. Build, run, debug
- `pnpm dev` dừng với hướng dẫn nếu DB chưa sẵn sàng; dùng `pnpm dev:raw` để bỏ qua.
- Lỗi "table … does not exist" → DB chưa migrate (`pnpm db:check`).
- Lỗi argon2 khi build → `serverExternalPackages: ["@node-rs/argon2"]` đã có trong `next.config.ts`.

## 14. Do / Don't

| Do | Don't |
|---|---|
| `throw new ForbiddenError()` khi không tìm thấy hoặc ngoài phạm vi | Trả lỗi "Bạn không có quyền xem lớp X" (lộ tồn tại) |
| `redirect()` sau `runAction` | `redirect()` bên trong service/transaction |
| `updateMany where status = cũ` cho chuyển trạng thái | `update` mù rồi hy vọng không đồng thời |
| Quy tắc thuần trong `rules.ts` + test | Viết điều kiện nghiệp vụ trong page |
| `writeAudit(entry, tx)` | Ghi audit ngoài transaction của thay đổi |
