"use server";

import { z } from "zod";
import { requireActor } from "@/server/auth/guard";
import { DomainError } from "@/server/errors";
import { askAssistant } from "./service";
import type { ChatAnswer } from "./types";

const requestSchema = z.object({
  text: z.string().max(1000).optional(),
  intent: z.string().max(60).optional(),
  childId: z.string().max(40).optional(),
  day: z.number().int().min(-7).max(7).optional(),
  classCode: z.string().max(60).optional(),
});

export type AskResult = { ok: true; answer: ChatAnswer } | { ok: false; message: string };

/** Hỏi trợ lý. Phiên + vai trò kiểm tra phía server; dữ liệu trả về do service có kiểm tra phạm vi cung cấp. */
export async function askAssistantAction(input: z.input<typeof requestSchema>): Promise<AskResult> {
  const actor = await requireActor();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Câu hỏi không hợp lệ." };
  try {
    return { ok: true, answer: await askAssistant(actor, parsed.data) };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message };
    throw error;
  }
}
