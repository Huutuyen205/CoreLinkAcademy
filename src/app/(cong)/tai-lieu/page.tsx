import type { DocumentKind } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { isManager } from "@/server/auth/scope";
import { canCreateKind, documentFormOptions, listDocuments } from "@/server/documents/service";
import { cn } from "@/lib/format";
import { DOCUMENT_KIND } from "@/lib/labels";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Giáo trình & tài liệu" };

type SP = { loai?: string; q?: string; mon?: string; cap?: string; lop?: string; ngung?: string; thongbao?: string };

// FR-042 — Admin §9–§10, GV §3–§5, HS §tài liệu, PH §6. Danh sách chỉ gồm tài liệu actor được xem (documentVisibilityWhere).
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const learner = actor.role === "STUDENT" || actor.role === "PARENT";
  const kinds: DocumentKind[] = learner ? ["MATERIAL", "CURRICULUM"] : ["CURRICULUM", "MATERIAL", "LESSON_PLAN"];
  const kind = kinds.includes(sp.loai as DocumentKind) ? (sp.loai as DocumentKind) : undefined;
  const options = learner ? null : await documentFormOptions(actor);
  const pick = (v: string | undefined, list: { id: string }[] | undefined) => (v && list?.some((x) => x.id === v) ? v : undefined);
  const filter = {
    kind,
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
    subjectId: pick(sp.mon, options?.subjects),
    levelId: pick(sp.cap, options?.levels),
    classId: pick(sp.lop, options?.classes),
    includeInactive: sp.ngung === "1",
  };
  const docs = await listDocuments(actor, filter);
  const tabHref = (k?: DocumentKind) => (k ? `/tai-lieu?loai=${k}` : "/tai-lieu");

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader
        title={learner ? "Tài liệu học tập" : "Giáo trình & tài liệu"}
        description={
          learner
            ? "Tài liệu, bài giảng giáo viên chia sẻ cho lớp."
            : actor.role === "TEACHER"
              ? "Giáo trình của trung tâm, tài liệu bạn chia sẻ cho lớp và giáo án của bạn."
              : "Giáo trình chuẩn, tài liệu học tập và giáo án giáo viên tải lên."
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {kinds
          .filter((k) => canCreateKind(actor.role, k))
          .map((k) => (
            <ButtonLink key={k} href={`/tai-lieu/moi?loai=${k}`} variant={k === "MATERIAL" ? "primary" : "secondary"} size="sm">
              + {DOCUMENT_KIND[k]}
            </ButtonLink>
          ))}
      </div>
      <nav aria-label="Loại tài liệu" className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...kinds].map((k) => (
          <Link
            key={k ?? "all"}
            href={tabHref(k)}
            aria-current={k === kind ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline",
              k === kind ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink",
            )}
          >
            {k ? DOCUMENT_KIND[k] : "Tất cả"}
          </Link>
        ))}
      </nav>
      {options && (
        <form method="get" className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
          {kind && <input type="hidden" name="loai" value={kind} />}
          <TextField name="q" label="Tìm theo tên" defaultValue={filter.q} maxLength={80} />
          <SelectField name="mon" label="Môn" placeholder="Tất cả" defaultValue={filter.subjectId ?? ""} options={options.subjects.map((s) => ({ value: s.id, label: s.name }))} />
          <SelectField name="cap" label="Cấp học" placeholder="Tất cả" defaultValue={filter.levelId ?? ""} options={options.levels.map((l) => ({ value: l.id, label: l.name }))} />
          <SelectField name="lop" label="Lớp" placeholder="Tất cả" defaultValue={filter.classId ?? ""} options={options.classes.map((c) => ({ value: c.id, label: c.code }))} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass()}>
              Lọc
            </button>
            {isManager(actor) && (
              <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="ngung" value="1" defaultChecked={filter.includeInactive} className="size-5 accent-primary" />
                Gồm tài liệu ngừng dùng
              </label>
            )}
          </div>
        </form>
      )}
      {docs.length === 0 ? (
        <EmptyState message={learner ? "Chưa có tài liệu nào được chia sẻ cho lớp." : "Chưa có tài liệu phù hợp."} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {docs.map((d) => (
            <li key={d.id} className="card-interactive rounded-block border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={d.kind === "CURRICULUM" ? "primary" : d.kind === "LESSON_PLAN" ? "warning" : "success"}>{DOCUMENT_KIND[d.kind]}</Badge>
                {!d.isActive && <Badge tone="neutral">Ngừng sử dụng</Badge>}
                {d.subject && <span className="text-sm text-muted">{d.subject.name}</span>}
                {d.level && <span className="text-sm text-muted">· {d.level.name}</span>}
              </div>
              <h2 className="mt-2 text-lg">
                <Link href={`/tai-lieu/${d.id}`} className="text-ink no-underline hover:text-primary">
                  {d.title}
                </Link>
              </h2>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{d.description}</p>}
              <p className="mt-2 text-sm text-muted">
                {d.files.length} tệp{d.url ? " · có đường dẫn" : ""} · {d.owner.fullName} · {formatDate(d.updatedAt)}
                {d.shares.length > 0 && !learner ? ` · lớp ${d.shares.map((s) => s.class.code).join(", ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
