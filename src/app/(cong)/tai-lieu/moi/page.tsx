import type { DocumentKind } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { createDocumentAction } from "@/server/documents/actions";
import { canCreateKind, documentFormOptions, lessonPlanSessionOptions } from "@/server/documents/service";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { DOCUMENT_KIND } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Thêm tài liệu" };

const KINDS: DocumentKind[] = ["CURRICULUM", "MATERIAL", "LESSON_PLAN"];

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ loai?: string; lop?: string }> }) {
  const actor = await requireRole("ADMIN", "TEACHER");
  const sp = await searchParams;
  const kind = KINDS.find((k) => k === sp.loai);
  if (!kind || !canCreateKind(actor.role, kind)) notFound();
  const options = await documentFormOptions(actor);
  const sessions = kind === "LESSON_PLAN" ? await lessonPlanSessionOptions(actor) : [];
  const presetClass = options.classes.find((c) => c.id === sp.lop)?.id;

  const fields: FieldConfig[] = [
    { type: "text", name: "title", label: "Tên", required: true, maxLength: 200, wide: true },
    { type: "textarea", name: "description", label: "Mô tả", maxLength: 5000, rows: 3, wide: true },
    { type: "select", name: "subjectId", label: "Môn học", placeholder: "Không gắn môn", options: options.subjects.map((s) => ({ value: s.id, label: s.name })) },
    { type: "select", name: "levelId", label: "Cấp học", placeholder: "Không gắn cấp", options: options.levels.map((l) => ({ value: l.id, label: l.name })) },
  ];
  if (kind === "LESSON_PLAN") {
    fields.push({
      type: "select",
      name: "sessionId",
      label: "Buổi dạy",
      placeholder: "Không gắn buổi",
      wide: true,
      options: sessions.map((s) => ({ value: s.id, label: `${s.class.code} · buổi ${s.index} · ${formatDateTime(s.startsAt)}` })),
    });
  }
  fields.push(
    { type: "file", name: "files", label: "Tệp tài liệu", hint: ACCEPT_LABEL, accept: ACCEPT_ATTRIBUTE, multiple: true, camera: true, wide: true },
    // Phụ: chỉ cần khi tài liệu quá lớn để tải lên (video, thư mục Drive) — có hay không đều được.
    { type: "text", name: "url", label: "Liên kết ngoài (tùy chọn)", maxLength: 500, wide: true, hint: "Chỉ dùng khi tệp quá lớn để tải lên, vd. video YouTube, thư mục Google Drive." },
  );
  if (kind !== "LESSON_PLAN") {
    fields.push(
      { type: "checkbox", name: "visibleToStudents", label: "Học sinh được xem", defaultChecked: true },
      { type: "checkbox", name: "visibleToParents", label: "Phụ huynh được xem", defaultChecked: false },
    );
    if (options.classes.length > 0) {
      fields.push({
        type: "checkboxes",
        name: "classIds",
        label: kind === "CURRICULUM" ? "Phân phối cho lớp (tùy chọn)" : "Chia sẻ cho lớp (tùy chọn)",
        options: options.classes.map((c) => ({ value: c.id, label: c.code })),
        defaultValues: presetClass ? [presetClass] : [],
        wide: true,
      });
    }
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/tai-lieu">← Tài liệu</Link>
      </p>
      <PageHeader
        title={`Thêm ${DOCUMENT_KIND[kind].toLowerCase()}`}
        description={kind === "LESSON_PLAN" ? "Giáo án chỉ bạn và quản trị viên xem được." : "Tài liệu chỉ hiện với học sinh/phụ huynh của lớp được chia sẻ."}
      />
      <Card>
        <ConfigForm
          action={createDocumentAction}
          hidden={{ kind, ...(kind !== "LESSON_PLAN" ? { sessionId: "" } : {}) }}
          submitLabel="Lưu tài liệu"
          columns={2}
          fields={fields}
        />
      </Card>
    </>
  );
}
