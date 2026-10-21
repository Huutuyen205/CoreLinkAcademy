import { FileText, ImageIcon, Paperclip } from "lucide-react";
import { ConfigForm } from "@/components/forms/config-form";
import { formatBytes } from "@/server/files/rules";
import type { ActionState } from "@/server/errors";

export type FileItem = { id: string; fileName: string; mimeType: string; size: number };

type Props = {
  files: FileItem[];
  empty?: string;
  /** Có thì mỗi tệp có nút xóa; form gửi `fileId` + các trường ẩn. */
  deleteAction?: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteHidden?: Record<string, string>;
};

function Icon({ mime }: { mime: string }) {
  const cls = "size-5 shrink-0 text-primary";
  if (mime.startsWith("image/")) return <ImageIcon className={cls} aria-hidden="true" />;
  if (mime === "application/pdf" || mime.startsWith("text/")) return <FileText className={cls} aria-hidden="true" />;
  return <Paperclip className={cls} aria-hidden="true" />;
}

/** Danh sách tệp: mở xem (ảnh/PDF) hoặc tải xuống qua `/tep/<id>` — quyền kiểm tra phía server. */
export function FileList({ files, empty = "Chưa có tệp.", deleteAction, deleteHidden }: Props) {
  if (files.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-control border border-line bg-surface">
      {files.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <a href={`/tep/${f.id}`} target="_blank" rel="noopener" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 no-underline hover:underline">
            <Icon mime={f.mimeType} />
            <span className="min-w-0 truncate">{f.fileName}</span>
            <span className="shrink-0 text-sm text-muted">{formatBytes(f.size)}</span>
          </a>
          <span className="flex items-center gap-2">
            <a href={`/tep/${f.id}?tai=1`} className="inline-flex min-h-11 items-center px-1 text-sm">
              Tải về
            </a>
            {deleteAction && (
              <ConfigForm action={deleteAction} hidden={{ ...deleteHidden, fileId: f.id }} submitLabel="Xóa" submitVariant="secondary" confirm={`Xóa tệp "${f.fileName}"?`} fields={[]} />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
