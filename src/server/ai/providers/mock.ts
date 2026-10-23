// Nhà cung cấp GIẢ (không cần API key, không gọi mạng): trả dữ liệu mẫu cố định theo tác vụ để thử mọi luồng.
import { sampleContent, type MockGenCtx } from "../generate/samples";
import type { AiProvider, AiRequest, AiResult } from "./types";

export type MockGradeCtx = { maxPoints: number; response: string; hasPhotos: boolean };
export type MockSheetCtx = { questionCount: number };

const quarter = (n: number) => Math.round(n * 4) / 4;

export function mockProvider(): AiProvider {
  return {
    id: "mock",
    model: "mock",
    isMock: true,
    async complete(req: AiRequest): Promise<AiResult> {
      switch (req.task) {
        case "intent":
          // Không đoán ý định: chatbot dùng luật từ khóa + nút gợi ý.
          return { text: JSON.stringify({ intent: "unknown" }) };
        case "grade_essay": {
          const ctx = req.mock as MockGradeCtx;
          const words = ctx.response.trim().split(/\s+/).filter(Boolean).length;
          // Bản mẫu: điểm theo độ dài bài (không phải chấm thật) để thử luồng "gợi ý → giáo viên xác nhận".
          const ratio = ctx.hasPhotos && words === 0 ? 0.6 : Math.min(1, words / 40) * 0.8;
          return {
            text: JSON.stringify({
              points: Math.min(ctx.maxPoints, quarter(ctx.maxPoints * ratio)),
              feedback: "[Bản mẫu] Bài làm đã có ý chính; cần trình bày rõ hơn các bước và kiểm tra lại kết quả. Đây là gợi ý giả lập, giáo viên hãy chấm lại.",
              confidence: "low",
              transcript: ctx.hasPhotos ? "[Bản mẫu] Nội dung đọc từ ảnh sẽ hiện ở đây khi dùng AI thật." : "",
            }),
          };
        }
        case "read_answer_sheet": {
          const ctx = req.mock as MockSheetCtx;
          const letters = ["A", "B", "C", "D"];
          return {
            text: JSON.stringify({
              answers: Array.from({ length: ctx.questionCount }, (_, i) => ({ question: i + 1, choice: letters[i % letters.length] })),
              note: "[Bản mẫu] Đáp án giả lập, chưa đọc từ ảnh thật.",
            }),
          };
        }
        default:
          return { text: JSON.stringify(sampleContent(req.mock as MockGenCtx)) };
      }
    },
  };
}
