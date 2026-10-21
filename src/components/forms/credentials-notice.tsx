import { Alert } from "@/components/ui/feedback";

export type ShownCredential = { role: "STUDENT" | "PARENT" | string; fullName: string; login: string; password: string };

/** Mật khẩu tạm chỉ hiển thị một lần ngay sau thao tác (UC-003, FR-013). */
export function CredentialsNotice({ credentials, note }: { credentials: ShownCredential[]; note?: string }) {
  return (
    <Alert tone="warning" title="Mật khẩu tạm — chỉ hiển thị một lần">
      <p>Hãy gửi cho người dùng ngay. Họ sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
      {credentials.length > 0 && (
        <ul className="mt-2 space-y-2">
          {credentials.map((c) => (
            <li key={c.login} className="rounded-control border border-warning/30 bg-surface p-2 text-ink">
              <p className="font-medium">{c.fullName}</p>
              <p>
                Đăng nhập: <code>{c.login}</code>
              </p>
              <p>
                Mật khẩu: <code className="font-semibold">{c.password}</code>
              </p>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-2">{note}</p>}
    </Alert>
  );
}
