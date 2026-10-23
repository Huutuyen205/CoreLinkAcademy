// Khuôn mẫu Word cố định (giáo án, giáo trình, đề + đáp án): AI chỉ cung cấp dữ liệu, bố cục do hệ thống quyết định.
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { LETTERS } from "./rules";
import type { CurriculumOutline, LessonPlan } from "./schemas";

export type DocMeta = { classCode: string; courseTitle: string; subjectName: string; sessionIndex: number; dateLabel: string };

export type ExamQuestion =
  | { type: "MCQ"; prompt: string; options: string[]; correctOption: number; explanation: string; points: number }
  | { type: "SHORT"; prompt: string; acceptedAnswers: string[]; explanation: string; points: number }
  | { type: "ESSAY"; prompt: string; sampleAnswer: string; rubric: { criterion: string; points: number }[]; points: number };

export type ExamData = { title: string; instructions: string; questions: ExamQuestion[] };

const BRAND = "1F2F98";
const MUTED = "5B6178";

const run = (text: string, o: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}) => new TextRun({ text, ...o });

function para(text: string, o: { bold?: boolean; italics?: boolean; color?: string; size?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const { after = 120, align, ...font } = o;
  return new Paragraph({ children: [run(text, font)], spacing: { after }, alignment: align });
}

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) =>
  new Paragraph({ heading: level, children: [run(text, { bold: true, color: BRAND })], spacing: { before: 240, after: 120 } });

const bullet = (text: string) => new Paragraph({ children: [run(text)], bullet: { level: 0 }, spacing: { after: 60 } });

function frame(title: string, subtitle: string, body: (Paragraph | Table)[]): Document {
  return new Document({
    creator: "Core Link Academy",
    title,
    sections: [
      {
        headers: { default: new Header({ children: [new Paragraph({ children: [run("CORE LINK ACADEMY", { bold: true, color: BRAND, size: 18 }), run(`   ${subtitle}`, { color: MUTED, size: 18 })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Tạo bằng trợ lý soạn bài — giáo viên cần kiểm tra lại trước khi sử dụng", { italics: true, color: MUTED, size: 16 })] })] }) },
        children: body,
      },
    ],
  });
}

const metaLine = (m: DocMeta) => `Lớp ${m.classCode} · ${m.courseTitle} · ${m.subjectName} · Buổi ${m.sessionIndex}${m.dateLabel ? ` · ${m.dateLabel}` : ""}`;

const cell = (children: Paragraph[], widthPct: number, shade?: string) =>
  new TableCell({ children, width: { size: widthPct, type: WidthType.PERCENTAGE }, shading: shade ? { fill: shade } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } });

const headCell = (text: string, widthPct: number) => cell([para(text, { bold: true, after: 0 })], widthPct, "E6ECFF");

const toBytes = async (doc: Document) => new Uint8Array(await Packer.toBuffer(doc));

export async function renderLessonPlanDocx(plan: LessonPlan, meta: DocMeta): Promise<Uint8Array<ArrayBuffer>> {
  const body: (Paragraph | Table)[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [run("GIÁO ÁN", { bold: true, color: BRAND })], spacing: { after: 60 } }),
    para(plan.title, { bold: true, size: 28 }),
    para(metaLine(meta), { color: MUTED, after: 200 }),
    heading("1. Mục tiêu"),
    ...plan.objectives.map(bullet),
  ];
  if (plan.materials.length > 0) body.push(heading("2. Chuẩn bị"), ...plan.materials.map(bullet));
  body.push(
    heading("3. Tiến trình dạy học"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: [headCell("Hoạt động", 22), headCell("Phút", 8), headCell("Nội dung", 34), headCell("Giáo viên", 18), headCell("Học sinh", 18)] }),
        ...plan.activities.map(
          (a) =>
            new TableRow({
              children: [cell([para(a.name, { bold: true, after: 0 })], 22), cell([para(String(a.minutes), { after: 0 })], 8), cell([para(a.description, { after: 0 })], 34), cell([para(a.teacherActions, { after: 0 })], 18), cell([para(a.studentActions, { after: 0 })], 18)],
            }),
        ),
      ],
    }),
    heading("4. Đánh giá"),
    para(plan.assessment),
  );
  if (plan.homework) body.push(heading("5. Bài về nhà"), para(plan.homework));
  if (plan.notes) body.push(heading("6. Ghi chú"), para(plan.notes, { italics: true, color: MUTED }));
  return toBytes(frame(plan.title, "Giáo án", body));
}

export async function renderCurriculumDocx(c: CurriculumOutline, meta: DocMeta): Promise<Uint8Array<ArrayBuffer>> {
  const body: (Paragraph | Table)[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [run("GIÁO TRÌNH BUỔI HỌC", { bold: true, color: BRAND })], spacing: { after: 60 } }),
    para(c.title, { bold: true, size: 28 }),
    para(metaLine(meta), { color: MUTED, after: 200 }),
    heading("Tóm tắt"),
    para(c.summary),
    heading("Chuẩn đầu ra"),
    ...c.outcomes.map(bullet),
  ];
  for (const s of c.sections) {
    body.push(heading(s.heading), para(s.content), ...s.keyPoints.map(bullet));
  }
  return toBytes(frame(c.title, "Giáo trình", body));
}

const optionLines = (q: Extract<ExamQuestion, { type: "MCQ" }>) =>
  q.options.map((o, i) => new Paragraph({ children: [run(`${LETTERS[i]}. ${o}`)], indent: { left: 480 }, spacing: { after: 40 } }));

const pointsLabel = (n: number) => `${n.toString().replace(".", ",")} điểm`;

/** Đề (cho học sinh, không có đáp án) + trang riêng "Đáp án và hướng dẫn chấm" (cho giáo viên). */
export async function renderExamDocx(exam: ExamData, meta: DocMeta, kindLabel: string): Promise<Uint8Array<ArrayBuffer>> {
  const total = exam.questions.reduce((s, q) => s + q.points, 0);
  const body: (Paragraph | Table)[] = [
    para(exam.title.toUpperCase(), { bold: true, size: 30, align: AlignmentType.CENTER, color: BRAND, after: 60 }),
    para(metaLine(meta), { color: MUTED, align: AlignmentType.CENTER, after: 160 }),
    para("Họ và tên: ................................................   Lớp: ............   Ngày: ..../..../........", { after: 160 }),
  ];
  if (exam.instructions) body.push(para(`Hướng dẫn: ${exam.instructions}`, { italics: true }));
  body.push(para(`Tổng điểm: ${pointsLabel(total)}`, { bold: true, after: 200 }));

  exam.questions.forEach((q, i) => {
    body.push(new Paragraph({ children: [run(`Câu ${i + 1} `, { bold: true }), run(`(${pointsLabel(q.points)}) `, { color: MUTED }), run(q.prompt)], spacing: { before: 160, after: 80 } }));
    if (q.type === "MCQ") body.push(...optionLines(q));
    else if (q.type === "SHORT") body.push(para("Trả lời: ................................................................", { after: 60 }));
    else for (let k = 0; k < 6; k++) body.push(new Paragraph({ children: [run(" ")], border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: "9AA0B5", space: 4 } }, spacing: { after: 100 } }));
  });

  // ─── Đáp án (trang riêng, chỉ cho giáo viên) ───
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(para(`ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM — ${exam.title}`, { bold: true, size: 26, color: BRAND, after: 120 }));
  body.push(para("Chỉ dành cho giáo viên. Không phát cho học sinh.", { italics: true, color: "B42318" }));
  const rows: TableRow[] = [new TableRow({ tableHeader: true, children: [headCell("Câu", 8), headCell("Đáp án", 40), headCell("Điểm", 10), headCell("Giải thích / thang điểm", 42)] })];
  exam.questions.forEach((q, i) => {
    let answer: string;
    let explain: string;
    if (q.type === "MCQ") {
      answer = `${LETTERS[q.correctOption]}. ${q.options[q.correctOption] ?? ""}`;
      explain = q.explanation;
    } else if (q.type === "SHORT") {
      answer = q.acceptedAnswers.join("  |  ");
      explain = q.explanation;
    } else {
      answer = q.sampleAnswer;
      explain = q.rubric.map((r) => `• ${r.criterion}: ${pointsLabel(r.points)}`).join("\n");
    }
    rows.push(
      new TableRow({
        children: [
          cell([para(String(i + 1), { bold: true, after: 0 })], 8),
          cell(answer.split("\n").map((l) => para(l, { after: 0 })), 40),
          cell([para(q.points.toString().replace(".", ","), { after: 0 })], 10),
          cell((explain || "—").split("\n").map((l) => para(l, { after: 0 })), 42),
        ],
      }),
    );
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  return toBytes(frame(exam.title, kindLabel, body));
}
