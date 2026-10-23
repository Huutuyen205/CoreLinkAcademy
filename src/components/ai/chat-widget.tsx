"use client";

import { Bot, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/format";
import { askAssistantAction } from "@/server/ai/chat/actions";
import type { ChatAnswer, ChatChoice } from "@/server/ai/chat/types";

type Suggestion = { intent: string; label: string };

type Message = { id: number; from: "user" | "bot"; text: string; answer?: ChatAnswer; error?: boolean };

type Props = {
  suggestions: Suggestion[];
  /** Đang chạy bản mẫu (chưa nối AI thật): chatbot vẫn trả lời bằng dữ liệu thật qua luật từ khóa. */
  mock: boolean;
  userName: string;
  hasBottomNav: boolean;
};

const chipClass =
  "rounded-full border border-primary/30 bg-surface px-3 py-1.5 text-left text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-60";

/** Trợ lý hỏi đáp nổi ở mọi trang nội bộ. Dữ liệu trả lời do server lấy bằng service có kiểm tra phạm vi (DECISION-D33). */
export function ChatWidget({ suggestions, mock, userName, hasBottomNav }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function ask(echo: string, request: { text?: string; intent?: string; childId?: string; day?: number; classCode?: string }) {
    if (pending) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: echo }]);
    startTransition(async () => {
      try {
        const res = await askAssistantAction(request);
        setMessages((m) => [...m, res.ok ? { id: nextId.current++, from: "bot", text: res.answer.text, answer: res.answer } : { id: nextId.current++, from: "bot", text: res.message, error: true }]);
      } catch {
        setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: "Có lỗi khi kết nối. Vui lòng thử lại.", error: true }]);
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    ask(text, { text });
  }

  const choose = (c: ChatChoice) => ask(c.label, { intent: c.intent, childId: c.childId, day: c.day, classCode: c.classCode });

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý hỏi đáp"
          className={cn(
            "fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6",
            hasBottomNav ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]" : "bottom-4",
          )}
        >
          <Bot className="size-7" aria-hidden="true" />
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý Core Link"
          className={cn(
            "fixed inset-x-3 z-50 flex h-[min(600px,78dvh)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px] lg:bottom-6 lg:right-6",
            hasBottomNav ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]" : "bottom-4",
          )}
        >
          <header className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light px-4 py-3 text-white">
            <Sparkles className="size-5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Trợ lý Core Link</p>
              <p className="text-xs text-white/80">{mock ? "Chế độ mẫu · trả lời bằng dữ liệu thật" : "Trả lời bằng dữ liệu thật của hệ thống"}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý" className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/15">
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-paper px-3.5 py-2.5 text-sm">
              <p>Xin chào {userName}! Bạn có thể hỏi nhanh bằng cách bấm câu gợi ý hoặc tự gõ câu hỏi.</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s.intent} type="button" disabled={pending} className={chipClass} onClick={() => ask(s.label, { intent: s.intent })}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-white">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className={cn("max-w-[92%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm", m.error ? "bg-danger-soft text-danger" : "bg-paper")}>
                  <p className="whitespace-pre-line font-medium">{m.text}</p>
                  {m.answer && m.answer.lines.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {m.answer.lines.map((l, i) => (
                        <li key={i} className="whitespace-pre-line rounded-lg border border-line bg-surface px-2.5 py-1.5">
                          {l}
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.answer && m.answer.links.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.answer.links.map((l) => (
                        <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary no-underline hover:bg-primary hover:text-white">
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.answer && m.answer.choices.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.answer.choices.map((c) => (
                        <button key={`${c.intent}-${c.childId ?? ""}-${c.label}`} type="button" disabled={pending} className={chipClass} onClick={() => choose(c)}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}

            {pending && (
              <div className="max-w-[60%] rounded-2xl rounded-tl-sm bg-paper px-3.5 py-2.5 text-sm text-muted" role="status">
                Đang tra cứu…
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
            <label htmlFor="chat-input" className="sr-only">
              Câu hỏi của bạn
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="Nhập câu hỏi…"
              autoComplete="off"
              className="min-h-11 flex-1 rounded-control border border-line-strong bg-surface px-3 text-base focus-visible:border-primary"
            />
            <button type="submit" disabled={pending || !input.trim()} aria-label="Gửi câu hỏi" className="inline-flex size-11 items-center justify-center rounded-control bg-primary text-white hover:bg-primary-strong disabled:opacity-60">
              <Send className="size-5" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
