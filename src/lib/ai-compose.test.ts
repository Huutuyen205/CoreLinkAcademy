import { describe, expect, it } from "vitest";
import { GENERATE_KINDS } from "@/server/ai/generate/schemas";
import { COMPOSE_KINDS, composeFlashCode, composeHrefFor, composeKindBySlug, pickSessionId } from "./ai-compose";

describe("soạn bài AI — mỗi loại một form", () => {
  it("mỗi loại nội dung có đúng một trang, slug không trùng", () => {
    expect([...new Set(COMPOSE_KINDS.map((k) => k.kind))].sort()).toEqual([...GENERATE_KINDS].sort());
    expect(new Set(COMPOSE_KINDS.map((k) => k.slug)).size).toBe(COMPOSE_KINDS.length);
    expect(composeKindBySlug("giao-an")?.kind).toBe("lesson_plan");
    expect(composeKindBySlug("khong-co")).toBeUndefined();
  });

  it("chỉ loại đề mới có số câu (và lưu thành bài tập nháp)", () => {
    for (const k of COMPOSE_KINDS) expect(Boolean(k.count)).toBe(k.exam);
  });

  it("slide xem trước rồi mới lưu; đề bổ sung giao riêng một học sinh", () => {
    expect(composeKindBySlug("slide")?.preview).toBe(true);
    expect(COMPOSE_KINDS.filter((k) => k.preview)).toHaveLength(1);
    const extra = composeKindBySlug("bo-sung");
    expect(extra).toMatchObject({ kind: "exercises", forStudent: true, exam: true });
  });

  it("giữ ngữ cảnh buổi/lớp khi sang form", () => {
    expect(composeHrefFor("slide", { buoi: "b 1" })).toBe("/giao-vien/soan-bai/slide?buoi=b%201");
    expect(composeHrefFor("slide", { lop: "L1" })).toBe("/giao-vien/soan-bai/slide?lop=L1");
    expect(composeHrefFor("slide")).toBe("/giao-vien/soan-bai/slide");
  });

  it("mã thông báo theo nơi lưu và bản mẫu", () => {
    expect(composeFlashCode("quiz", false)).toBe("tao-bai-ai");
    expect(composeFlashCode("essay", true)).toBe("tao-tu-luan-ai-mau");
    expect(composeFlashCode("slides", false)).toBe("tao-tai-lieu-ai");
    expect(composeFlashCode("exercises", true, true)).toBe("tao-de-bo-sung-ai-mau");
  });

  it("chọn buổi mở sẵn: đúng buổi, hoặc buổi sắp tới của lớp, hoặc buổi cuối", () => {
    const at = (day: number) => new Date(Date.UTC(2026, 9, day));
    const sessions = [
      { id: "a1", classId: "A", startsAt: at(1) },
      { id: "a2", classId: "A", startsAt: at(10) },
      { id: "b1", classId: "B", startsAt: at(2) },
    ];
    const now = at(5).getTime();
    expect(pickSessionId(sessions, { buoi: "b1" }, now)).toBe("b1");
    expect(pickSessionId(sessions, { lop: "A" }, now)).toBe("a2");
    expect(pickSessionId(sessions, { lop: "B" }, now)).toBe("b1");
    expect(pickSessionId(sessions, { buoi: "x" }, now)).toBeUndefined();
  });
});
