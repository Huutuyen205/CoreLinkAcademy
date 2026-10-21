import type { z } from "zod";

/** Lỗi Zod → `{ tênÔ: thông báo đầu tiên }` cho `ActionState.fieldErrors`. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}
