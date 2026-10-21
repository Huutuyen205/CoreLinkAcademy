/** Bọc nội dung mỗi lần chuyển trang (template tạo lại khi đổi route, layout thì không) → hiệu ứng xuất hiện nhẹ. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
