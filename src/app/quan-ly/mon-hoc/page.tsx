import type { Metadata } from "next";
import Link from "next/link";
import { Check, Layers, Plus } from "lucide-react";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { deleteLevelAction, deleteSubjectAction, saveLevelAction, saveSubjectAction, setCatalogActiveAction } from "@/server/catalog/actions";
import { listLevelsAdmin, listSubjectsAdmin } from "@/server/catalog/admin";
import { cn } from "@/lib/format";

export const metadata: Metadata = { title: "Môn & cấp học" };

type LevelOption = { value: string; label: string };

function subjectFields(levels: LevelOption[], s?: { name: string; slug: string; description: string; sortOrder: number; isActive: boolean; levels: { levelId: string }[] }): FieldConfig[] {
  const fields: FieldConfig[] = [
    { type: "text", name: "name", label: "Tên môn", required: true, maxLength: 80, defaultValue: s?.name },
    { type: "checkboxes", name: "levelIds", label: "Dạy ở cấp học", options: levels, defaultValues: s?.levels.map((l) => l.levelId) ?? [] },
    { type: "textarea", name: "description", label: "Mô tả ngắn", maxLength: 2000, rows: 3, defaultValue: s?.description },
    { type: "number", name: "sortOrder", label: "Thứ tự hiển thị", min: "0", max: "999", defaultValue: String(s?.sortOrder ?? 0), hint: "Số nhỏ hiện trước." },
    { type: "text", name: "slug", label: "Đường dẫn web (slug)", maxLength: 80, hint: "Để trống: tự tạo từ tên môn (vd. ngu-van).", defaultValue: s?.slug },
  ];
  if (s) fields.push({ type: "checkbox", name: "isActive", label: "Đang sử dụng (bỏ chọn = ngừng, ẩn khỏi trang công khai)", defaultChecked: s.isActive });
  return fields;
}

function levelFields(
  subjects: LevelOption[],
  l?: { name: string; gradeFrom: number; gradeTo: number; description: string | null; sortOrder: number; isActive: boolean; subjects: { subjectId: string }[] },
): FieldConfig[] {
  const fields: FieldConfig[] = [
    { type: "text", name: "name", label: "Tên cấp học", required: true, maxLength: 60, defaultValue: l?.name },
    { type: "number", name: "gradeFrom", label: "Từ khối", required: true, min: "0", max: "12", defaultValue: l ? String(l.gradeFrom) : "", hint: "0 = tiền tiểu học" },
    { type: "number", name: "gradeTo", label: "Đến khối", required: true, min: "0", max: "12", defaultValue: l ? String(l.gradeTo) : "" },
    { type: "number", name: "sortOrder", label: "Thứ tự", min: "0", max: "999", defaultValue: String(l?.sortOrder ?? 0) },
    { type: "text", name: "description", label: "Mô tả", maxLength: 300, wide: true, defaultValue: l?.description ?? "" },
    { type: "checkboxes", name: "subjectIds", label: "Môn dạy ở cấp này", wide: true, options: subjects, defaultValues: l?.subjects.map((s) => s.subjectId) ?? [] },
  ];
  if (l) fields.push({ type: "checkbox", name: "isActive", label: "Đang sử dụng", defaultChecked: l.isActive, wide: true });
  return fields;
}

const gradeRange = (l: { gradeFrom: number; gradeTo: number }) =>
  l.gradeFrom === 0 && l.gradeTo === 0 ? "5–6 tuổi" : l.gradeFrom === l.gradeTo ? `Lớp ${l.gradeFrom}` : `Lớp ${l.gradeFrom === 0 ? "0" : l.gradeFrom}–${l.gradeTo}`;

type SP = { q?: string; sua?: string; cap?: string; them?: string };

// FR-015 + Admin §1 (FR-036): cấp học, môn học, môn dạy ở cấp nào (ma trận), ngừng sử dụng. Chỉ Admin.
export default async function SubjectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = sp.q?.slice(0, 80);
  const [subjects, levels] = await Promise.all([listSubjectsAdmin(actor, q), listLevelsAdmin(actor)]);
  const levelOptions = levels.map((l) => ({ value: l.id, label: `${l.name}${l.isActive ? "" : " (ngừng)"}` }));
  // Ô môn ở form cấp học: mọi môn (kể cả khi đang lọc danh sách).
  const subjectOptions = (q ? await listSubjectsAdmin(actor) : subjects).map((s) => ({ value: s.id, label: `${s.name}${s.isActive ? "" : " (ngừng)"}` }));
  const editingSubject = subjects.find((s) => s.id === sp.sua);
  const editingLevel = levels.find((l) => l.id === sp.cap);
  const addingLevel = !editingSubject && !editingLevel && sp.them === "cap";
  const keep = (extra: Record<string, string>) => `/quan-ly/mon-hoc?${new URLSearchParams({ ...(q ? { q } : {}), ...extra }).toString()}#bieu-mau`;

  return (
    <>
      <PageHeader
        title="Môn & cấp học"
        description="Cấp học (Tiền tiểu học → THPT), môn học và môn nào dạy ở cấp nào."
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href={keep({})} size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Thêm môn
            </ButtonLink>
            <ButtonLink href={keep({ them: "cap" })} size="sm" variant="secondary">
              <Layers className="size-4" aria-hidden="true" />
              Thêm cấp học
            </ButtonLink>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          {/* ── Cấp học ── */}
          <section aria-labelledby="cap-hoc">
            <h2 id="cap-hoc" className="mb-3 text-xl">
              Cấp học <span className="text-base font-normal text-muted">({levels.length})</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {levels.map((l) => (
                <li
                  key={l.id}
                  className={cn(
                    "flex flex-col rounded-block border bg-surface p-4 shadow-[0_2px_8px_rgba(14,20,51,0.05)]",
                    editingLevel?.id === l.id ? "border-primary ring-2 ring-primary/20" : "border-line",
                    !l.isActive && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-primary">{l.name}</p>
                    {l.isActive ? <Badge tone="primary">{gradeRange(l)}</Badge> : <Badge tone="neutral">Ngừng</Badge>}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-muted">{l.subjects.length ? `${l.subjects.length} môn: ${l.subjects.map((s) => s.subject.name).join(", ")}` : "Chưa có môn"}</p>
                  <RowActions className="mt-3">
                    <ActionLink href={keep({ cap: l.id })} icon="edit">
                      Sửa
                    </ActionLink>
                    <ActionButton action={setCatalogActiveAction} hidden={{ kind: "level", id: l.id, active: l.isActive ? "0" : "1" }} icon={l.isActive ? "hide" : "restore"} tone={l.isActive ? "default" : "success"}>
                      {l.isActive ? "Ngừng" : "Dùng lại"}
                    </ActionButton>
                    {l.subjects.length + l._count.documents === 0 && (
                      <ActionButton action={deleteLevelAction} hidden={{ id: l.id }} icon="delete" tone="danger" confirm={`Xóa cấp học ${l.name}?`}>
                        Xóa
                      </ActionButton>
                    )}
                  </RowActions>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Môn học: ma trận môn × cấp ── */}
          <section aria-labelledby="mon-hoc">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 id="mon-hoc" className="text-xl">
                Môn học <span className="text-base font-normal text-muted">({subjects.length})</span>
              </h2>
              <FilterForm className="w-full sm:w-72">
                <TextField name="q" label="Tìm môn" defaultValue={q} maxLength={80} />
              </FilterForm>
            </div>
            {subjects.length === 0 ? (
              <EmptyState message="Không có môn học phù hợp." />
            ) : (
              <DataTable
                caption="Môn học và cấp học được dạy"
                rows={subjects}
                rowKey={(s) => s.id}
                columns={[
                  {
                    header: "Môn",
                    primary: true,
                    cell: (s) => (
                      <span className={cn(!s.isActive && "opacity-70")}>
                        <Link href={keep({ sua: s.id })} className="font-semibold">
                          {s.name}
                        </Link>
                        <span className="block text-xs text-muted">
                          /{s.slug} · {s._count.courses} khóa
                        </span>
                      </span>
                    ),
                  },
                  ...levels.map((l) => ({
                    header: l.name,
                    className: "text-center",
                    cell: (s: (typeof subjects)[number]) =>
                      s.levels.some((x) => x.levelId === l.id) ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-success-soft text-success" title={`${s.name} dạy ở ${l.name}`}>
                          <Check className="size-4" aria-hidden="true" />
                          <span className="sr-only">Có</span>
                        </span>
                      ) : (
                        <span className="text-subtle" aria-label="Không">
                          —
                        </span>
                      ),
                  })),
                  { header: "Trạng thái", cell: (s) => (s.isActive ? <Badge tone="success">Đang dùng</Badge> : <Badge tone="neutral">Ngừng</Badge>) },
                  {
                    header: "Thao tác",
                    className: "md:w-[1%] md:whitespace-nowrap",
                    cell: (s) => (
                      <RowActions>
                        <ActionLink href={keep({ sua: s.id })} icon="edit">
                          Sửa
                        </ActionLink>
                        <ActionButton action={setCatalogActiveAction} hidden={{ kind: "subject", id: s.id, active: s.isActive ? "0" : "1" }} icon={s.isActive ? "hide" : "restore"} tone={s.isActive ? "default" : "success"}>
                          {s.isActive ? "Ngừng" : "Dùng lại"}
                        </ActionButton>
                        {s._count.courses === 0 && (
                          <ActionButton action={deleteSubjectAction} hidden={{ id: s.id }} icon="delete" tone="danger" confirm={`Xóa môn ${s.name}?`}>
                            Xóa
                          </ActionButton>
                        )}
                      </RowActions>
                    ),
                  },
                ]}
              />
            )}
            <p className="mt-2 text-sm text-muted">Môn đã có khóa học không xóa được — dùng &ldquo;Ngừng&rdquo; để ẩn khỏi trang công khai.</p>
          </section>
        </div>

        {/* ── Cột phải: thêm / sửa ── */}
        <aside id="bieu-mau" className="scroll-mt-24 xl:sticky xl:top-6 xl:self-start">
          {editingSubject ? (
            <Card title={`Sửa môn: ${editingSubject.name}`} action={<Link href={keep({})} className="text-sm">Đóng</Link>}>
              <ConfigForm key={editingSubject.id} action={saveSubjectAction} hidden={{ id: editingSubject.id, statusField: "1" }} submitLabel="Lưu môn" fields={subjectFields(levelOptions, editingSubject)} />
            </Card>
          ) : editingLevel ? (
            <Card title={`Sửa cấp học: ${editingLevel.name}`} action={<Link href={keep({})} className="text-sm">Đóng</Link>}>
              <ConfigForm key={editingLevel.id} action={saveLevelAction} hidden={{ id: editingLevel.id, statusField: "1", subjectField: "1" }} submitLabel="Lưu cấp học" columns={2} fields={levelFields(subjectOptions, editingLevel)} />
            </Card>
          ) : addingLevel ? (
            <Card title="Thêm cấp học" action={<Link href={keep({})} className="text-sm">Thêm môn thay vào</Link>}>
              <ConfigForm key="new-level" action={saveLevelAction} hidden={{ subjectField: "1" }} submitLabel="Thêm cấp học" columns={2} fields={levelFields(subjectOptions)} />
            </Card>
          ) : (
            <Card title="Thêm môn học">
              <ConfigForm key="new-subject" action={saveSubjectAction} submitLabel="Thêm môn" fields={subjectFields(levelOptions)} />
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
