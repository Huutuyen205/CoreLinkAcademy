import type { Metadata } from "next";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { deleteSubjectAction, saveSubjectAction } from "@/server/catalog/actions";
import { listSubjectsAdmin } from "@/server/catalog/admin";

export const metadata: Metadata = { title: "Môn học" };

function subjectFields(s?: { name: string; slug: string; description: string; sortOrder: number }): FieldConfig[] {
  return [
    { type: "text", name: "name", label: "Tên môn", required: true, maxLength: 80, defaultValue: s?.name },
    { type: "text", name: "slug", label: "Slug (đường dẫn)", required: true, maxLength: 80, hint: "Ví dụ: toan, ngu-van", defaultValue: s?.slug },
    { type: "number", name: "sortOrder", label: "Thứ tự hiển thị", min: "0", max: "999", defaultValue: String(s?.sortOrder ?? 0) },
    { type: "textarea", name: "description", label: "Mô tả", maxLength: 2000, rows: 2, wide: true, defaultValue: s?.description },
  ];
}

// FR-015 (chỉ Admin).
export default async function SubjectsPage() {
  const actor = await requireRole("ADMIN");
  const subjects = await listSubjectsAdmin(actor);
  return (
    <>
      <PageHeader title="Môn học" />
      <div className="space-y-4">
        {subjects.map((s) => (
          <Card key={s.id} title={`${s.name} · ${s._count.courses} khóa`}>
            <ConfigForm action={saveSubjectAction} hidden={{ id: s.id }} submitLabel="Lưu" submitVariant="secondary" columns={2} fields={subjectFields(s)} />
            {s._count.courses === 0 ? (
              <ConfigForm action={deleteSubjectAction} hidden={{ id: s.id }} submitLabel="Xóa môn" submitVariant="danger" confirm="Xóa môn học này?" fields={[]} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted">Môn đang có khóa học nên không xóa được.</p>
            )}
          </Card>
        ))}
        <Card title="Thêm môn học">
          <ConfigForm action={saveSubjectAction} submitLabel="Thêm môn" columns={2} fields={subjectFields()} />
        </Card>
      </div>
    </>
  );
}
