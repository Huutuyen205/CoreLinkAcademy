"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireActor, requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { sendTomorrowReminders } from "./reminders";
import { createAnnouncement, markAllNotificationsRead, markNotificationRead } from "./service";

const AUDIENCES = ["ALL", "STAFF", "TEACHERS", "STUDENTS", "PARENTS", "CLASS"] as const;

const announcementSchema = z.object({
  audience: z.enum(AUDIENCES, { errorMap: () => ({ message: "Chọn đối tượng nhận." }) }),
  classId: z.string().max(40).transform((v) => v || null),
  title: z.string().trim().min(3, "Nhập tiêu đề.").max(200),
  body: z.string().trim().min(3, "Nhập nội dung.").max(5000, "Tối đa 5000 ký tự."),
});

/** FR-048: Admin gửi theo đối tượng; GV gửi cho lớp mình. */
export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const fields = formFields(formData, ["audience", "classId", "title", "body"]);
  const parsed = parseForm(announcementSchema, fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => createAnnouncement(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath("/thong-bao", "layout");
  return { ok: true, message: `Đã gửi thông báo tới ${result.value.recipientCount} người.` };
}

/** Mở một thông báo: đánh dấu đã đọc rồi chuyển tới trang liên quan (nếu có). */
export async function openNotificationAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  if (!/^[a-z0-9]{10,40}$/i.test(id)) redirect("/thong-bao");
  const result = await runAction(() => markNotificationRead(actor, id));
  revalidatePath("/", "layout");
  const link = result.ok ? result.value : null;
  // Chỉ chuyển tới đường dẫn nội bộ (link do hệ thống ghi, vẫn kiểm tra để tránh open redirect).
  redirect(link && link.startsWith("/") && !link.startsWith("//") ? link : "/thong-bao");
}

export async function markAllReadAction(): Promise<void> {
  const actor = await requireActor();
  await markAllNotificationsRead(actor);
  revalidatePath("/", "layout");
}

/** FEAT-B4: quản lý gửi nhắc lịch ngày mai ngay (không chờ lịch tự động 19:00). Không gửi trùng. */
export async function sendRemindersNowAction(): Promise<ActionState> {
  await requireRole("ADMIN", "STAFF");
  const r = await sendTomorrowReminders();
  return { ok: true, message: r.sessions === 0 ? "Ngày mai không có buổi học nào." : `Đã nhắc ${r.recipients} người về ${r.sessions} buổi học ngày mai.` };
}
