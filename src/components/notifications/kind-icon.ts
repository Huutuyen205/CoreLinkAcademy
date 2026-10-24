import { AlarmClock, Bell, BookOpen, CalendarClock, ClipboardCheck, FileText, Megaphone, MessageSquareText, UserPlus, UserRoundCheck, type LucideIcon } from "lucide-react";

/** Biểu tượng theo loại thông báo — dùng chung cho hộp thư, chuông và popup. */
export const KIND_ICONS: Record<string, LucideIcon> = {
  announcement: Megaphone,
  schedule_change: CalendarClock,
  schedule_request: CalendarClock,
  request_result: CalendarClock,
  schedule_reminder: CalendarClock,
  session_soon: AlarmClock,
  attendance: UserRoundCheck,
  leave_request: ClipboardCheck,
  leave_result: ClipboardCheck,
  reminder: ClipboardCheck,
  results: ClipboardCheck,
  submission: ClipboardCheck,
  assignment: ClipboardCheck,
  test: ClipboardCheck,
  due_soon: AlarmClock,
  overdue: AlarmClock,
  resubmit: ClipboardCheck,
  grade_update: ClipboardCheck,
  lesson: BookOpen,
  solution: BookOpen,
  evaluation: MessageSquareText,
  document: FileText,
  review: FileText,
  lead_new: UserPlus,
};

export function kindIcon(kind: string): LucideIcon {
  return KIND_ICONS[kind] ?? Bell;
}

/** Loại cần chú ý ngay: popup không tự tắt cho tới khi người dùng đóng. */
export const STICKY_KINDS = new Set(["session_soon", "overdue", "schedule_change", "leave_request"]);

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
