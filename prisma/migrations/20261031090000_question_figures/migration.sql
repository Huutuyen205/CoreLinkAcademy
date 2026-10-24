-- Hình minh họa của câu hỏi (DECISION-D43): đặc tả JSON, hệ thống tự vẽ khi hiển thị. Cột cho phép NULL, không đổi dữ liệu cũ.
-- AlterTable
ALTER TABLE "questions" ADD COLUMN "figure" JSONB;

-- AlterTable
ALTER TABLE "practice_questions" ADD COLUMN "figure" JSONB;
