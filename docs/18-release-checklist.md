# 18 — Release checklist

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21, sau phiên 3) |
| Owner | Trợ lý (Release) · Người phê duyệt: chủ dự án |

`[x]` = đã kiểm chứng bằng chạy thật (output trong PROGRESS) · `[ ]` = chưa.

## Chất lượng
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test` (76/76), `pnpm build` xanh — 2026-10-21 phiên 3
- [ ] `pnpm test:integration` xanh trên DB test — đã viết 8 test, đang **skip** (chưa có `TEST_DATABASE_URL`, Q08)
- [ ] Toàn bộ FR đạt tiêu chí chấp nhận, bằng chứng ở docs/16 — logic thuần có unit test; chưa chạy trên DB thật
- [ ] UAT TC-UAT-01..15 (desktop + 360px) — chờ `pnpm db:reset`
- [ ] Ma trận quyền âm N-02..N-10 (docs/13 §6) — N-01 đã smoke test
- [ ] Không có đáp án trong HTML/RSC trang làm bài trước công bố (TC-UAT-10) — code dùng `toStudentQuestion` (TC-032 unit ✓)
- [ ] Bàn phím, focus, 360px, axe — chưa chạy

## Dữ liệu
- [x] Backup DB trước migration (`backup/corelink-v2-20261021.sql`, 84 bảng)
- [ ] Thử restore backup vào DB tạm (RISK-011)
- [ ] `prisma migrate deploy`/`reset` chạy sạch — chủ dự án chạy
- [x] Thay đổi phiên 3 không cần migration mới (đã đối chiếu `migration.sql`)

## Bảo mật & cấu hình
- [x] `.env` không bị commit; không có secret/log PII trong code (`grep console.* / dangerouslySetInnerHTML src` = 0)
- [x] Header bảo mật có trong response, không có `X-Powered-By` (smoke `next start`)
- [ ] `pnpm audit --prod` không có lỗ hổng mức cao chưa xử lý — chưa chạy
- [ ] CSP (Q05), proxy ghi đè `X-Forwarded-For` (RISK-009) — khi chọn hosting
- [ ] Chính sách lưu trữ/riêng tư (Q03, Q10, Q11)

## Vận hành & tài liệu
- [x] Tài liệu 00–21, use case, cổng người dùng, GAP-REPORT, PROGRESS cập nhật theo code thực tế
- [x] Kế hoạch rollback rõ (14 §4.1)
- [ ] Giám sát/alert (Q05)
- [ ] Chủ dự án xác nhận DECISION-D15..D18 và phê duyệt release
