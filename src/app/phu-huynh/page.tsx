import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/layout/flash";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { parentChildren } from "@/server/auth/learner";
import { switchChildHref } from "@/lib/child";

export const metadata: Metadata = { title: "Phụ huynh" };

// DECISION-D42: cổng phụ huynh dùng chung giao diện với học sinh (Lịch · Lớp học · Bài tập · Đơn xin nghỉ · Tin nhắn) cho con đang chọn;
// vào thẳng Lịch học. `?con=` (liên kết cũ) đổi sang đúng con. Chưa liên kết con thì giải thích ở đây.
export default async function ParentHome({ searchParams }: { searchParams: Promise<{ con?: string; thongbao?: string }> }) {
  const actor = await requireRole("PARENT");
  const sp = await searchParams;
  const { children } = await parentChildren(actor);

  if (children.length > 0) {
    if (sp.con && children.some((c) => c.id === sp.con)) redirect(switchChildHref(sp.con, "/phu-huynh/lich"));
    redirect("/phu-huynh/lich");
  }
  return (
    <div className="space-y-6">
      <Flash code={sp.thongbao} />
      <PageHeader title={`Xin chào, ${actor.fullName}`} />
      <EmptyState message="Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ trung tâm để được hỗ trợ ghép hồ sơ con." />
    </div>
  );
}
