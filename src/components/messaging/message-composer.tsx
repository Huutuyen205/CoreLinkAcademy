"use client";

import { SendHorizontal } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendMessageAction } from "@/server/messaging/actions";
import { initialActionState } from "@/server/errors";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Gửi tin nhắn"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-strong disabled:opacity-60"
    >
      <SendHorizontal className="size-5" aria-hidden="true" />
    </button>
  );
}

/** Ô soạn tin: Enter gửi, Shift+Enter xuống dòng. */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, action] = useActionState(sendMessageAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.ok ? {} : (state.values ?? {});

  useEffect(() => {
    if (state.ok) window.scrollTo({ top: document.body.scrollHeight });
  }, [state]);

  return (
    <form ref={formRef} action={action} className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-paper py-3 lg:bottom-0">
      <input type="hidden" name="conversationId" value={conversationId} />
      {state.message && !state.ok && <p className="mb-2 text-sm text-danger">{state.message}</p>}
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Tin nhắn</span>
          <textarea
            name="body"
            rows={1}
            maxLength={2000}
            required
            defaultValue={v.body}
            placeholder="Nhập tin nhắn…"
            className="block max-h-40 min-h-11 w-full resize-y rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
        </label>
        <SendButton />
      </div>
    </form>
  );
}
