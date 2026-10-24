import type { PracticeDifficulty } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { PracticeSetGrid } from "@/components/practice/practice-set-grid";
import { requireActor } from "@/server/auth/guard";
import { listPracticeSets, practiceFilterOptions } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";

export const metadata: Metadata = { title: "Tự ôn luyện" };

type SP = { q?: string; mon?: string; chuyende?: string; dang?: string; mucdo?: string; thongbao?: string };
const DIFFICULTIES = Object.keys(PRACTICE_DIFFICULTY) as PracticeDifficulty[];

// GV, quản lý: danh sách đề luyện tập để soạn và quản lý. Phụ huynh không dùng.
// Học sinh §5 (tự ôn luyện) nằm ở mục "Tự ôn luyện" của trang Bài tập (`/hoc-sinh/bai-tap?loai=on-luyen`).
export default async function PracticeListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireActor();
  if (actor.role === "STUDENT") redirect("/hoc-sinh/bai-tap?loai=on-luyen");
  if (actor.role === "PARENT") redirect("/phu-huynh/bai-tap?loai=on-luyen");
  const sp = await searchParams;
  const options = await practiceFilterOptions(actor);
  const pick = (v: string | undefined, list: string[]) => (v && list.includes(v) ? v : undefined);
  const filter = {
    q: typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || undefined : undefined,
    subjectId: pick(sp.mon, options.subjects.map((s) => s.id)),
    topic: pick(sp.chuyende, options.topics),
    format: pick(sp.dang, options.formats),
    difficulty: pick(sp.mucdo, DIFFICULTIES) as PracticeDifficulty | undefined,
  };
  const sets = await listPracticeSets(actor, filter);

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader
        title="Tự ôn luyện"
        description="Đề luyện tập cho học sinh tự ôn: câu trắc nghiệm / trả lời ngắn chấm tự động, kèm lời giải. Đề nháp học sinh chưa thấy."
        action={
          <ButtonLink href="/on-luyen/moi" size="sm">
            Soạn đề mới
          </ButtonLink>
        }
      />
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:items-end">
        <TextField name="q" label="Tìm đề" defaultValue={filter.q} maxLength={80} />
        <SearchSelect name="mon" label="Môn" emptyLabel="Tất cả" defaultValue={filter.subjectId ?? ""} options={options.subjects.map((s) => ({ value: s.id, label: s.name }))} />
        <SearchSelect name="chuyende" label="Chuyên đề" emptyLabel="Tất cả" defaultValue={filter.topic ?? ""} options={options.topics.map((t) => ({ value: t, label: t }))} />
        <SearchSelect name="dang" label="Dạng bài" emptyLabel="Tất cả" defaultValue={filter.format ?? ""} options={options.formats.map((f) => ({ value: f, label: f }))} />
        <SearchSelect name="mucdo" label="Mức độ" emptyLabel="Tất cả" defaultValue={filter.difficulty ?? ""} options={DIFFICULTIES.map((d) => ({ value: d, label: PRACTICE_DIFFICULTY[d].label }))} />
      </FilterForm>
      {sets.length === 0 ? (
        <EmptyState message='Chưa có đề nào. Bấm "Soạn đề mới" để bắt đầu.' />
      ) : (
        <PracticeSetGrid sets={sets} learner={false} />
      )}
    </>
  );
}
