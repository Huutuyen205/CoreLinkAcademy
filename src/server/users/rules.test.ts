import { describe, expect, it } from "vitest";
import { canAddGuardian, MAX_GUARDIANS } from "./rules";

describe("liên kết phụ huynh BR-008", () => {
  it("TC-037 liên kết phụ huynh thứ 5 bị chặn", () => {
    expect(MAX_GUARDIANS).toBe(4);
    expect(canAddGuardian(3)).toBe(true);
    expect(canAddGuardian(4)).toBe(false);
  });
});
