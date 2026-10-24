import type { Role, UserStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { UserRowActions } from "@/components/people/user-row-actions";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { FilterSelect } from "@/components/ui/filter-select";
import { FilterForm } from "@/components/ui/filter-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { ROLE_CAPABILITIES, ROLE_LABELS } from "@/server/auth/policy";
import { listUsers, USER_PAGE_SIZE } from "@/server/users/service";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Người dùng" };

type SP = { role?: string; status?: string; q?: string; page?: string };

// UC-012 — FR-013 (chỉ Admin).
export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const role = sp.role && sp.role in ROLE_LABELS ? (sp.role as Role) : undefined;
  const status = sp.status && sp.status in USER_STATUS ? (sp.status as UserStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const page = parsePage(sp.page);
  const { total, rows } = await listUsers(actor, { role, status, q, page });
  const now = new Date();

  return (
    <>
      <PageHeader title="Người dùng" description="Tạo tài khoản, đổi vai trò, khóa và đặt lại mật khẩu." />
      <details className="mb-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium text-primary">Tạo tài khoản mới</summary>
        <div className="mt-4">
          <CreateUserForm roles={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
        </div>
      </details>

      <details className="mb-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium text-primary">Thao tác được phép theo vai trò</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(ROLE_CAPABILITIES) as Role[]).map((r) => (
            <section key={r} className="rounded-control border border-line p-3">
              <h2 className="mb-2 text-base font-semibold text-primary">{ROLE_LABELS[r]}</h2>
              <dl className="space-y-1.5 text-sm">
                {ROLE_CAPABILITIES[r].map((c) => (
                  <div key={c.area}>
                    <dt className="font-medium">{c.area}</dt>
                    <dd className="text-muted">{c.actions}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </details>

      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <TextField name="q" label="Tìm tên, email, SĐT, mã HS" defaultValue={q} maxLength={100} />
        <FilterSelect name="role" label="Vai trò" placeholder="Tất cả" defaultValue={role ?? ""} options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
        <FilterSelect name="status" label="Trạng thái" placeholder="Tất cả" defaultValue={status ?? ""} options={Object.entries(USER_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
        <div className="flex min-h-11 items-center">
          {(role || status || q) && (
            <ButtonLink href="/quan-ly/nguoi-dung" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>

      {rows.length === 0 ? (
        <EmptyState message="Không có người dùng phù hợp." />
      ) : (
        <Card>
          <DataTable
            caption="Danh sách người dùng"
            rows={rows}
            rowKey={(u) => u.id}
            columns={[
              {
                header: "Họ tên",
                primary: true,
                cell: (u) => (
                  <>
                    <Link href={`/quan-ly/nguoi-dung/${u.id}`} className="font-medium">
                      {u.fullName}
                    </Link>
                    <span className="block text-xs text-muted">
                      {ROLE_LABELS[u.role]}
                      {u.studentCode ? ` · ${u.studentCode}` : ""}
                    </span>
                  </>
                ),
              },
              {
                header: "Đăng nhập",
                cell: (u) => (
                  <span className="block min-w-0 text-sm">
                    {u.email && <span className="block break-all">{u.email}</span>}
                    {u.phone && <span className="block text-muted">{formatPhone(u.phone)}</span>}
                    {!u.email && !u.phone && "—"}
                  </span>
                ),
              },
              {
                header: "Trạng thái",
                cell: (u) => (
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={USER_STATUS[u.status].tone}>{USER_STATUS[u.status].label}</Badge>
                    {u.lockedUntil && u.lockedUntil > now && <Badge tone="warning">Tạm khóa (sai MK)</Badge>}
                    {u.mustChangePassword && <Badge tone="neutral">Chưa kích hoạt</Badge>}
                  </span>
                ),
              },
              { header: "Thao tác", className: "md:w-[1%] md:whitespace-nowrap", cell: (u) => <UserRowActions user={u} actor={actor} /> },
            ]}
          />
        </Card>
      )}
      <Pagination page={page} pageSize={USER_PAGE_SIZE} total={total} basePath="/quan-ly/nguoi-dung" params={{ role, status, q }} />
    </>
  );
}
