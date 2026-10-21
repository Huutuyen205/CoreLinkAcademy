# 18 — Release checklist

Trạng thái ngày 2026-10-21 (Pha 1). `[x]` = đã kiểm chứng bằng chạy thật; `[ ]` = chưa.

- [ ] Toàn bộ FR của pha đạt tiêu chí chấp nhận (ghi bằng chứng vào 16) — code xong, logic thuần có unit test; chưa kiểm tra trên DB thật
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test` (70/70), `pnpm build` xanh — output trong `progress/PROGRESS.md`
- [ ] Kiểm tra thủ công UC-001..UC-012 với tài khoản seed, ở desktop và 360px — chờ migrate DB
- [ ] Kiểm tra truy cập chéo: GV A mở lớp GV B, PH mở con người khác, HS mở bài lớp khác → 404 (kịch bản trong `ACCOUNTS.md`) — chờ DB; logic đã có unit test TC-034, TC-035
- [ ] Không có đáp án trong HTML/RSC payload của trang làm bài trước công bố — code chỉ truyền `toStudentQuestion()` (TC-032); cần xem source trang khi có DB
- [x] Backup DB trước migration (`backup/corelink-v2-20261021.sql`, 84 bảng)
- [ ] `prisma migrate deploy`/`reset` chạy sạch — chủ dự án chạy (trợ lý không có quyền)
- [x] `.env` không bị commit (`.gitignore`); không có secret trong code/log
- [x] Header bảo mật có trong response (smoke test `next start`)
- [x] Tài liệu 01, 10, 11, 16, PROGRESS cập nhật theo code thực tế
- [x] Kế hoạch rollback đã rõ (14 §6)
- [ ] Chủ dự án phê duyệt release
