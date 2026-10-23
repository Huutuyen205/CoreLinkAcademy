// Tạo tệp iCalendar (.ics, RFC 5545) cho lịch học — FEAT-B5 (DECISION-D32). Hàm thuần.

export type IcsEvent = { uid: string; start: Date; end: Date; summary: string; location?: string | null; description?: string | null; cancelled?: boolean };

/** Thời điểm UTC dạng 20261022T110000Z. */
function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Thoát ký tự đặc biệt của giá trị TEXT. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Gập dòng dài hơn 75 byte (bắt đầu dòng tiếp bằng một dấu cách), không cắt giữa ký tự UTF-8. */
export function foldLine(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8");
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(calendarName: string, events: IcsEvent[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoreLink Academy//Lich hoc//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@corelink`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(e.end)}`,
      `SUMMARY:${icsEscape(e.cancelled ? `[ĐÃ HỦY] ${e.summary}` : e.summary)}`,
      ...(e.location ? [`LOCATION:${icsEscape(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
      `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
      // Nhắc trước 60 phút trên điện thoại.
      ...(e.cancelled ? [] : ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Sắp đến giờ học", "TRIGGER:-PT60M", "END:VALARM"]),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
