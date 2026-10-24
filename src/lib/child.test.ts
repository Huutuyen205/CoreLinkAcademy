import { describe, expect, it } from "vitest";
import { pathAfterSwitch, pickChild, safeInternalPath, switchChildHref } from "./child";

const kids = [{ id: "a" }, { id: "b" }];

describe("pickChild", () => {
  it("lấy con đang chọn nếu còn liên kết", () => expect(pickChild(kids, "b")).toEqual({ id: "b" }));
  it("không có / sai cookie → con đầu tiên", () => {
    expect(pickChild(kids, undefined)).toEqual({ id: "a" });
    expect(pickChild(kids, "zzz")).toEqual({ id: "a" });
  });
  it("chưa có con nào → null", () => expect(pickChild([], "a")).toBeNull());
});

describe("safeInternalPath", () => {
  it("nhận đường dẫn nội bộ có query", () => expect(safeInternalPath("/phu-huynh/bai-tap?loai=on-luyen", "/x")).toBe("/phu-huynh/bai-tap?loai=on-luyen"));
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "", "phu-huynh", "/a b"])("chặn %j", (v) => expect(safeInternalPath(v, "/x")).toBe("/x"));
  it("thiếu → fallback", () => expect(safeInternalPath(null, "/x")).toBe("/x"));
});

describe("pathAfterSwitch", () => {
  it("trang chi tiết về danh sách cùng mục", () => {
    expect(pathAfterSwitch("/phu-huynh/lop/abc")).toBe("/phu-huynh/lop");
    expect(pathAfterSwitch("/phu-huynh/bai-tap/abc")).toBe("/phu-huynh/bai-tap");
    expect(pathAfterSwitch("/phu-huynh/buoi/abc")).toBe("/phu-huynh/lich");
    expect(pathAfterSwitch("/phu-huynh/don-nghi")).toBe("/phu-huynh/don-nghi");
    expect(pathAfterSwitch("/phu-huynh")).toBe("/phu-huynh/lich");
  });
  it("đề luyện tập về tab Tự ôn luyện", () => expect(pathAfterSwitch("/on-luyen/xyz")).toBe("/phu-huynh/bai-tap?loai=on-luyen"));
  it("trang dùng chung giữ nguyên", () => expect(pathAfterSwitch("/tin-nhan/abc")).toBe("/tin-nhan/abc"));
});

describe("switchChildHref", () => {
  it("mã hóa tham số", () => expect(switchChildHref("c1", "/phu-huynh/bai-tap?loai=on-luyen")).toBe("/phu-huynh/chon-con?con=c1&den=%2Fphu-huynh%2Fbai-tap%3Floai%3Don-luyen"));
});
