-- DECISION-D41: trang /hoc-sinh/ket-qua đã bỏ; trỏ thông báo đã gửi sang Lớp học (chỉ sửa dữ liệu, không đổi schema).
UPDATE "notifications" SET "link" = '/hoc-sinh/lop' WHERE "link" = '/hoc-sinh/ket-qua';
