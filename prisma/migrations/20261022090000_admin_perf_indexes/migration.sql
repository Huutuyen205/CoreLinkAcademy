-- Index cho các cột lọc/sắp xếp/khóa ngoại của khu quản lý (docs/10 §Index, PROGRESS 2026-10-22).
-- Chỉ thêm/thay index, không đổi dữ liệu. Bảng nhỏ (< vài nghìn dòng) nên CREATE INDEX thường là đủ.
-- DropIndex
DROP INDEX "users_role_idx";

-- CreateIndex
CREATE INDEX "users_role_fullName_idx" ON "users"("role", "fullName");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "classes_status_startDate_idx" ON "classes"("status", "startDate");

-- CreateIndex
CREATE INDEX "classes_roomId_idx" ON "classes"("roomId");

-- CreateIndex
CREATE INDEX "leads_subjectId_createdAt_idx" ON "leads"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_courseId_idx" ON "leads"("courseId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets"("resetAt");

