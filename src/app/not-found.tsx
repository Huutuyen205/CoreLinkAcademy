import { Brand } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/button";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";

// DECISION-D11: sai phạm vi dữ liệu cũng hiển thị trang này, không tiết lộ bản ghi có tồn tại hay không.
export default async function NotFound() {
  // Trang 404 không được lỗi theo DB: không đọc được phiên thì coi như khách.
  const actor = await getCurrentActor().catch(() => null);
  return (
    <main id="noi-dung" className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 sm:p-10 text-center shadow-xl shadow-primary/8">
        <div className="mb-6 flex justify-center">
          <Brand href={actor ? HOME_BY_ROLE[actor.role] : "/"} />
        </div>
        <div className="inline-flex size-18 items-center justify-center rounded-2xl bg-primary-soft text-accent font-heading text-4xl font-black mb-4 ring-1 ring-primary/20">
          404
        </div>
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Đường dẫn không tồn tại, đã được chuyển vị trí hoặc bạn chưa được phân quyền truy cập nội dung này.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {actor && (
            <ButtonLink href={HOME_BY_ROLE[actor.role]} className="rounded-full px-5">
              Về trang tổng quan
            </ButtonLink>
          )}
          <ButtonLink href="/" variant={actor ? "secondary" : "primary"} className="rounded-full px-5">
            Về trang chủ
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
