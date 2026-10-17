-- Tạo tài khoản database riêng cho ứng dụng CoreLink Academy (chạy trong Workbench)
CREATE USER IF NOT EXISTS 'corelink_app'@'%' IDENTIFIED BY 'CHANGE_ME';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON corelink.* TO 'corelink_app'@'%';
FLUSH PRIVILEGES;
