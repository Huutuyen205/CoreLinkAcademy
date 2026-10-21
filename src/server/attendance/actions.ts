"use server";

import type { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { saveAttendance, type AttendanceEntry } from "./service";

const STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];

/**
 * API-015 — FR-023, FR-024. Form gửi `studentIds` + `status:<id>` + `note:<id>` cho từng học sinh.
 */
export async function saveAttendanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER", "STAFF", "ADMIN");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!z.string().min(1).max(40).safeParse(sessionId).success) return { ok: false, message: "Buổi học không hợp lệ." };
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  if (reasonRaw.length > 255) return { ok: false, fieldErrors: { reason: "Tối đa 255 ký tự." }, message: "Lý do quá dài." };

  const ids = formData.getAll("studentIds").map(String).filter((id) => id.length > 0 && id.length <= 40).slice(0, 200);
  const entries: AttendanceEntry[] = [];
  for (const studentId of ids) {
    const status = String(formData.get(`status:${studentId}`) ?? "PRESENT") as AttendanceStatus;
    if (!STATUSES.includes(status)) return { ok: false, message: "Trạng thái điểm danh không hợp lệ." };
    const note = String(formData.get(`note:${studentId}`) ?? "").trim().slice(0, 255) || null;
    entries.push({ studentId, status, note });
  }

  const result = await runAction(() => saveAttendance(actor, sessionId, entries, reasonRaw || null), { reason: reasonRaw });
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/buoi/${sessionId}`);
  revalidatePath(`/quan-ly/buoi/${sessionId}`);
  revalidatePath(`/quan-ly/lop/${result.value.classId}`);
  return { ok: true, message: `Đã lưu điểm danh ${result.value.count} học sinh.` };
}
