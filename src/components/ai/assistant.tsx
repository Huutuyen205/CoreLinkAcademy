import { aiStatus } from "@/server/ai/client";
import { suggestionsForRole } from "@/server/ai/chat/intents";
import type { Actor } from "@/server/auth/session";
import { ChatWidget } from "./chat-widget";

/** Trợ lý hỏi đáp nổi, gắn vào vỏ khu nội bộ (mọi vai trò). */
export function Assistant({ actor, hasBottomNav }: { actor: Actor; hasBottomNav: boolean }) {
  return <ChatWidget suggestions={suggestionsForRole(actor.role)} mock={aiStatus().mock} userName={actor.fullName} hasBottomNav={hasBottomNav} />;
}
