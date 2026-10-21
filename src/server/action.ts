import { notFound } from "next/navigation";
import type { z } from "zod";
import { DomainError, ForbiddenError, type ActionState } from "./errors";
import { fieldErrorsOf } from "./validation";

/**
 * Chạy phần nghiệp vụ của một Server Action: DomainError → thông báo form, ForbiddenError → 404 (DECISION-D11).
 * `redirect()` phải gọi SAU hàm này, không gọi bên trong `fn`.
 */
export async function runAction<T>(
  fn: () => Promise<T>,
  values?: Record<string, string>,
): Promise<{ ok: true; value: T } | { ok: false; state: ActionState }> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    if (error instanceof DomainError) {
      return { ok: false, state: { ok: false, message: error.message, fieldErrors: error.fieldErrors, details: error.details, values } };
    }
    throw error;
  }
}

/** Parse dữ liệu form bằng Zod; trả dữ liệu hoặc ActionState lỗi (kèm giá trị đã gửi để điền lại). */
export function parseForm<S extends z.ZodTypeAny>(
  schema: S,
  data: Record<string, unknown>,
): { ok: true; data: z.infer<S> } | { ok: false; state: ActionState } {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    state: {
      ok: false,
      message: "Vui lòng kiểm tra lại các ô được đánh dấu.",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: stringValues(data),
    },
  };
}

export function stringValues(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) if (typeof v === "string") out[k] = v;
  return out;
}

/** Lấy các trường dạng chuỗi từ FormData (thiếu → chuỗi rỗng). */
export function formFields(formData: FormData, names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    const value = formData.get(name);
    out[name] = typeof value === "string" ? value : "";
  }
  return out;
}

/** Danh sách id từ checkbox cùng tên, giới hạn số lượng và độ dài. */
export function formIds(formData: FormData, name: string, max = 200): string[] {
  return formData
    .getAll(name)
    .filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 40)
    .slice(0, max);
}
