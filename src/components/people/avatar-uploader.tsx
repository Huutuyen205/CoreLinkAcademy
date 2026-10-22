"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { compressImage } from "@/lib/image-compress";
import { removeAvatarAction, updateAvatarAction } from "@/server/account/actions";
import { initialActionState } from "@/server/errors";

/** FR-051: đổi ảnh đại diện — chụp bằng camera trước hoặc chọn ảnh; ảnh được thu nhỏ còn ≤ 512px trước khi gửi. */
export function AvatarUploader({ name, fileId }: { name: string; fileId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const upload = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    start(async () => {
      setMessage(null);
      const small = await compressImage(file, { maxSide: 512, quality: 0.85, maxBytes: 150 * 1024 });
      const fd = new FormData();
      fd.set("avatar", small);
      const result = await updateAvatarAction(initialActionState, fd);
      setMessage({ ok: result.ok, text: result.message ?? (result.ok ? "Đã cập nhật." : "Không cập nhật được ảnh.") });
      router.refresh();
    });
  };

  const remove = () => {
    if (!window.confirm("Gỡ ảnh đại diện?")) return;
    start(async () => {
      const result = await removeAvatarAction();
      setMessage({ ok: result.ok, text: result.message ?? "" });
      router.refresh();
    });
  };

  const button = "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-primary/30 bg-surface px-3 text-xs font-semibold text-primary hover:bg-primary-soft has-[:disabled]:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name={name} fileId={fileId} size="xl" className="ring-4 ring-primary-soft" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className={button}>
            <ImagePlus className="size-3.5" aria-hidden="true" />
            {fileId ? "Đổi ảnh" : "Tải ảnh lên"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
          <label className={button}>
            <Camera className="size-3.5" aria-hidden="true" />
            Chụp ảnh
            <input type="file" accept="image/*" capture="user" disabled={pending} className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
          {fileId && (
            <button type="button" onClick={remove} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs text-muted hover:text-danger disabled:opacity-60">
              <Trash2 className="size-3.5" aria-hidden="true" />
              Gỡ ảnh
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{pending ? "Đang tải ảnh…" : "JPG, PNG hoặc WEBP. Ảnh hiện ở menu, tin nhắn và danh sách thành viên."}</p>
        {message && <p className={message.ok ? "text-xs font-medium text-success" : "text-xs font-medium text-danger"}>{message.text}</p>}
      </div>
    </div>
  );
}
