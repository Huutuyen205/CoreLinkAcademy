"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/format";
import type { SlideDeck } from "@/server/ai/generate/schemas";
import { BODY, bulletHeight, BULLET_TEXT_W, coverSize, GAP, layoutDeck, SLIDE_H, SLIDE_W, titleSize, type LaidOutSlide, type SlideMeta } from "@/server/ai/generate/slide-layout";

// Màu và vị trí lấy đúng từ render-pptx.ts (cùng bố cục `layoutDeck`) để bản xem trước giống file PowerPoint sẽ lưu.
const C = { brand: "#1C2D95", brandDark: "#121C5E", accent: "#2F6BFF", soft: "#E6ECFF", paper: "#F5F7FE", line: "#DDE3F0", ink: "#0E1433", muted: "#4A5274" };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Calibri, 'Segoe UI', Arial, sans-serif";
const LOGO = "/brand/logo.png";

const px = (inch: number, total: number) => `${(inch / total) * 100}%`;
/** Cỡ chữ pt → đơn vị `cqw` (1 slide rộng 10 inch = 720 pt) để chữ co giãn theo khung. */
const pt = (size: number) => `${(size / 720) * 100}cqw`;

function Box({ x, y, w, h, style, children }: { x: number; y: number; w: number; h: number; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className="absolute" style={{ left: px(x, SLIDE_W), top: px(y, SLIDE_H), width: px(w, SLIDE_W), height: px(h, SLIDE_H), ...style }}>
      {children}
    </div>
  );
}

const circle = (x: number, y: number, d: number, color: string, opacity: number) => (
  <Box x={x} y={y} w={d} h={d} style={{ background: color, opacity, borderRadius: "50%" }} />
);

// eslint-disable-next-line @next/next/no-img-element
const logo = (x: number, y: number, size: number) => <img src={LOGO} alt="" className="absolute" style={{ left: px(x, SLIDE_W), top: px(y, SLIDE_H), width: px(size, SLIDE_W), height: px(size, SLIDE_H) }} />;

/** Một slide 16:9 dựng bằng HTML theo đúng bố cục file .pptx. */
function SlideCanvas({ slide, footer, number }: { slide: LaidOutSlide; footer: string; number: number }) {
  let inner: ReactNode;
  let bg: string = "#FFFFFF";

  switch (slide.kind) {
    case "cover":
      bg = C.brand;
      inner = (
        <>
          {circle(6.3, -1.6, 5.6, C.accent, 0.28)}
          {circle(7.4, 2.9, 4.6, C.brandDark, 0.65)}
          {logo(0.7, 0.55, 1.15)}
          <Box x={2} y={0.8} w={5} h={0.65} style={{ display: "flex", alignItems: "center", color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: pt(18), letterSpacing: "0.2em" }}>
            CORE LINK ACADEMY
          </Box>
          <Box x={0.7} y={2.05} w={0.9} h={0.07} style={{ background: C.accent }} />
          <Box x={0.7} y={2.2} w={7.2} h={1.45} style={{ color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: pt(coverSize(slide.title)), lineHeight: 1.15, overflow: "hidden" }}>
            {slide.title}
          </Box>
          <Box x={0.7} y={3.75} w={7.2} h={0.45} style={{ display: "flex", alignItems: "center", color: C.soft, fontFamily: SANS, fontSize: pt(18) }}>
            {slide.subtitle}
          </Box>
          <Box x={0.7} y={4.4} w={4.6} h={0.5} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS, fontSize: pt(14), background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 999 }}>
            {slide.badge}
          </Box>
        </>
      );
      break;
    case "section":
      bg = C.brandDark;
      inner = (
        <>
          {circle(6.8, 1.2, 5.2, C.brand, 0.8)}
          <Box x={0.8} y={1} w={3} h={1.3} style={{ display: "flex", alignItems: "center", color: C.accent, fontFamily: SERIF, fontWeight: 700, fontSize: pt(64) }}>
            {slide.number}
          </Box>
          <Box x={0.8} y={2.45} w={0.9} h={0.07} style={{ background: C.accent }} />
          <Box x={0.8} y={2.65} w={7.2} h={1.5} style={{ color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: pt(coverSize(slide.title) - 4), lineHeight: 1.15, overflow: "hidden" }}>
            {slide.title}
          </Box>
          {logo(SLIDE_W - 1.3, SLIDE_H - 1.3, 0.8)}
        </>
      );
      break;
    case "content": {
      let y = BODY.y;
      inner = (
        <>
          <Box x={0} y={0} w={SLIDE_W} h={1.15} style={{ background: C.paper }} />
          <Box x={0} y={1.15} w={SLIDE_W} h={0.04} style={{ background: C.brand }} />
          <Box x={0} y={1.15} w={2.2} h={0.04} style={{ background: C.accent }} />
          {logo(0.45, 0.22, 0.72)}
          <Box x={1.4} y={0.12} w={SLIDE_W - 1.9} h={0.95} style={{ display: "flex", alignItems: "center", color: C.brand, fontFamily: SERIF, fontWeight: 700, fontSize: pt(titleSize(slide.title)), lineHeight: 1.15 }}>
            {slide.title}
          </Box>
          <Box x={0.5} y={1.4} w={SLIDE_W - 1} h={3.65} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: "1.2cqw" }} />
          {slide.bullets.map((b, i) => {
            const h = bulletHeight(b, slide.size) - GAP;
            const top = y;
            y += h + GAP;
            return (
              <div key={i}>
                <Box x={BODY.x - 0.05} y={top + (slide.size * 1.22) / 144 - 0.07} w={0.14} h={0.14} style={{ background: C.accent, borderRadius: "50%" }} />
                <Box x={BODY.x + 0.3} y={top} w={BULLET_TEXT_W} h={h} style={{ color: C.ink, fontFamily: SANS, fontSize: pt(slide.size), lineHeight: 1.22 }}>
                  {b}
                </Box>
              </div>
            );
          })}
          <Box x={0.45} y={SLIDE_H - 0.42} w={SLIDE_W - 0.9} h={0.01} style={{ background: C.line }} />
          <Box x={0.45} y={SLIDE_H - 0.38} w={6.5} h={0.3} style={{ display: "flex", alignItems: "center", color: C.muted, fontFamily: SANS, fontSize: pt(10) }}>
            {footer}
          </Box>
          <Box x={SLIDE_W - 1} y={SLIDE_H - 0.38} w={0.55} h={0.3} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", color: C.muted, fontFamily: SANS, fontSize: pt(10) }}>
            {number}
          </Box>
        </>
      );
      break;
    }
    case "end":
      bg = C.brand;
      inner = (
        <>
          {circle(-1.6, 2.6, 5.2, C.accent, 0.25)}
          {logo(SLIDE_W / 2 - 0.65, 1.05, 1.3)}
          <Box x={1} y={2.55} w={SLIDE_W - 2} h={0.9} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: pt(38) }}>
            Cảm ơn các em
          </Box>
          <Box x={1} y={3.5} w={SLIDE_W - 2} h={0.45} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: C.soft, fontFamily: SANS, fontSize: pt(16) }}>
            {slide.subtitle}
          </Box>
        </>
      );
      break;
  }
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}`, containerType: "inline-size", background: bg }}>
      {inner}
    </div>
  );
}

/**
 * Xem trước bộ slide như trong PowerPoint: thanh tiêu đề, dải slide thu nhỏ bên trái, slide lớn ở giữa, ô ghi chú bên dưới.
 * Dựng từ cùng bố cục với file .pptx (`layoutDeck`) nên khớp với file sẽ lưu.
 */
export function PptxPreview({ deck, meta, fileName }: { deck: SlideDeck; meta: SlideMeta; fileName: string }) {
  const slides = useMemo(() => layoutDeck(deck, meta), [deck, meta]);
  const [index, setIndex] = useState(0);
  const rail = useRef<HTMLOListElement>(null);
  const footer = `Core Link Academy · ${meta.classCode} · Buổi ${meta.sessionIndex}`;
  const last = slides.length - 1;
  const go = (i: number) => setIndex(Math.min(last, Math.max(0, i)));
  const current = slides[index]!;
  const notes = current.kind === "content" || current.kind === "section" ? current.notes : "";

  useEffect(() => {
    rail.current?.querySelector("[aria-current=true]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  return (
    <div
      role="group"
      aria-roledescription="bản xem trước PowerPoint"
      aria-label={`Xem trước ${fileName}, ${slides.length} slide`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          go(index - 1);
        }
      }}
      className="overflow-hidden rounded-block border border-line-strong bg-[#E9E9EC] shadow-sm"
    >
      <div className="flex min-h-9 items-center gap-2 bg-[#B7472A] px-3 text-sm text-white">
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-white text-xs font-bold text-[#B7472A]" aria-hidden="true">
          P
        </span>
        <span className="min-w-0 flex-1 truncate">{fileName}</span>
        <span className="shrink-0 text-xs opacity-90">
          Slide {index + 1}/{slides.length}
        </span>
      </div>

      <div className="flex flex-col md:flex-row">
        <ol ref={rail} aria-label="Danh sách slide" className="no-scrollbar flex gap-2 overflow-x-auto bg-[#F3F3F5] p-2 md:max-h-[26rem] md:w-44 md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {slides.map((s, i) => (
            <li key={i} className="flex shrink-0 items-start gap-1.5 md:shrink">
              <span className="hidden w-4 pt-1 text-right text-xs text-muted md:block">{i + 1}</span>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === index}
                aria-label={`Slide ${i + 1}`}
                className={cn("block w-28 overflow-hidden rounded-sm border-2 md:w-full", i === index ? "border-[#B7472A]" : "border-transparent hover:border-line-strong")}
              >
                <SlideCanvas slide={s} footer={footer} number={i + 1} />
              </button>
            </li>
          ))}
        </ol>

        <div className="min-w-0 flex-1 p-3 md:p-4">
          <div className="mx-auto max-w-3xl shadow-md">
            <SlideCanvas slide={current} footer={footer} number={index + 1} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Slide trước" className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface disabled:opacity-40">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="min-w-16 text-center text-sm text-muted" aria-live="polite">
              {index + 1} / {slides.length}
            </span>
            <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Slide sau" className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface disabled:opacity-40">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-auto mt-3 max-w-3xl rounded-sm border border-line bg-surface p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ghi chú của người trình bày</p>
            <p className={cn("mt-1 whitespace-pre-line", !notes && "text-muted")}>{notes || "Nhấp để thêm ghi chú"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
