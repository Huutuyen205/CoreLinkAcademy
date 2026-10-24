// Mỗi loại nội dung AI soạn có trang + form riêng `/giao-vien/soan-bai/<slug>` (DECISION-D34, D40). Dữ liệu thuần, dùng chung server/client.
import type { GenerateKind } from "@/server/ai/generate/schemas";

export type ComposeKind = {
  kind: GenerateKind;
  slug: string;
  /** Tên ngắn trên thẻ và tiêu đề trang. */
  title: string;
  description: string;
  /** Đề giao riêng cho MỘT học sinh của lớp (đề luyện tập bổ sung, FR-060) thay vì cả lớp. */
  forStudent?: boolean;
  /** Xem trước kết quả (dạng PowerPoint) rồi mới lưu, thay vì tự lưu nháp ngay. */
  preview?: boolean;
  /** Loại đề (có số câu + mức độ) → lưu thành bài tập NHÁP; còn lại → tài liệu riêng của giáo viên. */
  exam: boolean;
  /** Số câu mặc định / tối đa (chỉ loại đề). */
  count?: { default: number; max: number };
  topicHint: string;
  notesHint: string;
};

export const COMPOSE_KINDS: readonly ComposeKind[] = [
  {
    kind: "lesson_plan",
    slug: "giao-an",
    title: "Giáo án",
    description: "Mục tiêu, chuẩn bị, tiến trình từng hoạt động theo phút, đánh giá và bài về nhà. Lưu file Word.",
    exam: false,
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: lớp đông, ít thiết bị; muốn có hoạt động nhóm.",
  },
  {
    kind: "slides",
    slug: "slide",
    title: "Slide bài giảng",
    description: "Bộ slide mở đầu → kiến thức → ví dụ → luyện tập → tổng kết, kèm ghi chú trình bày. Xem trước như PowerPoint rồi mới lưu file.",
    exam: false,
    preview: true,
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: khoảng 10 slide, mỗi slide ít chữ.",
  },
  {
    kind: "curriculum",
    slug: "giao-trinh",
    title: "Tóm tắt giáo trình",
    description: "Bản tóm tắt kiến thức riêng cho buổi: chuẩn đầu ra, các phần chính, ý chính và ví dụ. Lưu file Word.",
    exam: false,
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: nhấn mạnh phần dễ nhầm, thêm ví dụ đời sống.",
  },
  {
    kind: "quiz",
    slug: "trac-nghiem",
    title: "Đề trắc nghiệm",
    description: "Câu trắc nghiệm 4 lựa chọn có đáp án và lời giải. Lưu thành bài tập nháp để sửa rồi giao.",
    exam: true,
    count: { default: 10, max: 30 },
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: có 2 câu vận dụng cao, ngữ cảnh đời sống.",
  },
  {
    kind: "exercises",
    slug: "bai-tap",
    title: "Bài tập",
    description: "Trắc nghiệm + trả lời ngắn (hệ thống tự chấm được). Lưu thành bài tập nháp để sửa rồi giao.",
    exam: true,
    count: { default: 8, max: 30 },
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: ưu tiên dạng bài hay sai ở buổi trước.",
  },
  {
    kind: "exercises",
    slug: "bo-sung",
    title: "Đề bổ sung cá nhân",
    description: "Đề trắc nghiệm + trả lời ngắn giao riêng cho một học sinh (ôn phần còn yếu). Lưu thành đề luyện tập nháp để sửa rồi mở cho học sinh.",
    exam: true,
    forStudent: true,
    count: { default: 8, max: 30 },
    topicHint: "Nên nhập phần học sinh còn yếu. Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: em hay nhầm dấu khi giải bất phương trình; ra thêm câu cơ bản.",
  },
  {
    kind: "essay",
    slug: "tu-luan",
    title: "Đề tự luận",
    description: "Đề tự luận kèm đáp án mẫu và thang điểm (môn Toán, Tiếng Anh). Lưu bài tập nháp + file Word đáp án.",
    exam: true,
    count: { default: 3, max: 8 },
    topicHint: "Bỏ trống: lấy theo khung chương trình/nhật ký của buổi.",
    notesHint: "Ví dụ: có một câu chứng minh; thang điểm chi tiết.",
  },
];

export function composeKindBySlug(slug: string): ComposeKind | undefined {
  return COMPOSE_KINDS.find((k) => k.slug === slug);
}

export function composeKindOf(kind: string): ComposeKind | undefined {
  return COMPOSE_KINDS.find((k) => k.kind === kind);
}

/** Trang soạn của một loại, giữ ngữ cảnh buổi/lớp đang xem. */
export function composeHrefFor(slug: string, ctx: { buoi?: string; lop?: string } = {}): string {
  const qs = ctx.buoi ? `?buoi=${encodeURIComponent(ctx.buoi)}` : ctx.lop ? `?lop=${encodeURIComponent(ctx.lop)}` : "";
  return `/giao-vien/soan-bai/${slug}${qs}`;
}

/** Buổi mở sẵn trong form: `?buoi=` đúng buổi; `?lop=` buổi gần nhất chưa diễn ra của lớp (hoặc buổi cuối trong khoảng chọn được). */
export function pickSessionId(sessions: { id: string; classId: string; startsAt: Date }[], sp: { buoi?: string; lop?: string }, now = Date.now()): string | undefined {
  if (sessions.some((s) => s.id === sp.buoi)) return sp.buoi;
  const ofClass = sp.lop ? sessions.filter((s) => s.classId === sp.lop) : [];
  return (ofClass.find((s) => s.startsAt.getTime() >= now) ?? ofClass.at(-1))?.id;
}

/** Mã thông báo (`?thongbao=`) ở trang chi tiết sau khi soạn xong: bài tập / tự luận / đề bổ sung / tài liệu, có/không bản mẫu. */
export function composeFlashCode(kind: GenerateKind, mock: boolean, forStudent = false): string {
  const base = forStudent ? "tao-de-bo-sung-ai" : kind === "essay" ? "tao-tu-luan-ai" : composeKindOf(kind)?.exam ? "tao-bai-ai" : "tao-tai-lieu-ai";
  return mock ? `${base}-mau` : base;
}
