// Nội dung MẪU cho chế độ mock (không cần API): đủ để chạy thử mọi luồng giáo án → slide → đề → lưu bài tập nháp.
// Toán lớp 9 (phương trình bậc hai) và Tiếng Anh (thì hiện tại hoàn thành); môn khác dùng bộ chung.
import type { GenerateKind } from "./schemas";

export type SubjectGroup = "math" | "english" | "other";

export type MockGenCtx = {
  kind: GenerateKind;
  group: SubjectGroup;
  topic: string;
  courseTitle: string;
  sessionIndex: number;
  count: number;
};

export function subjectGroupOf(subjectName: string): SubjectGroup {
  const s = subjectName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
  if (/\btoan\b|math/.test(s)) return "math";
  if (/\banh\b|english|tieng anh/.test(s)) return "english";
  return "other";
}

type Mcq = { type: "MCQ"; prompt: string; options: string[]; correctOption: number; explanation: string; figure?: unknown };
type Short = { type: "SHORT"; prompt: string; acceptedAnswers: string[]; explanation: string; figure?: unknown };

// Hình minh họa mẫu (DECISION-D43) — cùng khuôn JSON AI thật phải trả.
const FIG_QUADRATIC_GRAPH = { type: "function", expr: "x^2-4x+3", xMin: -1, xMax: 5, caption: "Đồ thị hàm số y = x² − 4x + 3" };
const FIG_RIGHT_TRIANGLE = { type: "geometry", points: { A: [0, 0], B: [0, 3], C: [4, 0] }, segments: ["AB", "BC", "CA"], rightAngles: ["BAC"], caption: "Tam giác ABC vuông tại A" };
const FIG_ROOT_FORMULA = { type: "formula", latex: "\\Delta = b^2 - 4ac,\\qquad x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}", caption: "Công thức nghiệm (khi Δ ≥ 0)" };
const FIG_PARABOLA = { type: "function", expr: "x^2-5x+6", xMin: -1, xMax: 6, points: [{ x: 2, y: 0, label: "A" }, { x: 3, y: 0, label: "B" }], caption: "Parabol cắt Ox tại hai nghiệm x = 2 và x = 3" };
const FIG_SOLUTION_SET = { type: "numberline", intervals: [{ from: null, to: 10, closed: [false, false] }], caption: "Tập giá trị m < 10" };

const MATH_MCQ: Mcq[] = [
  { type: "MCQ", prompt: "Phương trình nào sau đây là phương trình bậc hai một ẩn?", options: ["2x + 1 = 0", "x² − 5x + 6 = 0", "x³ − 1 = 0", "1/x + 2 = 0"], correctOption: 1, explanation: "Phương trình bậc hai có dạng ax² + bx + c = 0 với a ≠ 0." },
  { type: "MCQ", prompt: "Biệt thức Δ của phương trình x² − 4x + 3 = 0 bằng bao nhiêu?", options: ["4", "28", "−4", "16"], correctOption: 0, explanation: "Δ = b² − 4ac = 16 − 12 = 4." },
  { type: "MCQ", prompt: "Nghiệm của phương trình x² − 5x + 6 = 0 là:", options: ["x = 1 và x = 6", "x = 2 và x = 3", "x = −2 và x = −3", "x = 5 và x = 6"], correctOption: 1, explanation: "Δ = 1 nên x = (5 ± 1)/2, tức x = 3 hoặc x = 2." },
  { type: "MCQ", prompt: "Theo định lí Vi-ét, tổng hai nghiệm của phương trình x² − 7x + 10 = 0 bằng:", options: ["−7", "7", "10", "−10"], correctOption: 1, explanation: "x₁ + x₂ = −b/a = 7." },
  { type: "MCQ", prompt: "Phương trình x² + 2x + 5 = 0:", options: ["Có hai nghiệm phân biệt", "Có nghiệm kép", "Vô nghiệm", "Có vô số nghiệm"], correctOption: 2, explanation: "Δ = 4 − 20 = −16 < 0 nên phương trình vô nghiệm." },
  {
    type: "MCQ",
    prompt: "Dựa vào đồ thị hàm số y = x² − 4x + 3 ở hình dưới, phương trình x² − 4x + 3 = 0 có bao nhiêu nghiệm?",
    options: ["0", "1", "2", "3"],
    correctOption: 2,
    explanation: "Đồ thị cắt trục Ox tại hai điểm (x = 1 và x = 3) nên phương trình có 2 nghiệm.",
    figure: FIG_QUADRATIC_GRAPH,
  },
];

const MATH_SHORT: Short[] = [
  { type: "SHORT", prompt: "Cho tam giác ABC vuông tại A có AB = 3 cm, AC = 4 cm (hình dưới). Tính độ dài BC (đơn vị cm).", acceptedAnswers: ["5", "5 cm", "5cm"], explanation: "Theo định lí Pythagore: BC² = AB² + AC² = 9 + 16 = 25 nên BC = 5 cm.", figure: FIG_RIGHT_TRIANGLE },
  { type: "SHORT", prompt: "Giải phương trình x² − 9 = 0. Viết hai nghiệm cách nhau bằng dấu phẩy, theo thứ tự tăng dần.", acceptedAnswers: ["-3, 3", "-3,3", "−3, 3", "−3,3", "x = -3, x = 3"], explanation: "x² = 9 nên x = −3 hoặc x = 3." },
  { type: "SHORT", prompt: "Tính tích hai nghiệm của phương trình x² − 7x + 10 = 0.", acceptedAnswers: ["10"], explanation: "x₁·x₂ = c/a = 10." },
  { type: "SHORT", prompt: "Tìm m để phương trình x² − 2x + m = 0 có nghiệm kép.", acceptedAnswers: ["1", "m = 1", "m=1"], explanation: "Δ = 4 − 4m = 0 nên m = 1." },
];

const MATH_ESSAY = [
  {
    type: "ESSAY" as const,
    prompt: "Giải phương trình 2x² − 7x + 3 = 0. Trình bày các bước tính biệt thức Δ và hai nghiệm.",
    sampleAnswer: "Δ = (−7)² − 4·2·3 = 49 − 24 = 25 > 0, √Δ = 5. Hai nghiệm: x₁ = (7 + 5)/4 = 3 và x₂ = (7 − 5)/4 = 1/2.",
    rubric: [
      { criterion: "Xác định đúng a, b, c và tính đúng Δ = 25", points: 1 },
      { criterion: "Kết luận Δ > 0 nên có hai nghiệm phân biệt", points: 0.5 },
      { criterion: "Tính đúng hai nghiệm x = 3 và x = 1/2", points: 1.5 },
    ],
    points: 3,
  },
  {
    type: "ESSAY" as const,
    prompt: "Cho phương trình x² − 6x + m − 1 = 0. Tìm m để phương trình có hai nghiệm phân biệt.",
    sampleAnswer: "Δ' = 9 − (m − 1) = 10 − m. Phương trình có hai nghiệm phân biệt khi Δ' > 0, tức m < 10.",
    rubric: [
      { criterion: "Tính đúng Δ' (hoặc Δ) theo m", points: 1 },
      { criterion: "Đặt điều kiện Δ' > 0 và giải đúng m < 10", points: 1 },
    ],
    points: 2,
  },
];

const EN_MCQ: Mcq[] = [
  { type: "MCQ", prompt: "She ___ in Hanoi since 2018.", options: ["lives", "has lived", "lived", "is living"], correctOption: 1, explanation: "Dùng thì hiện tại hoàn thành với 'since + mốc thời gian'." },
  { type: "MCQ", prompt: "I have never ___ sushi.", options: ["eat", "ate", "eaten", "eating"], correctOption: 2, explanation: "Hiện tại hoàn thành: have/has + quá khứ phân từ (eaten)." },
  { type: "MCQ", prompt: "They have been friends ___ ten years.", options: ["since", "for", "ago", "during"], correctOption: 1, explanation: "'for' + khoảng thời gian; 'since' + mốc thời gian." },
  { type: "MCQ", prompt: "Which sentence is correct?", options: ["He has went to school.", "He has gone to school.", "He have gone to school.", "He gone to school."], correctOption: 1, explanation: "Chủ ngữ 'He' đi với 'has', động từ ở dạng quá khứ phân từ 'gone'." },
  { type: "MCQ", prompt: "We ___ our homework yet.", options: ["didn't finish", "haven't finished", "hasn't finished", "don't finished"], correctOption: 1, explanation: "'yet' trong câu phủ định thường đi với hiện tại hoàn thành." },
];

const EN_SHORT: Short[] = [
  { type: "SHORT", prompt: "Complete the sentence with the correct form of the verb: She ___ (visit) Da Nang three times.", acceptedAnswers: ["has visited"], explanation: "She + has + visited." },
  { type: "SHORT", prompt: "Complete the sentence: We ___ (not see) that film yet.", acceptedAnswers: ["haven't seen", "have not seen"], explanation: "We + have not + seen." },
  { type: "SHORT", prompt: "Complete the sentence: How long ___ you ___ (live) here?", acceptedAnswers: ["have lived", "have / lived"], explanation: "How long + have + you + lived?" },
];

const EN_ESSAY = [
  {
    type: "ESSAY" as const,
    prompt: "Write a short paragraph (60–80 words) about something interesting you have done this year. Use at least three sentences in the present perfect.",
    sampleAnswer:
      "This year I have joined the school English club. I have made many new friends and I have learned how to give short presentations. I have also visited Da Nang with my family, and we have tried a lot of local food. These experiences have made me more confident.",
    rubric: [
      { criterion: "Nội dung phù hợp, đủ ý, đúng độ dài 60–80 từ", points: 1 },
      { criterion: "Dùng đúng ít nhất 3 câu thì hiện tại hoàn thành", points: 1 },
      { criterion: "Từ vựng, ngữ pháp và chính tả", points: 0.5 },
    ],
    points: 2.5,
  },
];

const OTHER_MCQ: Mcq[] = [
  { type: "MCQ", prompt: "Bài văn nghị luận thường gồm mấy phần chính?", options: ["Hai phần", "Ba phần: mở bài, thân bài, kết bài", "Bốn phần", "Năm phần"], correctOption: 1, explanation: "Cấu trúc cơ bản: mở bài, thân bài, kết bài." },
  { type: "MCQ", prompt: "Luận điểm trong bài văn nghị luận là gì?", options: ["Ý kiến, quan điểm chính của người viết", "Một câu thơ được trích dẫn", "Phần giới thiệu tác giả", "Phần kết luận"], correctOption: 0, explanation: "Luận điểm là ý kiến chính được triển khai bằng lí lẽ và dẫn chứng." },
  { type: "MCQ", prompt: "Dẫn chứng trong bài nghị luận có tác dụng gì?", options: ["Làm bài dài hơn", "Làm cho lí lẽ có sức thuyết phục", "Thay thế phần mở bài", "Không có tác dụng"], correctOption: 1, explanation: "Dẫn chứng xác thực củng cố lí lẽ." },
  { type: "MCQ", prompt: "Phần mở bài của bài văn nghị luận cần làm gì?", options: ["Kể lại toàn bộ nội dung", "Nêu vấn đề cần bàn luận", "Đưa ra mọi dẫn chứng", "Kết luận vấn đề"], correctOption: 1, explanation: "Mở bài dẫn dắt và nêu vấn đề nghị luận." },
  { type: "MCQ", prompt: "Từ nối nào thích hợp để thể hiện quan hệ tương phản?", options: ["Vì vậy", "Tuy nhiên", "Ví dụ", "Thứ nhất"], correctOption: 1, explanation: "'Tuy nhiên' diễn đạt ý đối lập." },
];

const OTHER_SHORT: Short[] = [
  { type: "SHORT", prompt: "Kể tên ba phần chính của một bài văn nghị luận (cách nhau bằng dấu phẩy, đúng thứ tự).", acceptedAnswers: ["mở bài, thân bài, kết bài", "mở bài,thân bài,kết bài"], explanation: "Mở bài → thân bài → kết bài." },
  { type: "SHORT", prompt: "Điền từ còn thiếu: 'Có lí lẽ và ___ thì bài nghị luận mới thuyết phục.'", acceptedAnswers: ["dẫn chứng"], explanation: "Lí lẽ phải đi kèm dẫn chứng." },
];

const take = <T,>(items: T[], n: number) => items.slice(0, Math.max(1, Math.min(n, items.length)));

export function sampleContent(ctx: MockGenCtx): unknown {
  const topic = ctx.topic || `Nội dung buổi ${ctx.sessionIndex}`;
  const mcq = ctx.group === "math" ? MATH_MCQ : ctx.group === "english" ? EN_MCQ : OTHER_MCQ;
  const short = ctx.group === "math" ? MATH_SHORT : ctx.group === "english" ? EN_SHORT : OTHER_SHORT;
  const essay = ctx.group === "english" ? EN_ESSAY : MATH_ESSAY;
  const tag = "[Bản mẫu — không phải AI thật] ";

  switch (ctx.kind) {
    case "quiz":
      return { title: `${tag}Đề trắc nghiệm: ${topic}`, instructions: "Chọn một đáp án đúng nhất cho mỗi câu.", questions: take(mcq, ctx.count) };
    case "exercises": {
      const half = Math.max(1, Math.ceil(ctx.count / 2));
      return {
        title: `${tag}Bài tập: ${topic}`,
        instructions: "Làm hết các câu. Câu trả lời ngắn viết gọn, đúng chính tả.",
        questions: [...take(mcq, half), ...take(short, Math.max(1, ctx.count - half))],
      };
    }
    case "essay":
      return { title: `${tag}Đề tự luận: ${topic}`, instructions: "Trình bày rõ ràng các bước làm bài.", questions: take(essay, ctx.count) };
    case "slides": {
      const math = ctx.group === "math";
      return {
        title: `${tag}${topic}`,
        slides: [
          { title: topic, bullets: [ctx.courseTitle, `Buổi ${ctx.sessionIndex}`], notes: "Chào lớp, nêu mục tiêu buổi học." },
          { title: "Mục tiêu buổi học", bullets: ["Nắm được khái niệm trọng tâm của bài", "Vận dụng vào bài tập cơ bản", "Tự kiểm tra bằng câu hỏi nhanh cuối buổi"], notes: "Đọc nhanh, hỏi 1–2 học sinh nhắc lại bài cũ." },
          math
            ? { title: "Kiến thức trọng tâm", bullets: ["Phương trình ax² + bx + c = 0 (a ≠ 0)", "Tính Δ rồi xét dấu", "Δ < 0: vô nghiệm; Δ = 0: nghiệm kép"], notes: "Ghi bảng công thức nghiệm.", figure: FIG_ROOT_FORMULA }
            : { title: "Kiến thức trọng tâm", bullets: ["Định nghĩa và dấu hiệu nhận biết", "Công thức/quy tắc cần nhớ", "Lỗi thường gặp"], notes: "Ghi bảng, lấy ví dụ gần gũi." },
          math
            ? { title: "Ví dụ minh họa", bullets: ["Giải x² − 5x + 6 = 0", "Δ = 1 > 0 nên có hai nghiệm", "x = 2 và x = 3 — đúng hai giao điểm với Ox"], notes: "Cho học sinh tự giải trước rồi đối chiếu với đồ thị.", figure: FIG_PARABOLA }
            : { title: "Ví dụ minh họa", bullets: ["Ví dụ 1: áp dụng trực tiếp", "Ví dụ 2: nâng cao một bước", "Cho học sinh tự làm trước khi giải"], notes: "Cho 3 phút làm riêng, sau đó chữa chung." },
          { title: "Luyện tập", bullets: ["Làm 3 câu trắc nghiệm nhanh", "Đổi vở chấm chéo", "Giải đáp thắc mắc"], notes: "Dùng đề trắc nghiệm đã tạo." },
          { title: "Tổng kết và bài về nhà", bullets: ["Nhắc lại 3 ý chính", "Bài về nhà: làm bài tập đã giao", "Chuẩn bị nội dung buổi sau"], notes: "Nhắc hạn nộp bài." },
        ],
      };
    }
    case "lesson_plan":
      return {
        title: `${tag}Giáo án: ${topic}`,
        objectives: ["Học sinh nêu được khái niệm trọng tâm của bài", "Học sinh vận dụng được vào bài tập cơ bản và nâng cao", "Học sinh tự đánh giá được mức độ hiểu bài"],
        materials: ["Bảng, bút, slide bài giảng", "Phiếu bài tập in sẵn", "Đề kiểm tra nhanh 10 phút"],
        activities: [
          { name: "Khởi động / kiểm tra bài cũ", minutes: 10, description: "Hỏi nhanh 3 câu về bài trước để nối vào bài mới.", teacherActions: "Đặt câu hỏi, gọi học sinh trả lời.", studentActions: "Trả lời miệng, ghi chú." },
          { name: "Dạy kiến thức mới", minutes: 30, description: `Trình bày nội dung "${topic}" theo slide, kèm 2 ví dụ minh họa.`, teacherActions: "Giảng, ghi bảng, đặt câu hỏi gợi mở.", studentActions: "Nghe, ghi chép, nêu thắc mắc." },
          { name: "Luyện tập có hướng dẫn", minutes: 30, description: "Học sinh làm phiếu bài tập theo cặp, giáo viên đi quanh hỗ trợ.", teacherActions: "Quan sát, gợi ý, chữa lỗi điển hình.", studentActions: "Làm bài theo cặp, trao đổi." },
          { name: "Kiểm tra nhanh và tổng kết", minutes: 20, description: "Làm đề trắc nghiệm ngắn, chữa đáp án, tổng kết 3 ý chính.", teacherActions: "Phát đề, chữa bài, nhắc bài về nhà.", studentActions: "Làm bài, tự chấm." },
        ],
        assessment: "Đánh giá qua câu hỏi miệng, phiếu bài tập và đề trắc nghiệm cuối buổi (ít nhất 70% câu đúng là đạt).",
        homework: "Hoàn thành các bài tập còn lại trong phiếu và ôn lại kiến thức trọng tâm.",
        notes: "Bản mẫu dùng để chạy thử luồng; hãy chỉnh theo lớp thực tế.",
      };
    case "curriculum":
      return {
        title: `${tag}Giáo trình buổi ${ctx.sessionIndex}: ${topic}`,
        summary: `Buổi ${ctx.sessionIndex} của khóa "${ctx.courseTitle}" tập trung vào chủ đề "${topic}": ôn kiến thức nền, học nội dung mới, luyện tập và kiểm tra nhanh.`,
        outcomes: ["Nêu được khái niệm và dấu hiệu nhận biết", "Vận dụng được công thức/quy tắc vào bài tập", "Tránh được các lỗi sai thường gặp"],
        sections: [
          { heading: "1. Kiến thức nền", content: "Nhắc lại các khái niệm cần có từ buổi trước để học sinh nối vào bài mới.", keyPoints: ["Khái niệm cơ bản", "Ký hiệu cần nhớ"] },
          { heading: "2. Nội dung trọng tâm", content: `Trình bày "${topic}" theo ba bước: định nghĩa, ví dụ, quy tắc vận dụng.`, keyPoints: ["Định nghĩa", "Quy tắc", "Ví dụ mẫu"], ...(ctx.group === "math" ? { figure: FIG_ROOT_FORMULA } : {}) },
          { heading: "3. Luyện tập và kiểm tra", content: "Bài tập từ dễ đến khó, kết thúc bằng bài kiểm tra nhanh 10 phút.", keyPoints: ["Mức nhận biết", "Mức thông hiểu", "Mức vận dụng"], ...(ctx.group === "math" ? { figure: FIG_SOLUTION_SET } : {}) },
        ],
      };
  }
}
