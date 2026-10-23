import { describe, expect, it } from "vitest";
import { groupResults, inPeriod, monthlyAttendance, periodKeys, periodLabel, periodOptions, scoreDelta, scoreTrend } from "./progress";

const r = (iso: string, score: number | null, max = 10) => ({ publishedAt: new Date(iso), score, maxScore: max, title: iso, classCode: "A" });

describe("scoreTrend", () => {
  it("sắp xếp theo thời gian, đổi ra %, bỏ bài điểm tối đa 0", () => {
    const pts = scoreTrend([r("2026-10-05T00:00:00Z", 8), r("2026-09-01T00:00:00Z", null), r("2026-10-01T00:00:00Z", 5, 0)]);
    expect(pts.map((p) => p.pct)).toEqual([0, 80]);
  });
});

describe("scoreDelta", () => {
  it("chưa đủ 4 bài → null; đủ → chênh lệch trung bình", () => {
    expect(scoreDelta(scoreTrend([r("2026-01-01T00:00:00Z", 5)]))).toBeNull();
    const pts = scoreTrend(["01", "02", "03", "04", "05", "06"].map((d, i) => r(`2026-10-${d}T00:00:00Z`, i < 3 ? 6 : 9)));
    expect(scoreDelta(pts)).toBe(30);
  });
});

describe("monthlyAttendance", () => {
  const a = (iso: string, status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED", cancelled = false) => ({ status, sessionCancelled: cancelled, session: { startsAt: new Date(iso) } });
  it("6 tháng gần nhất theo giờ VN, bỏ buổi hủy", () => {
    const now = new Date("2026-10-22T03:00:00Z");
    const rows = monthlyAttendance(
      [
        a("2026-10-01T11:00:00Z", "PRESENT"),
        a("2026-10-03T11:00:00Z", "ABSENT"),
        a("2026-10-05T11:00:00Z", "LATE", true),
        a("2026-08-31T18:30:00Z", "LATE"), // 01:30 ngày 1/9 giờ VN
      ],
      now,
    );
    expect(rows.map((x) => x.label)).toEqual(["T5", "T6", "T7", "T8", "T9", "T10"]);
    expect(rows[5]).toMatchObject({ rate: 0.5, total: 2 });
    expect(rows[4]).toMatchObject({ rate: 1, total: 1 });
    expect(rows[3]!.rate).toBeNull();
  });
});

describe("kết quả tổng hợp theo môn / lớp / kỳ (HS §4, PH §5)", () => {
  const r = (iso: string, score: number, max: number, classCode: string, subjectName: string) => ({ publishedAt: new Date(iso), score, maxScore: max, classCode, subjectName });
  const rows = [
    r("2026-09-10T03:00:00Z", 8, 10, "T9A", "Toán"),
    r("2026-10-05T03:00:00Z", 6, 10, "T9A", "Toán"),
    r("2026-10-20T03:00:00Z", 9, 10, "A9", "Tiếng Anh"),
    r("2026-10-21T03:00:00Z", 0, 0, "A9", "Tiếng Anh"),
  ];

  it("kỳ theo giờ VN: tháng và quý", () => {
    expect(periodKeys(new Date("2026-09-30T18:00:00Z"))).toEqual({ month: "2026-10", quarter: "2026-Q4" });
    expect(periodLabel("2026-Q4")).toBe("Quý 4/2026");
    expect(periodLabel("2026-10")).toBe("Tháng 10/2026");
  });

  it("danh sách kỳ: quý trước, mới nhất trước", () => {
    expect(periodOptions(rows)).toEqual(["2026-Q4", "2026-Q3", "2026-10", "2026-09"]);
    expect(inPeriod(rows[0]!.publishedAt, "2026-Q3")).toBe(true);
    expect(inPeriod(rows[0]!.publishedAt, "2026-10")).toBe(false);
  });

  it("gom theo môn: số bài, trung bình, cao/thấp; bỏ bài điểm tối đa 0", () => {
    expect(groupResults(rows, "subject")).toEqual([
      { key: "Tiếng Anh", count: 1, avgPct: 90, bestPct: 90, worstPct: 90 },
      { key: "Toán", count: 2, avgPct: 70, bestPct: 80, worstPct: 60 },
    ]);
    expect(groupResults(rows, "class").map((g) => g.key)).toEqual(["A9", "T9A"]);
  });
});
