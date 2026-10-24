// Người học của cổng dùng chung HS/PH (DECISION-D42): học sinh là chính mình; phụ huynh "đóng vai" con đang chọn.
// Con được lấy từ `guardianships` mỗi request (cookie chỉ là lựa chọn, luôn kiểm lại) → không thể chọn học sinh không liên kết.
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { writeAudit } from "@/server/audit/log";
import { listMyChildren } from "@/server/users/service";
import { CHILD_COOKIE, pickChild, switchChildHref } from "@/lib/child";
import { requireActor } from "./guard";
import { HOME_BY_ROLE } from "./policy";
import type { Actor } from "./session";

export type Child = Awaited<ReturnType<typeof listMyChildren>>[number];

export type Learner = {
  /** Người đang đăng nhập (học sinh hoặc phụ huynh). Dùng cho tin nhắn, tài liệu theo quyền phụ huynh, audit. */
  viewer: Actor;
  /** Học sinh được xem/làm bài: chính học sinh, hoặc con đang chọn của phụ huynh (role STUDENT — mọi service học sinh dùng nguyên). */
  student: Actor;
  base: "/hoc-sinh" | "/phu-huynh";
  isParent: boolean;
  children: Child[];
};

/** Con của phụ huynh + con đang chọn (cookie). Cache trong một request. */
export const parentChildren = cache(async (parent: Actor) => {
  const children = await listMyChildren(parent);
  const wanted = (await cookies()).get(CHILD_COOKIE)?.value;
  return { children, selected: pickChild(children, wanted) };
});

/**
 * Người học cho trang/Server Action của cổng học sinh và phụ huynh.
 * `con` (từ `?con=` của liên kết cũ): khác con đang chọn → đổi con rồi quay lại `den`; không phải con của mình → 404.
 */
export async function requireLearner(opts: { con?: string; den?: string } = {}): Promise<Learner> {
  const viewer = await requireActor();
  if (viewer.role === "STUDENT") return { viewer, student: viewer, base: "/hoc-sinh", isParent: false, children: [] };
  if (viewer.role !== "PARENT") redirect(HOME_BY_ROLE[viewer.role]);

  const { children, selected } = await parentChildren(viewer);
  if (!selected) redirect("/phu-huynh"); // chưa liên kết con: trang /phu-huynh giải thích
  if (opts.con && opts.con !== selected.id) {
    if (!children.some((c) => c.id === opts.con)) notFound();
    redirect(switchChildHref(opts.con, opts.den ?? "/phu-huynh/lich"));
  }
  const student: Actor = { id: selected.id, role: "STUDENT", fullName: selected.fullName, mustChangePassword: false, avatarFileId: null };
  return { viewer, student, base: "/phu-huynh", isParent: true, children };
}

/** Phụ huynh làm bài/nộp bài thay con: ghi nhật ký để truy vết (bài vẫn lưu dưới tên học sinh). Học sinh tự làm thì bỏ qua. */
export async function auditParentActing(learner: Learner, action: string, entity: string, entityId: string): Promise<void> {
  if (!learner.isParent) return;
  await writeAudit({ actorId: learner.viewer.id, action, entity, entityId, detail: { studentId: learner.student.id } });
}
