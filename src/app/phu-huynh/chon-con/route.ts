import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireRole } from "@/server/auth/guard";
import { listMyChildren } from "@/server/users/service";
import { CHILD_COOKIE, safeInternalPath } from "@/lib/child";

// DECISION-D42: đổi con đang xem. GET để ô chọn con, thông báo và gợi ý chatbot dùng chung một liên kết; chỉ lưu lựa chọn
// (cookie), luôn kiểm tra lại liên kết phụ huynh–học sinh ở mỗi request nên không mở thêm quyền.
export async function GET(request: NextRequest) {
  const actor = await requireRole("PARENT");
  const params = request.nextUrl.searchParams;
  const con = params.get("con") ?? "";
  const den = safeInternalPath(params.get("den"), "/phu-huynh/lich");

  const children = await listMyChildren(actor);
  if (!children.some((c) => c.id === con)) notFound();
  (await cookies()).set(CHILD_COOKIE, con, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 24 * 3600 });
  redirect(den);
}
