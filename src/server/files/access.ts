// Quyền tải một tệp suy ra từ chủ sở hữu của tệp (bài tập / bài nộp / tài liệu). Sai phạm vi → ForbiddenError → 404.
import { documentVisibilityWhere } from "@/server/documents/access";
import { isManager, linkedStudentIds } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import { canReadMessage } from "@/server/messaging/service";

async function isLearnerOfClass(actor: Actor, classId: string): Promise<boolean> {
  if (actor.role === "STUDENT") {
    return Boolean(await db.enrollment.findUnique({ where: { classId_studentId: { classId, studentId: actor.id } }, select: { id: true } }));
  }
  if (actor.role === "PARENT") {
    const childIds = await linkedStudentIds(actor.id);
    return Boolean(await db.enrollment.findFirst({ where: { classId, studentId: { in: childIds } }, select: { id: true } }));
  }
  return false;
}

export async function getFileForDownload(actor: Actor, fileId: string) {
  const file = await db.storedFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      documentId: true,
      messageId: true,
      avatarOf: { select: { id: true } },
      assignment: { select: { status: true, classId: true, class: { select: { teacherId: true } } } },
      submission: { select: { studentId: true, assignment: { select: { class: { select: { teacherId: true } } } } } },
    },
  });
  if (!file) throw new ForbiddenError();

  // Ảnh đại diện: ai đã đăng nhập cũng xem được (tên người dùng vốn đã hiện khắp cổng).
  // Tệp tin nhắn: chỉ người xem được cuộc trò chuyện (quản lý cũng không mở tệp tin nhắn riêng của người khác).
  let allowed: boolean;
  if (file.messageId) allowed = await canReadMessage(actor, file.messageId);
  else allowed = isManager(actor) || Boolean(file.avatarOf);
  if (allowed || file.messageId) {
    // đã quyết định ở trên
  } else if (file.assignment) {
    const a = file.assignment;
    allowed = (actor.role === "TEACHER" && a.class.teacherId === actor.id) || (a.status !== "DRAFT" && (await isLearnerOfClass(actor, a.classId)));
  } else if (file.submission) {
    const s = file.submission;
    allowed =
      (actor.role === "STUDENT" && s.studentId === actor.id) ||
      (actor.role === "TEACHER" && s.assignment.class.teacherId === actor.id) ||
      (actor.role === "PARENT" && (await linkedStudentIds(actor.id)).includes(s.studentId));
  } else if (file.documentId) {
    allowed = Boolean(await db.document.findFirst({ where: { id: file.documentId, ...documentVisibilityWhere(actor) }, select: { id: true } }));
  }
  if (!allowed) throw new ForbiddenError();

  const blob = await db.fileBlob.findUnique({ where: { fileId }, select: { data: true } });
  if (!blob) throw new ForbiddenError();
  return { fileName: file.fileName, mimeType: file.mimeType, size: file.size, data: blob.data };
}
