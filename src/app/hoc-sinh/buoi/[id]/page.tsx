import type { Metadata } from "next";
import { LearnerSessionView } from "@/components/schedule/learner-session";
import { getSessionForLearner } from "@/server/academic/learner";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";

export const metadata: Metadata = { title: "Buổi học" };

// FR-039: học sinh xem chi tiết buổi học của lớp mình.
export default async function StudentSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("STUDENT");
  const s = await orNotFound(getSessionForLearner(actor, (await params).id, actor.id));
  return <LearnerSessionView s={s} backHref="/hoc-sinh/lich" backLabel="Lịch học" />;
}
