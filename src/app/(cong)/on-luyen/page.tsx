import type { PracticeDifficulty } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { requireActor } from "@/server/auth/guard";
import { listPracticeSets, practiceFilterOptions } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";

export const metadata: Metadata = { title: "Tự ôn luyện" };

type SP = { q?: string; mon?: string; chuyende?: string; dang?: string; mucdo?: string; thongbao?: string };
const DIFFICULTIES = Object.keys(PRACTICE_DIFFICULTY) as PracticeDifficulty[];

// Học sinh §5 (tự ôn luyện): danh sách đề, tìm kiếm, lọc theo chuyên đề / dạng bài / mức độ.
// GV, quản lý: cùng trang để soạn và quản lý đề. Phụ huynh không dùng.
export default async function PracticeListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireActor();
  if (actor.role === "PARENT") notFound();
  const sp = await searchParams;
  const learner = actor.role === "STUDENT";
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
        description={
          learner
            ? "Chọn đề luyện tập theo chuyên đề, dạng bài, mức độ. Nộp bài là có điểm ngay, kèm đáp án và lời giải. Làm lại bao nhiêu lần cũng được."
            : "Đề luyện tập cho học sinh tự ôn: câu trắc nghiệm / trả lời ngắn chấm tự động, kèm lời giải. Đề nháp học sinh chưa thấy."
        }
        action={
          learner ? (
            <ButtonLink href="/on-luyen/lich-su" variant="secondary" size="sm">
              Lịch sử luyện tập
            </ButtonLink>
          ) : (
            <ButtonLink href="/on-luyen/moi" size="sm">
              Soạn đề mới
            </ButtonLink>
          )
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
        <EmptyState message={learner ? "Chưa có đề luyện tập phù hợp." : "Chưa có đề nào. Bấm \"Soạn đề mới\" để bắt đầu."} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sets.map((s) => (
            <li key={s.id} className="card-interactive flex flex-col rounded-block border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={PRACTICE_DIFFICULTY[s.difficulty].tone}>{PRACTICE_DIFFICULTY[s.difficulty].label}</Badge>
                {!s.isActive && <Badge tone="neutral">Nháp</Badge>}
                {s.forStudent && <Badge tone="warning">{`Bổ sung: ${s.forStudent.fullName}`}</Badge>}
                {s.subject && <span className="text-sm text-muted">{s.subject.name}</span>}
                {s.level && <span className="text-sm text-muted">· {s.level.name}</span>}
              </div>
              <h2 className="mt-2 text-lg">
                <Link href={`/on-luyen/${s.id}`} className="text-ink no-underline hover:text-primary">
                  {s.title}
                </Link>
              </h2>
              <p className="text-sm text-muted">
                Chuyên đề: {s.topic} · Dạng: {s.format}
              </p>
              <p className="mt-auto pt-3 text-sm">
                {s._count.questions} câu
                {learner
                  ? s.myAttempts > 0
                    ? ` · bạn đã làm ${s.myAttempts} lần · cao nhất ${Math.round((s.myBest ?? 0) * 100)}%`
                    : " · chưa làm"
                  : ` · ${s._count.attempts} lượt làm · ${s.createdBy.fullName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
