// Tải tệp (FR-040). Kiểm tra phiên + phạm vi phía server; sai quyền hoặc không tồn tại → 404 như mọi trang nội bộ.
import { getFileForDownload } from "@/server/files/access";
import { isInlineType } from "@/server/files/rules";
import { getCurrentActor } from "@/server/auth/session";
import { ForbiddenError } from "@/server/errors";

const notFound = () => new Response("Không tìm thấy tệp.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return Response.redirect(new URL("/dang-nhap", request.url), 303);
  if (actor.mustChangePassword) return Response.redirect(new URL("/doi-mat-khau", request.url), 303);
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return notFound();

  try {
    const file = await getFileForDownload(actor, id);
    const inline = isInlineType(file.mimeType) && new URL(request.url).searchParams.get("tai") !== "1";
    return new Response(Buffer.from(file.data), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        // Tệp do người dùng tải lên: không cho chạy script, không cache dùng chung.
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) return notFound();
    throw error;
  }
}
