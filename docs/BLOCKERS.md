# DANH SÁCH ĐIỂM CHẶN (BLOCKERS)

| ID | Vấn đề | Tác động | Giải pháp tạm thời / Mock | Trạng thái |
|---|---|---|---|---|
| BLK-001 | Docker engine không tìm thấy trên hệ thống Windows PATH | Không chạy được docker compose cho redis, minio, mailpit | Dùng mock service / local tools hoặc khởi động Docker Desktop nếu có | Đang kiểm tra |
| BLK-002 | Chưa có file `.env` chứa mật khẩu MySQL thật và khóa API | Cần cấu hình để kết nối database `corelink` | Đợi xác nhận từ người dùng theo mục A0 bước 5 | Đang chờ người dùng |
