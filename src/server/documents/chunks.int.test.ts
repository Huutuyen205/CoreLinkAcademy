import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { findExcerpts, MAX_EXCERPT_CHARS, MAX_EXCERPTS } from "@/server/ai/generate/retrieval";
import { loadSessionContext } from "@/server/ai/generate/context";
import { cleanup, createCatalog, createUser, makeTag } from "@/test/fixtures";
import { createDocument, deleteDocumentFile } from "./service";

const tag = makeTag();
const bytes = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;
const txt = (name: string, body: string) => ({ fileName: name, mimeType: "text/plain", size: body.length, data: bytes(body) });
const base = { description: null, url: null, levelId: null, visibleToStudents: true, visibleToParents: false };

let owner: Actor, other: Actor;
let classId: string, otherClassId: string, sessionId: string, subjectId: string;

describe.skipIf(!process.env.TEST_DATABASE_URL)("Trích văn bản tài liệu và truy xuất đoạn cho AI (integration)", () => {
  beforeAll(async () => {
    [owner, other] = await Promise.all([createUser(tag, "TEACHER"), createUser(tag, "TEACHER")]);
    const cat = await createCatalog(tag);
    subjectId = cat.subject.id;
    const mk = (code: string, teacherId: string) =>
      db.class.create({ data: { code: `${tag.toUpperCase()}-${code}`, courseId: cat.course.id, teacherId, startDate: new Date(), weekdays: "1,3,5", startTime: "14:00", endTime: "15:30", totalSessions: 4, capacity: 12 }, select: { id: true } });
    classId = (await mk("A", owner.id)).id;
    otherClassId = (await mk("B", other.id)).id;
    sessionId = (
      await db.classSession.create({ data: { classId, index: 2, startsAt: new Date(Date.now() + 3_600_000), endsAt: new Date(Date.now() + 7_200_000), teacherId: owner.id }, select: { id: true } })
    ).id;
    await db.course.update({
      where: { id: cat.course.id },
      data: { syllabus: [{ title: "Số học", detail: "" }, { title: "Phương trình bậc hai", detail: "Công thức nghiệm", knowledge: "Delta, nghiệm kép" }, { title: "Vi-ét", detail: "" }, { title: "Ôn tập", detail: "" }] },
    });
  });

  afterAll(async () => {
    await db.document.deleteMany({ where: { ownerId: { in: [owner.id, other.id] } } }); // kéo theo tệp + đoạn (CASCADE)
    await cleanup(tag);
  });

  it("tải tệp lên → trích đoạn; tìm không dấu, khớp từ khóa; tối đa vài đoạn ngắn", async () => {
    await createDocument(owner, { ...base, kind: "MATERIAL", title: `Chương 4 ${tag}`, subjectId, sessionId: null }, [
      txt("c4.txt", `Phương trình bậc hai ax² + bx + c = 0. Công thức nghiệm dùng biệt thức Delta.\n\n${"Nội dung không liên quan về hình học. ".repeat(50)}\n\nHệ thức Vi-ét cho tổng và tích hai nghiệm.`),
    ], [classId]);

    const ctx = await loadSessionContext(owner, sessionId);
    expect(ctx.syllabusItem).toMatchObject({ title: "Phương trình bậc hai", knowledge: "Delta, nghiệm kép" });

    const found = await findExcerpts(owner, ctx, "");
    expect(found.length).toBeGreaterThan(0);
    expect(found.length).toBeLessThanOrEqual(MAX_EXCERPTS);
    expect(found[0]!.text.toLowerCase()).toContain("delta");
    for (const e of found) expect(e.text.length).toBeLessThanOrEqual(MAX_EXCERPT_CHARS);
  });

  it("giáo viên không thấy đoạn của tài liệu mình không có quyền xem", async () => {
    // Tài liệu riêng của GV khác (không chia sẻ cho lớp của owner, không phải giáo trình chung).
    await createDocument(other, { ...base, kind: "LESSON_PLAN", title: `Giáo án bí mật ${tag}`, subjectId: null, sessionId: null, visibleToStudents: false }, [txt("bimat.txt", "Phương trình bậc hai: đáp án bí mật XYZ-SECRET.")]);
    const ctx = await loadSessionContext(owner, sessionId);
    const found = await findExcerpts(owner, ctx, "phương trình bậc hai");
    expect(found.some((e) => e.text.includes("XYZ-SECRET"))).toBe(false);
    expect(otherClassId).toBeTruthy();
  });

  it("xóa tệp thì xóa luôn đoạn đã trích; tệp AI sinh ra (index:false) không được lập chỉ mục", async () => {
    const id = await createDocument(owner, { ...base, kind: "MATERIAL", title: `Tài liệu tạm ${tag}`, subjectId, sessionId: null }, [txt("tam.txt", "Tài liệu về căn bậc hai và lũy thừa.")], [classId]);
    const file = await db.storedFile.findFirstOrThrow({ where: { documentId: id }, select: { id: true } });
    expect(await db.documentChunk.count({ where: { documentId: id } })).toBeGreaterThan(0);
    // Giữ lại tệp thứ hai để được phép xóa tệp đầu (tài liệu cần ít nhất tệp hoặc liên kết).
    await db.document.update({ where: { id }, data: { url: "https://example.com" } });
    await deleteDocumentFile(owner, id, file.id);
    expect(await db.documentChunk.count({ where: { documentId: id } })).toBe(0);

    const ai = await createDocument(owner, { ...base, kind: "MATERIAL", title: `Do AI ${tag}`, subjectId, sessionId: null }, [txt("ai.txt", "Nội dung do AI sinh ra")], [], { index: false });
    expect(await db.documentChunk.count({ where: { documentId: ai } })).toBe(0);
  });
});
