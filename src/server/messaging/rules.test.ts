import { describe, expect, it } from "vitest";
import { canDirectMessageClassmate, directMessageRequirement } from "./rules";

const p = (id: string, role: "ADMIN" | "STAFF" | "TEACHER" | "STUDENT" | "PARENT") => ({ id, role });

describe("directMessageRequirement", () => {
  it("không tự nhắn cho mình", () => {
    expect(directMessageRequirement(p("a", "TEACHER"), p("a", "TEACHER"))).toBe("never");
  });
  it("trung tâm nhắn được mọi người và ngược lại", () => {
    expect(directMessageRequirement(p("a", "ADMIN"), p("b", "STUDENT"))).toBe("always");
    expect(directMessageRequirement(p("b", "PARENT"), p("a", "ADMIN"))).toBe("always");
  });
  it("HS ↔ PH chỉ khi là phụ huynh của em", () => {
    expect(directMessageRequirement(p("s", "STUDENT"), p("pa", "PARENT"))).toBe("guardian");
    expect(directMessageRequirement(p("pa", "PARENT"), p("s", "STUDENT"))).toBe("guardian");
  });
  it("còn lại phải cùng lớp", () => {
    expect(directMessageRequirement(p("s1", "STUDENT"), p("s2", "STUDENT"))).toBe("shared-class");
    expect(directMessageRequirement(p("s1", "STUDENT"), p("t", "TEACHER"))).toBe("shared-class");
    expect(directMessageRequirement(p("pa", "PARENT"), p("pb", "PARENT"))).toBe("shared-class");
  });
});

describe("canDirectMessageClassmate", () => {
  it("bạn cùng lớp và giáo viên: được", () => {
    expect(canDirectMessageClassmate(p("s1", "STUDENT"), p("s2", "STUDENT"), false)).toBe(true);
    expect(canDirectMessageClassmate(p("s1", "STUDENT"), p("t", "TEACHER"), false)).toBe(true);
  });
  it("học sinh với phụ huynh nhà khác: không", () => {
    expect(canDirectMessageClassmate(p("s1", "STUDENT"), p("pb", "PARENT"), false)).toBe(false);
    expect(canDirectMessageClassmate(p("s1", "STUDENT"), p("pa", "PARENT"), true)).toBe(true);
  });
});
