import { notFound } from "next/navigation";
import { ForbiddenError } from "./errors";

/** Dùng trong Server Component: sai phạm vi/không tồn tại → trang 404 (DECISION-D11). */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }
}
