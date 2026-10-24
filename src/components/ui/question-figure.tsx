import type { FigureView } from "@/server/figures/render";

/** Câu hỏi đưa vào form sửa: bỏ SVG (không gửi lại cho trình duyệt lần nữa), chỉ giữ cờ "có hình" để hiện ô "Bỏ hình". */
export function withFigureFlag<T extends { figure?: FigureView | null }>({ figure, ...rest }: T): Omit<T, "figure"> & { hasFigure: boolean } {
  return { ...rest, hasFigure: Boolean(figure) };
}

/**
 * Hình minh họa của câu hỏi (DECISION-D43). SVG do server vẽ từ đặc tả đã kiểm tra (mọi chữ đã escape, không có script/liên kết).
 * Nền trắng như hình in nên vẫn đọc rõ ở chế độ tối; không phóng to quá kích thước gốc.
 */
export function QuestionFigure({ figure, className }: { figure: FigureView | null | undefined; className?: string }) {
  if (!figure) return null;
  return (
    <figure className={className ?? "my-2"} style={{ maxWidth: Math.min(figure.width, 520) }}>
      <div
        role="img"
        aria-label={figure.caption || "Hình minh họa"}
        className="overflow-hidden rounded-sm border border-line bg-white [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: figure.svg }}
      />
      {figure.caption ? <figcaption className="mt-1 text-center text-xs italic text-muted">{figure.caption}</figcaption> : null}
    </figure>
  );
}
