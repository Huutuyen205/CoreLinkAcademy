// Chọn khuôn mẫu theo loại nội dung → tệp .docx / .pptx.
import { renderCurriculumDocx, renderExamDocx, renderLessonPlanDocx, type DocMeta } from "./render-docx";
import { renderSlidesPptx } from "./render-pptx";
import { KIND_LABELS, type GeneratedContent } from "./schemas";
import { toExamData } from "./exam";

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type Rendered = { data: Uint8Array<ArrayBuffer>; mimeType: string; ext: "docx" | "pptx" };

export async function render(content: GeneratedContent, meta: DocMeta): Promise<Rendered> {
  switch (content.kind) {
    case "lesson_plan":
      return { data: await renderLessonPlanDocx(content.data, meta), mimeType: DOCX_MIME, ext: "docx" };
    case "curriculum":
      return { data: await renderCurriculumDocx(content.data, meta), mimeType: DOCX_MIME, ext: "docx" };
    case "slides":
      return { data: await renderSlidesPptx(content.data, meta), mimeType: PPTX_MIME, ext: "pptx" };
    default: {
      const exam = toExamData(content)!;
      return { data: await renderExamDocx(exam, meta, KIND_LABELS[content.kind]), mimeType: DOCX_MIME, ext: "docx" };
    }
  }
}
