import type { Metadata } from "next";
import Link from "next/link";
import { FileList } from "@/components/files/file-list";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { isManager } from "@/server/auth/scope";
import {
  addDocumentFilesAction,
  deleteDocumentAction,
  deleteDocumentFileAction,
  setDocumentActiveAction,
  shareDocumentAction,
  unshareDocumentAction,
  updateDocumentAction,
} from "@/server/documents/actions";
import { documentFormOptions, getDocument } from "@/server/documents/service";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { orNotFound } from "@/server/page";
import { DOCUMENT_KIND } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tài liệu" };

// FR-042: xem/tải; chủ sở hữu hoặc quản lý sửa, chia sẻ/gỡ chia sẻ, ngừng sử dụng, xóa.
export default async function DocumentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireActor();
  const d = await orNotFound(getDocument(actor, (await params).id));
  const learner = actor.role === "STUDENT" || actor.role === "PARENT";
  const options = d.canManage ? await documentFormOptions(actor) : null;
  const canShare = d.canManage && d.kind !== "LESSON_PLAN" && d.isActive && (isManager(actor) || d.ownerId === actor.id);
  const shareOptions = options?.classes.filter((c) => !d.shares.some((s) => s.class.id === c.id)) ?? [];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/tai-lieu">← Tài liệu</Link>
      </p>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader
        title={d.title}
        description={[d.subject?.name, d.level?.name, `${d.owner.fullName} · cập nhật ${formatDateTime(d.updatedAt)}`].filter(Boolean).join(" · ")}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone="primary">{DOCUMENT_KIND[d.kind]}</Badge>
            {!d.isActive && <Badge tone="neutral">Ngừng sử dụng</Badge>}
          </span>
        }
      />
      <div className={d.canManage ? "grid gap-6 lg:grid-cols-[1fr_340px]" : "space-y-6"}>
        <div className="space-y-6">
          <Card title="Nội dung">
            {d.description && <p className="mb-4 whitespace-pre-line">{d.description}</p>}
            {d.session && (
              <p className="mb-4 text-sm text-muted">
                Gắn với buổi {d.session.index} lớp {d.session.class.code} ({formatDateTime(d.session.startsAt)})
              </p>
            )}
            <FileList files={d.files} empty={d.url ? "Không có tệp tải lên — xem liên kết bên dưới." : "Chưa có tệp."} deleteAction={d.canManage ? deleteDocumentFileAction : undefined} deleteHidden={{ documentId: d.id }} />
            {d.url && (
              <p className="mt-2 text-sm text-muted">
                Liên kết ngoài:{" "}
                <a href={d.url} target="_blank" rel="noopener noreferrer nofollow" className="break-all">
                  {d.url.replace(/^https?:\/\//, "").slice(0, 60)}
                  {d.url.length > 68 ? "…" : ""} ↗
                </a>
              </p>
            )}
            {d.canManage && (
              <ConfigForm
                className="mt-4"
                action={addDocumentFilesAction}
                hidden={{ documentId: d.id }}
                submitLabel="Tải lên"
                submitVariant="secondary"
                fields={[{ type: "file", name: "files", label: "Thêm tệp", hint: ACCEPT_LABEL, accept: ACCEPT_ATTRIBUTE, multiple: true }]}
              />
            )}
          </Card>

          {!learner && d.kind !== "LESSON_PLAN" && (
            <Card title={`Lớp được chia sẻ (${d.shares.length})`}>
              {d.shares.length === 0 ? (
                <p className="text-sm text-muted">Chưa chia sẻ cho lớp nào.</p>
              ) : (
                <ul className="space-y-2">
                  {d.shares.map((s) => (
                    <li key={s.class.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>Lớp {s.class.code}</span>
                      {d.canManage && (
                        <ConfigForm
                          action={unshareDocumentAction}
                          hidden={{ documentId: d.id, classId: s.class.id }}
                          submitLabel="Gỡ chia sẻ"
                          submitVariant="secondary"
                          confirm={`Gỡ chia sẻ khỏi lớp ${s.class.code}? Học sinh/phụ huynh lớp này sẽ không xem được nữa.`}
                          fields={[]}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canShare && shareOptions.length > 0 && (
                <ConfigForm
                  className="mt-4"
                  action={shareDocumentAction}
                  hidden={{ documentId: d.id }}
                  submitLabel={d.kind === "CURRICULUM" ? "Phân phối" : "Chia sẻ"}
                  submitVariant="secondary"
                  fields={[{ type: "select", name: "classId", label: "Chia sẻ cho lớp", placeholder: "Chọn lớp", options: shareOptions.map((c) => ({ value: c.id, label: c.code })) }]}
                />
              )}
            </Card>
          )}
        </div>

        {d.canManage && options && (
          <div className="space-y-6">
            <Card title="Thông tin">
              <ConfigForm
                action={updateDocumentAction}
                hidden={{ documentId: d.id, sessionId: d.session?.id ?? "" }}
                submitLabel="Lưu"
                submitVariant="secondary"
                fields={[
                  { type: "text", name: "title", label: "Tên", required: true, maxLength: 200, defaultValue: d.title },
                  { type: "textarea", name: "description", label: "Mô tả", maxLength: 5000, rows: 3, defaultValue: d.description ?? "" },
                  { type: "select", name: "subjectId", label: "Môn", placeholder: "Không gắn", options: options.subjects.map((s) => ({ value: s.id, label: s.name })), defaultValue: d.subject?.id ?? "" },
                  { type: "select", name: "levelId", label: "Cấp học", placeholder: "Không gắn", options: options.levels.map((l) => ({ value: l.id, label: l.name })), defaultValue: d.level?.id ?? "" },
                  { type: "text", name: "url", label: "Liên kết ngoài (tùy chọn)", maxLength: 500, defaultValue: d.url ?? "", hint: "Video, thư mục Drive… — để trống nếu đã có tệp." },
                  ...(d.kind !== "LESSON_PLAN"
                    ? ([
                        { type: "checkbox", name: "visibleToStudents", label: "Học sinh được xem", defaultChecked: d.visibleToStudents },
                        { type: "checkbox", name: "visibleToParents", label: "Phụ huynh được xem", defaultChecked: d.visibleToParents },
                      ] as const)
                    : []),
                ]}
              />
            </Card>
            <Card title="Trạng thái">
              <ConfigForm
                action={setDocumentActiveAction}
                hidden={{ documentId: d.id, active: d.isActive ? "0" : "1" }}
                submitLabel={d.isActive ? "Ngừng sử dụng" : "Dùng lại"}
                submitVariant="secondary"
                fields={[]}
              />
              <p className="mt-3 text-sm text-muted">Chỉ xóa được khi tài liệu không còn chia sẻ cho lớp nào.</p>
              <ConfigForm
                className="mt-2"
                action={deleteDocumentAction}
                hidden={{ documentId: d.id }}
                submitLabel="Xóa tài liệu"
                submitVariant="danger"
                confirm="Xóa tài liệu và toàn bộ tệp? Không hoàn tác được."
                fields={[]}
              />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
