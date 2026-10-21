import { Brand } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/button";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";

// DECISION-D11: sai phạm vi dữ liệu cũng hiển thị trang này, không tiết lộ bản ghi có tồn tại hay không.
export default async function NotFound() {
  // Trang 404 không được lỗi theo DB: không đọc được phiên thì coi như khách.
  const actor = await getCurrentActor().catch(() => null);
  return (
    <main id="noi-dung" className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-8 flex justify-center">
        <Brand href={actor ? HOME_BY_ROLE[actor.role] : "/"} />
      </div>
      <p className="font-heading text-5xl font-bold text-accent">404</p>
      <h1 className="mt-3 text-2xl">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">Trang không tồn tại hoặc bạn không có quyền xem nội dung này.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {actor && <ButtonLink href={HOME_BY_ROLE[actor.role]}>Về trang tổng quan</ButtonLink>}
        <ButtonLink href="/" variant={actor ? "secondary" : "primary"}>
          Về trang chủ
        </ButtonLink>
      </div>
    </main>
  );
}
