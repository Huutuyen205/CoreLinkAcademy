import type { Metadata } from "next";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { buttonClass } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { deleteSubjectAction, saveLevelAction, saveSubjectAction } from "@/server/catalog/actions";
import { listLevelsAdmin, listSubjectsAdmin } from "@/server/catalog/admin";

export const metadata: Metadata = { title: "Môn & cấp học" };

type LevelOption = { value: string; label: string };

function subjectFields(levels: LevelOption[], s?: { name: string; slug: string; description: string; sortOrder: number; isActive: boolean; levels: { levelId: string }[] }): FieldConfig[] {
  const fields: FieldConfig[] = [
    { type: "text", name: "name", label: "Tên môn", required: true, maxLength: 80, defaultValue: s?.name },
    { type: "text", name: "slug", label: "Slug (đường dẫn)", required: true, maxLength: 80, hint: "Ví dụ: toan, ngu-van", defaultValue: s?.slug },
    { type: "number", name: "sortOrder", label: "Thứ tự hiển thị", min: "0", max: "999", defaultValue: String(s?.sortOrder ?? 0) },
    { type: "textarea", name: "description", label: "Mô tả", maxLength: 2000, rows: 2, wide: true, defaultValue: s?.description },
    { type: "checkboxes", name: "levelIds", label: "Dạy ở cấp học", options: levels, defaultValues: s?.levels.map((l) => l.levelId) ?? [], wide: true },
  ];
  if (s) fields.push({ type: "checkbox", name: "isActive", label: "Đang sử dụng (bỏ chọn = ngừng sử dụng, ẩn khỏi trang công khai)", defaultChecked: s.isActive, wide: true });
  return fields;
}

function levelFields(l?: { name: string; gradeFrom: number; gradeTo: number; description: string | null; sortOrder: number; isActive: boolean }): FieldConfig[] {
  const fields: FieldConfig[] = [
    { type: "text", name: "name", label: "Tên cấp học", required: true, maxLength: 60, defaultValue: l?.name },
    { type: "number", name: "sortOrder", label: "Thứ tự", min: "0", max: "999", defaultValue: String(l?.sortOrder ?? 0) },
    { type: "number", name: "gradeFrom", label: "Từ khối (0 = tiền tiểu học)", required: true, min: "0", max: "12", defaultValue: l ? String(l.gradeFrom) : "" },
    { type: "number", name: "gradeTo", label: "Đến khối", required: true, min: "0", max: "12", defaultValue: l ? String(l.gradeTo) : "" },
    { type: "text", name: "description", label: "Mô tả", maxLength: 300, wide: true, defaultValue: l?.description ?? "" },
  ];
  if (l) fields.push({ type: "checkbox", name: "isActive", label: "Đang sử dụng", defaultChecked: l.isActive, wide: true });
  return fields;
}

// FR-015 + Admin §1 (FR-036): cấp học, môn học, liên kết môn–cấp, ngừng sử dụng. Chỉ Admin.
export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await requireRole("ADMIN");
  const q = (await searchParams).q?.slice(0, 80);
  const [subjects, levels] = await Promise.all([listSubjectsAdmin(actor, q), listLevelsAdmin(actor)]);
  const levelOptions = levels.map((l) => ({ value: l.id, label: `${l.name}${l.isActive ? "" : " (ngừng)"}` }));

  return (
    <>
      <PageHeader title="Môn & cấp học" description="Cấp học (Tiền tiểu học → THPT), môn học và môn nào dạy ở cấp nào." />

      <section className="mb-8">
        <h2 className="mb-3 text-xl">Cấp học</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {levels.map((l) => (
            <li key={l.id} className="rounded-block border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {l.name} <span className="text-sm font-normal text-muted">· {l.gradeFrom === l.gradeTo ? (l.gradeFrom === 0 ? "5–6 tuổi" : `lớp ${l.gradeFrom}`) : `lớp ${l.gradeFrom}–${l.gradeTo}`}</span>
                  </p>
                  <p className="text-sm text-muted">{l.subjects.map((s) => s.subject.name).join(", ") || "Chưa liên kết môn"}</p>
                </div>
                {!l.isActive && <Badge tone="neutral">Ngừng sử dụng</Badge>}
              </div>
              <details className="mt-1">
                <summary className="cursor-pointer py-2.5 text-sm text-primary">Sửa</summary>
                <ConfigForm action={saveLevelAction} hidden={{ id: l.id, statusField: "1" }} submitLabel="Lưu" submitVariant="secondary" columns={2} fields={levelFields(l)} />
              </details>
            </li>
          ))}
        </ul>
        <details className="mt-3 rounded-block border border-line bg-surface p-4">
          <summary className="cursor-pointer py-1 font-medium text-primary">Thêm cấp học</summary>
          <ConfigForm className="mt-3" action={saveLevelAction} submitLabel="Thêm cấp học" columns={2} fields={levelFields()} />
        </details>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl">Môn học</h2>
          <form method="get" className="flex items-end gap-2">
            <TextField name="q" label="Tìm môn" defaultValue={q} maxLength={80} />
            <button type="submit" className={buttonClass("secondary")}>
              Tìm
            </button>
          </form>
        </div>
        {subjects.length === 0 ? (
          <EmptyState message="Không có môn học phù hợp." />
        ) : (
          <ul className="space-y-3">
            {subjects.map((s) => (
              <li key={s.id} className="rounded-block border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {s.name} <span className="text-sm font-normal text-muted">· /{s.slug} · {s._count.courses} khóa</span>
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {[...s.levels]
                        .sort((a, b) => a.level.sortOrder - b.level.sortOrder)
                        .map((l) => (
                          <Badge key={l.levelId} tone="primary">
                            {l.level.name}
                          </Badge>
                        ))}
                      {s.levels.length === 0 && <span className="text-sm text-muted">Chưa gắn cấp học</span>}
                    </p>
                  </div>
                  {!s.isActive && <Badge tone="neutral">Ngừng sử dụng</Badge>}
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer py-2.5 text-sm text-primary">Sửa môn</summary>
                  <ConfigForm action={saveSubjectAction} hidden={{ id: s.id, statusField: "1" }} submitLabel="Lưu" submitVariant="secondary" columns={2} fields={subjectFields(levelOptions, s)} />
                  {s._count.courses === 0 ? (
                    <ConfigForm action={deleteSubjectAction} hidden={{ id: s.id }} submitLabel="Xóa môn" submitVariant="danger" confirm="Xóa môn học này?" fields={[]} className="mt-3" />
                  ) : (
                    <p className="mt-3 text-sm text-muted">Môn đang có khóa học nên không xóa được — dùng &ldquo;ngừng sử dụng&rdquo;.</p>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
        <Card title="Thêm môn học" className="mt-4">
          <ConfigForm action={saveSubjectAction} submitLabel="Thêm môn" columns={2} fields={subjectFields(levelOptions)} />
        </Card>
      </section>
    </>
  );
}
