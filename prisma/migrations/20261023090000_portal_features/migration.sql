-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleRequestType" AS ENUM ('LEAVE', 'RESCHEDULE');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('CURRICULUM', 'MATERIAL', 'LESSON_PLAN');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STAFF', 'TEACHERS', 'STUDENTS', 'PARENTS', 'CLASS');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('DIRECT', 'CLASS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" VARCHAR(255),
ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "expertise" VARCHAR(200),
ADD COLUMN     "memberStatus" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "profileNote" TEXT;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "note" VARCHAR(255);

-- AlterTable
ALTER TABLE "class_sessions" ADD COLUMN     "isMakeup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" VARCHAR(255);

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "acceptsFiles" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualMaxScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "education_levels" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "gradeFrom" SMALLINT NOT NULL,
    "gradeTo" SMALLINT NOT NULL,
    "description" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_levels" (
    "subjectId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,

    CONSTRAINT "subject_levels_pkey" PRIMARY KEY ("subjectId","levelId")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "assignmentId" TEXT,
    "submissionId" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_blobs" (
    "fileId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "file_blobs_pkey" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "schedule_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "ScheduleRequestType" NOT NULL,
    "proposedStartsAt" TIMESTAMP(3),
    "proposedEndsAt" TIMESTAMP(3),
    "reason" VARCHAR(500) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" VARCHAR(500),
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" VARCHAR(500),
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(500),
    "subjectId" TEXT,
    "levelId" TEXT,
    "sessionId" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibleToStudents" BOOLEAN NOT NULL DEFAULT true,
    "visibleToParents" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_shares" (
    "documentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("documentId","classId")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL,
    "classId" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementId" TEXT,
    "kind" VARCHAR(40) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "link" VARCHAR(300),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "period" VARCHAR(40) NOT NULL,
    "content" TEXT NOT NULL,
    "strengths" TEXT,
    "improvements" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "kind" "ConversationKind" NOT NULL,
    "classId" TEXT,
    "directKey" VARCHAR(90),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_name_key" ON "education_levels"("name");

-- CreateIndex
CREATE INDEX "subject_levels_levelId_idx" ON "subject_levels"("levelId");

-- CreateIndex
CREATE INDEX "stored_files_assignmentId_idx" ON "stored_files"("assignmentId");

-- CreateIndex
CREATE INDEX "stored_files_submissionId_idx" ON "stored_files"("submissionId");

-- CreateIndex
CREATE INDEX "stored_files_documentId_idx" ON "stored_files"("documentId");

-- CreateIndex
CREATE INDEX "schedule_requests_status_createdAt_idx" ON "schedule_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "schedule_requests_teacherId_createdAt_idx" ON "schedule_requests"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "schedule_requests_sessionId_idx" ON "schedule_requests"("sessionId");

-- CreateIndex
CREATE INDEX "leave_requests_sessionId_idx" ON "leave_requests"("sessionId");

-- CreateIndex
CREATE INDEX "leave_requests_studentId_createdAt_idx" ON "leave_requests"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "leave_requests_status_createdAt_idx" ON "leave_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "documents_kind_isActive_idx" ON "documents"("kind", "isActive");

-- CreateIndex
CREATE INDEX "documents_ownerId_idx" ON "documents"("ownerId");

-- CreateIndex
CREATE INDEX "documents_subjectId_idx" ON "documents"("subjectId");

-- CreateIndex
CREATE INDEX "document_shares_classId_idx" ON "document_shares"("classId");

-- CreateIndex
CREATE INDEX "announcements_authorId_createdAt_idx" ON "announcements"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_announcementId_idx" ON "notifications"("announcementId");

-- CreateIndex
CREATE INDEX "evaluations_studentId_status_idx" ON "evaluations"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_classId_studentId_period_key" ON "evaluations"("classId", "studentId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_classId_key" ON "conversations"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_directKey_key" ON "conversations"("directKey");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_members_userId_idx" ON "conversation_members"("userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "subject_levels" ADD CONSTRAINT "subject_levels_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_levels" ADD CONSTRAINT "subject_levels_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "education_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_blobs" ADD CONSTRAINT "file_blobs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Dữ liệu khởi tạo: 4 cấp học (FR-036) và liên kết môn–cấp theo slug môn hiện có.
INSERT INTO "education_levels" ("id", "name", "gradeFrom", "gradeTo", "description", "sortOrder") VALUES
  ('lvl_tien_tieu_hoc', 'Tiền tiểu học', 0, 0, 'Trẻ 5–6 tuổi chuẩn bị vào lớp 1', 0),
  ('lvl_tieu_hoc', 'Tiểu học', 1, 5, 'Lớp 1–5', 1),
  ('lvl_thcs', 'THCS', 6, 9, 'Lớp 6–9, ôn thi vào lớp 10', 2),
  ('lvl_thpt', 'THPT', 10, 12, 'Lớp 10–12, ôn thi tốt nghiệp THPT', 3)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "subject_levels" ("subjectId", "levelId")
SELECT s."id", l."id"
FROM "subjects" s
JOIN "education_levels" l ON
  (s."slug" IN ('toan', 'ngu-van', 'tieng-anh'))
  OR (s."slug" IN ('vat-ly', 'hoa-hoc') AND l."gradeTo" >= 6)
  OR (s."slug" = 'tin-hoc' AND l."gradeTo" >= 1)
ON CONFLICT DO NOTHING;
