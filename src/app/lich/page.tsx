import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/guard";

const SCHEDULE_BY_ROLE = {
  ADMIN: "/quan-ly/lich",
  STAFF: "/quan-ly/lich",
  TEACHER: "/giao-vien/lich",
  STUDENT: "/hoc-sinh/lich",
  PARENT: "/phu-huynh",
} as const;

/** Liên kết chung trong thông báo đổi lịch → trang lịch theo vai trò. */
export default async function ScheduleRedirect() {
  const actor = await requireActor();
  redirect(SCHEDULE_BY_ROLE[actor.role]);
}
