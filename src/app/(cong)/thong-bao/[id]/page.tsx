import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { orNotFound } from "@/server/page";
import { getMyNotification } from "@/server/notifications/service";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Chi tiết thông báo" };

// "Xem chi tiết thông báo" (GV §10A, HS §7, PH §7A, Admin §12A): nội dung đầy đủ, người gửi, trang liên quan.
export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const n = await orNotFound(getMyNotification(actor, (await params).id));
  const link = n.link && n.link !== "/thong-bao" && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : null;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/thong-bao">← Thông báo</Link>
      </p>
      <PageHeader
        title={n.title}
        description={`${formatDateTime(n.createdAt)}${n.announcement ? ` · ${n.announcement.author.fullName} (${ROLE_LABELS[n.announcement.author.role]})` : " · Hệ thống CoreLink"}`}
      />
      <Card>
        {n.announcement && (
          <p className="mb-3 text-sm text-muted">Gửi tới: {n.announcement.audience === "CLASS" && n.announcement.class ? `lớp ${n.announcement.class.code}` : AUDIENCE_LABELS[n.announcement.audience].toLowerCase()}</p>
        )}
        <p className="whitespace-pre-line">{n.body}</p>
        {link && (
          <ButtonLink href={link} className="mt-4">
            Mở trang liên quan
          </ButtonLink>
        )}
      </Card>
    </>
  );
}
