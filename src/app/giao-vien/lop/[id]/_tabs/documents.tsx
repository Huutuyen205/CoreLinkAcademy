import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import type { listClassLessonPlans } from "@/server/documents/service";
import { DOCUMENT_KIND, REQUEST_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/time";

type Doc = Awaited<ReturnType<typeof listClassLessonPlans>>[number];

function DocList({ docs, empty }: { docs: Doc[]; empty: string }) {
  if (docs.length === 0) return <EmptyState message={empty} />;
  return (
    <ul className="divide-y divide-line">
      {docs.map((d) => (
        <li key={d.id} className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/tai-lieu/${d.id}`} className="font-medium">
              {d.title}
            </Link>
            <Badge tone={d.kind === "CURRICULUM" ? "primary" : d.kind === "LESSON_PLAN" ? "warning" : "success"}>{DOCUMENT_KIND[d.kind]}</Badge>
            {d.kind === "LESSON_PLAN" && d.reviewStatus && <Badge tone={REQUEST_STATUS[d.reviewStatus].tone}>{REQUEST_STATUS[d.reviewStatus].label}</Badge>}
          </div>
          <p className="text-sm text-muted">
            {d.session ? `Buổi ${d.session.index} · ` : ""}
            {d.files.length} tệp · {d.owner.fullName} · {formatDate(d.updatedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Giáo án (chỉ giáo viên và quản lý thấy) và tài liệu, giáo trình của lớp (học sinh xem được) trong một mục. */
export function PlansAndMaterialsTab({ classId, plans, materials, aiSessionId }: { classId: string; plans: Doc[]; materials: Doc[]; aiSessionId: string | null }) {
  return (
    <div className="space-y-6">
      <Card
        title={`Giáo án (${plans.length})`}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href={`/tai-lieu/moi?loai=LESSON_PLAN&lop=${classId}`} size="sm">
              Tạo giáo án
            </ButtonLink>
            <ButtonLink href={aiSessionId ? `/giao-vien/soan-bai?buoi=${aiSessionId}` : "/giao-vien/soan-bai"} variant="secondary" size="sm">
              Tạo giáo án, slide bằng AI
            </ButtonLink>
          </span>
        }
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Chỉ giáo viên và quản lý xem được</p>
        <DocList docs={plans} empty="Chưa có giáo án nào." />
      </Card>
      <Card
        title={`Tài liệu và giáo trình (${materials.length})`}
        action={
          <ButtonLink href={`/tai-lieu/moi?loai=MATERIAL&lop=${classId}`} size="sm">
            Thêm tài liệu
          </ButtonLink>
        }
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Học sinh của lớp xem được</p>
        <DocList docs={materials} empty="Chưa có tài liệu nào." />
      </Card>
    </div>
  );
}
