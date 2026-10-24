"use client";

import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldShell } from "@/components/ui/field";
import { compressImage } from "@/lib/image-compress";

type Props = {
  name: string;
  label: string;
  id: string;
  accept?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
};

/**
 * Ô chọn tệp có thêm nút "Chụp ảnh": bật camera ngay trong trang (điện thoại, máy tính có webcam),
 * ảnh chụp được thu nhỏ rồi gộp vào danh sách tệp gửi đi cùng các tệp đã chọn.
 */
export function CameraFileField({ name, label, id, accept, hint, required, error, className }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const fallback = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [picked, setPicked] = useState<File[]>([]);
  const [shots, setShots] = useState<File[]>([]);
  const [live, setLive] = useState(false);

  // Ô tệp thật luôn chứa: tệp đã chọn + ảnh đã chụp.
  const sync = useCallback((a: File[], b: File[]) => {
    if (!input.current) return;
    const dt = new DataTransfer();
    for (const f of [...a, ...b]) dt.items.add(f);
    input.current.files = dt.files;
  }, []);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLive(false);
  }, []);

  useEffect(() => stop, [stop]);

  const addShots = useCallback(
    (files: File[]) => {
      setShots((prev) => {
        const next = [...prev, ...files];
        sync(picked, next);
        return next;
      });
    },
    [picked, sync],
  );

  const open = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fallback.current?.click();
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setLive(true);
    } catch {
      // Không cấp quyền / không có camera → dùng ô chụp của hệ điều hành.
      fallback.current?.click();
    }
  };

  useEffect(() => {
    if (live && video.current && stream.current) {
      video.current.srcObject = stream.current;
      void video.current.play().catch(() => undefined);
    }
  }, [live]);

  const snap = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const raw = new File([blob], `anh-chup-${Date.now()}.jpg`, { type: "image/jpeg" });
    addShots([await compressImage(raw)]);
  };

  const removeShot = (i: number) => {
    setShots((prev) => {
      const next = prev.filter((_, j) => j !== i);
      sync(picked, next);
      return next;
    });
  };

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          id={id}
          name={name}
          type="file"
          multiple
          accept={accept}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            setPicked(files);
            sync(files, shots);
          }}
          className="block min-h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:font-semibold file:text-primary aria-[invalid=true]:border-danger"
        />
        <button
          type="button"
          onClick={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          <Camera className="size-4" aria-hidden="true" />
          Chụp ảnh
        </button>
        {/* Dự phòng khi trình duyệt không cho mở camera trực tiếp */}
        <input
          ref={fallback}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={async (e) => {
            const files = await Promise.all([...(e.target.files ?? [])].map((f) => compressImage(f)));
            e.target.value = "";
            addShots(files);
          }}
        />
      </div>
      {shots.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {shots.map((f, i) => (
            <Thumb key={f.name + i} file={f} onRemove={() => removeShot(i)} />
          ))}
        </ul>
      )}
      {live && (
        <div role="dialog" aria-modal="true" aria-label="Chụp ảnh" className="fixed inset-0 z-50 flex flex-col bg-black">
          <video ref={video} playsInline muted className="min-h-0 flex-1 object-contain" />
          <div className="flex items-center justify-between gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button type="button" onClick={stop} className="inline-flex min-h-11 items-center gap-1 rounded-control px-3 text-sm font-semibold text-white">
              <X className="size-4" aria-hidden="true" />
              Đóng
            </button>
            <button type="button" onClick={snap} aria-label="Chụp" className="size-16 rounded-full border-4 border-white bg-white/30 active:bg-white" />
            <span className="min-w-16 text-right text-sm text-white">{shots.length > 0 ? `${shots.length} ảnh` : ""}</span>
          </div>
        </div>
      )}
    </FieldShell>
  );
}

function Thumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <li className="relative overflow-hidden rounded-control border border-line bg-paper">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh cục bộ chưa tải lên
        <img src={url} alt="Ảnh vừa chụp" className="aspect-[3/4] w-full object-cover" />
      )}
      <button type="button" onClick={onRemove} aria-label="Bỏ ảnh" className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full bg-ink/75 text-white hover:bg-danger">
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}
