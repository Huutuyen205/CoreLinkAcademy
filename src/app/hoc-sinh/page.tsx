import { redirect } from "next/navigation";

// Học sinh vào thẳng lịch học (không có trang tổng quan) — DECISION-D41.
export default function StudentHome() {
  redirect("/hoc-sinh/lich");
}
