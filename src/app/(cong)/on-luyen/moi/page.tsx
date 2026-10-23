import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { createPracticeSetAction } from "@/server/practice/actions";
import { practiceFilterOptions } from "@/server/practice/service";
import { practiceSetFields } from "../fields";

export const metadata: Metadata = { title: "Soạn đề luyện tập" };

export default async function NewPracticeSetPage() {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const options = await practiceFilterOptions(actor);
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/on-luyen">← Tự ôn luyện</Link>
      </p>
      <PageHeader title="Soạn đề luyện tập" description="Đề mới ở trạng thái nháp. Thêm câu hỏi kèm lời giải rồi bấm &ldquo;Mở cho học sinh&rdquo;." />
      <Card>
        <ConfigForm action={createPracticeSetAction} submitLabel="Tạo đề (nháp)" columns={2} fields={practiceSetFields(options)} />
      </Card>
    </>
  );
}
