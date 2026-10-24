-- Bài nộp do AI chấm hàng loạt, giáo viên chưa duyệt (DECISION-D44). Cột cho phép NULL, không đổi dữ liệu cũ.
-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "aiGradedAt" TIMESTAMP(3);
