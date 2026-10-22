"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { compressImages } from "@/lib/image-compress";
import { deleteSubmissionFileAction, uploadEssayPhotosAction } from "@/server/assessment/actions";
import { initialActionState } from "@/server/errors";

export type PhotoItem = { id: string; fileName: string; mimeType: string };

/** Ảnh/PDF đã gửi cho một câu tự luận — dùng chung cho HS (xem lại), GV (chấm), PH. */
export function PhotoGrid({ photos, onRemove, busy }: { photos: PhotoItem[]; onRemove?: (id: string) => void; busy?: boolean }) {
  if (photos.length === 0) return null;
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((p, i) => (
        <li key={p.id} className="relative overflow-hidden rounded-control border border-line bg-paper">
          <a href={`/tep/${p.id}`} target="_blank" rel="noopener" className="block" title="Mở ảnh cỡ lớn">
            {p.mimeType.startsWith("image/") && !/hei[cf]/.test(p.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh qua route có kiểm tra quyền
              <img src={`/tep/${p.id}`} alt={`Ảnh bài làm ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <span className="flex aspect-[3/4] items-center justify-center p-2 text-center text-xs">{p.fileName}</span>
            )}
          </a>
          {onRemove && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRemove(p.id)}
              aria-label={`Xóa ảnh ${i + 1}`}
              className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-full bg-ink/75 text-white hover:bg-danger disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Câu tự luận: chụp ảnh bài làm trên giấy (camera sau của điện thoại) hoặc chọn ảnh/PDF.
 * Gửi ngay khi chọn (không cần "Lưu nháp"); chữ đang gõ trong ô trả lời không bị mất.
 */
export function EssayPhotos({ assignmentId, questionId, photos }: { assignmentId: string; questionId: string; photos: PhotoItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const upload = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const picked = [...list];
    start(async () => {
      setError(null);
      const files = await compressImages(picked);
      const fd = new FormData();
      fd.set("assignmentId", assignmentId);
      fd.set("questionId", questionId);
      for (const f of files) fd.append("files", f);
      const result = await uploadEssayPhotosAction(initialActionState, fd);
      if (!result.ok) setError(result.message ?? "Không gửi được ảnh.");
      router.refresh();
    });
  };

  const remove = (fileId: string) => {
    if (!window.confirm("Xóa ảnh này?")) return;
    start(async () => {
      const fd = new FormData();
      fd.set("assignmentId", assignmentId);
      fd.set("fileId", fileId);
      const result = await deleteSubmissionFileAction(initialActionState, fd);
      if (!result.ok) setError(result.message ?? "Không xóa được ảnh.");
      router.refresh();
    });
  };

  const button = "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-soft has-[:disabled]:opacity-60";

  return (
    <div className="mt-3 rounded-control border border-dashed border-line-strong p-3">
      <p className="text-sm text-muted">Làm trên giấy? Chụp ảnh bài làm gửi giáo viên chấm (tối đa 6 ảnh, ảnh tự thu nhỏ trước khi gửi).</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className={button}>
          <Camera className="size-4" aria-hidden="true" />
          Chụp ảnh
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={pending}
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className={button}>
          <ImagePlus className="size-4" aria-hidden="true" />
          Chọn ảnh / PDF
          <input
            type="file"
            accept="image/*,.pdf,.heic,.heif"
            multiple
            disabled={pending}
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {pending && <span className="self-center text-sm text-muted">Đang xử lý…</span>}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <PhotoGrid photos={photos} onRemove={remove} busy={pending} />
    </div>
  );
}
