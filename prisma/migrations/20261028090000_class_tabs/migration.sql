-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "comment" VARCHAR(500);

-- AlterTable
ALTER TABLE "practice_sets" ADD COLUMN     "classId" TEXT,
ADD COLUMN     "forStudentId" TEXT;

-- CreateIndex
CREATE INDEX "practice_sets_classId_idx" ON "practice_sets"("classId");

-- CreateIndex
CREATE INDEX "practice_sets_forStudentId_idx" ON "practice_sets"("forStudentId");

-- AddForeignKey
ALTER TABLE "practice_sets" ADD CONSTRAINT "practice_sets_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sets" ADD CONSTRAINT "practice_sets_forStudentId_fkey" FOREIGN KEY ("forStudentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
