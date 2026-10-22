"use client";

import { FileText, ImagePlus, Paperclip, SendHorizontal, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { compressImages } from "@/lib/image-compress";
import { sendMessageAction } from "@/server/messaging/actions";
import { initialActionState } from "@/server/errors";

const MAX_FILES = 5;
const MAX_BYTES = 4 * 1024 * 1024;
const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif";

type Picked = { file: File; url: string | null };

/** Ô soạn tin kiểu Zalo: Enter gửi, Shift+Enter xuống dòng; gửi kèm ảnh (chụp/chọn/dán) và tệp. */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, action] = useActionState(sendMessageAction, initialActionState);
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.ok) {
      setText("");
      setPicked((old) => {
        old.forEach((p) => p.url && URL.revokeObjectURL(p.url));
        return [];
      });
      window.setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
    }
  }, [state]);

  async function addFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    setLocalError(null);
    const files = await compressImages([...list]);
    setPicked((old) => {
      const next = [...old, ...files.map((file) => ({ file, url: file.type.startsWith("image/") && !/hei[cf]/.test(file.type) ? URL.createObjectURL(file) : null }))];
      if (next.length > MAX_FILES) setLocalError(`Mỗi tin nhắn tối đa ${MAX_FILES} tệp.`);
      return next.slice(0, MAX_FILES);
    });
  }

  function remove(i: number) {
    setPicked((old) => {
      const url = old[i]?.url;
      if (url) URL.revokeObjectURL(url);
      return old.filter((_, j) => j !== i);
    });
  }

  function submit() {
    if (pending) return;
    const body = text.trim();
    if (!body && picked.length === 0) return;
    const total = picked.reduce((s, p) => s + p.file.size, 0);
    if (total > MAX_BYTES) {
      setLocalError("Tổng dung lượng vượt quá 4 MB. Hãy gửi bớt tệp.");
      return;
    }
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("body", body);
    for (const p of picked) fd.append("files", p.file);
    start(() => action(fd));
  }

  const error = localError ?? (state.ok ? null : state.message);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-paper py-3 lg:bottom-0"
    >
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      {picked.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Tệp sẽ gửi">
          {picked.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="relative">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước cục bộ (blob:)
                <img src={p.url} alt={p.file.name} className="size-16 rounded-control border border-line object-cover" />
              ) : (
                <span className="flex h-16 max-w-44 items-center gap-2 rounded-control border border-line bg-surface px-2 text-xs">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="line-clamp-2 break-all">{p.file.name}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Bỏ ${p.file.name}`}
                className="absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full bg-ink text-white shadow"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-1.5">
        <label className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-primary-soft" title="Gửi ảnh (chụp hoặc chọn)">
          <span className="sr-only">Gửi ảnh</span>
          <ImagePlus className="size-5" aria-hidden="true" />
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-primary-soft" title="Gửi tệp (PDF, Word, Excel…)">
          <span className="sr-only">Gửi tệp</span>
          <Paperclip className="size-5" aria-hidden="true" />
          <input
            type="file"
            accept={FILE_ACCEPT}
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Tin nhắn</span>
          <textarea
            ref={textRef}
            name="body"
            rows={1}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập tin nhắn…"
            className="block max-h-40 min-h-11 w-full resize-y rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-base"
            onPaste={(e) => {
              // Dán ảnh chụp màn hình trực tiếp vào ô chat.
              const images = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
              if (images.length > 0) {
                e.preventDefault();
                void addFiles(images);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <button
          type="submit"
          disabled={pending || (!text.trim() && picked.length === 0)}
          aria-label="Gửi tin nhắn"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-strong disabled:opacity-50"
        >
          <SendHorizontal className="size-5" aria-hidden="true" />
        </button>
      </div>
      {pending && <p className="mt-1 text-xs text-muted">Đang gửi…</p>}
    </form>
  );
}
