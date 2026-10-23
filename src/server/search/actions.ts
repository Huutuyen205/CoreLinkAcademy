"use server";

import { requireActor } from "@/server/auth/guard";
import { globalSearch, type SearchGroup } from "./service";

/** FEAT-B6: tìm nhanh (Ctrl+K). Phạm vi kiểm tra lại trong `globalSearch` theo vai trò. */
export async function globalSearchAction(query: string): Promise<SearchGroup[]> {
  const actor = await requireActor();
  if (typeof query !== "string") return [];
  return globalSearch(actor, query);
}
