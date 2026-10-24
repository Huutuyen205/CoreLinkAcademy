import type { DocumentKind } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { FilterForm } from "@/components/ui/filter-form";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { isManager } from "@/server/auth/scope";
import { canCreateKind, documentFormOptions, listDocuments } from "@/server/documents/service";
import { cn } from "@/lib/format";
import { DOCUMENT_KIND, REQUEST_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Giáo trình & tài liệu" };

type SP = { loai?: string; q?: string; mon?: string; cap?: string; lop?: string; ngung?: string; duyet?: string; thongbao?: string };

// FR-042 — Admin §9–§10, GV §3–§5, HS §tài liệu, PH §6. Danh sách chỉ gồm tài liệu actor được xem (documentVisibilityWhere).
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireActor();
  // Giáo viên xem tài liệu/giáo án trong trang lớp (DECISION-D36), không có danh sách riêng.
  if (actor.role === "TEACHER") redirect("/giao-vien/lop");
  const sp = await searchParams;
  const learner = actor.role === "STUDENT" || actor.role === "PARENT";
  const kinds: DocumentKind[] = learner ? ["MATERIAL", "CURRICULUM"] : ["CURRICULUM", "MATERIAL", "LESSON_PLAN"];
  const kind = kinds.includes(sp.loai as DocumentKind) ? (sp.loai as DocumentKind) : undefined;
  const options = await documentFormOptions(actor);
  const pick = (v: string | undefined, list: { id: string }[] | undefined) => (v && list?.some((x) => x.id === v) ? v : undefined);
  const filter = {
    kind,
    q: typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined,
    subjectId: pick(sp.mon, options?.subjects),
    levelId: pick(sp.cap, options?.levels),
    classId: pick(sp.lop, options?.classes),
    includeInactive: sp.ngung === "1",
    pendingReview: !learner && sp.duyet === "cho",
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
        {!learner && (
          <Link
            href="/tai-lieu?loai=LESSON_PLAN&duyet=cho"
            aria-current={filter.pendingReview ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline",
              filter.pendingReview ? "border-warning bg-warning-soft font-semibold text-warning" : "border-line bg-surface text-ink",
            )}
          >
            Giáo án chờ duyệt
          </Link>
        )}
      </nav>
      {options && (
        <FilterForm className={cn("mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:items-end", learner ? "md:grid-cols-[1.4fr_1fr_1fr]" : "md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]")}>
          {kind && <input type="hidden" name="loai" value={kind} />}
          {filter.pendingReview && <input type="hidden" name="duyet" value="cho" />}
          <TextField name="q" label="Tìm theo tên" defaultValue={filter.q} maxLength={80} />
          <SearchSelect name="mon" label="Môn" emptyLabel="Tất cả" defaultValue={filter.subjectId ?? ""} options={options.subjects.map((s) => ({ value: s.id, label: s.name }))} />
          {!learner && <SearchSelect name="cap" label="Cấp học" emptyLabel="Tất cả" defaultValue={filter.levelId ?? ""} options={options.levels.map((l) => ({ value: l.id, label: l.name }))} />}
          <SearchSelect name="lop" label="Lớp" emptyLabel="Tất cả" defaultValue={filter.classId ?? ""} options={options.classes.map((c) => ({ value: c.id, label: c.code }))} />
          {!learner && <div className="flex flex-wrap gap-2">
            {isManager(actor) && (
              <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="ngung" value="1" defaultChecked={filter.includeInactive} className="size-5 accent-primary" />
                Gồm tài liệu ngừng dùng
              </label>
            )}
          </div>}
        </FilterForm>
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
                {d.kind === "LESSON_PLAN" && d.reviewStatus && <Badge tone={REQUEST_STATUS[d.reviewStatus].tone}>{REQUEST_STATUS[d.reviewStatus].label}</Badge>}
                {d.subject && <span className="text-sm text-muted">{d.subject.name}</span>}
                {d.level && <span className="text-sm text-muted">· {d.level.name}</span>}
              </div>
              <h2 className="mt-2 text-lg">
                <Link href={`/tai-lieu/${d.id}`} className="text-ink no-underline hover:text-primary">
                  {d.title}
                </Link>
              </h2>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{d.description}</p>}
              {d.session && (
                <p className="mt-1 text-sm text-primary">
                  Buổi {d.session.index} · lớp {d.session.class.code}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {d.files.length} tệp{d.url ? " · có liên kết" : ""} · {d.owner.fullName} · {formatDate(d.updatedAt)}
                {d.shares.length > 0 && !learner ? ` · lớp ${d.shares.map((s) => s.class.code).join(", ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
