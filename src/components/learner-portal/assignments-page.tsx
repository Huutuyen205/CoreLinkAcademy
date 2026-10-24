import type { PracticeDifficulty } from "@prisma/client";
import Link from "next/link";
import { PracticeSetGrid, type PracticeSetRow } from "@/components/practice/practice-set-grid";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { SearchSelect } from "@/components/ui/search-select";
import { TabLinks } from "@/components/ui/tab-links";
import { listMyAssignments } from "@/server/assessment/service";
import { requireLearner } from "@/server/auth/learner";
import { listPracticeSets, practiceFilterOptions, type PracticeFilter } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

type Row = Awaited<ReturnType<typeof listMyAssignments>>[number];
type Tab = "bai-tap" | "kiem-tra" | "bo-sung" | "on-luyen";
type SP = { con?: string; loai?: string; q?: string; mon?: string; chuyende?: string; dang?: string; mucdo?: string };

const TABS: { key: Tab; label: string }[] = [
  { key: "bai-tap", label: "Bài tập" },
  { key: "kiem-tra", label: "Kiểm tra" },
  { key: "bo-sung", label: "Bổ sung" },
  { key: "on-luyen", label: "Tự ôn luyện" },
];
const DIFFICULTIES = Object.keys(PRACTICE_DIFFICULTY) as PracticeDifficulty[];

function statusOf(a: Row, now: Date): { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" } {
  if (a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED") {
    if (a.resultsPublished) return { label: `Đã chấm: ${a.score ?? 0}/${a.maxScore}`, tone: "success" };
    return a.awaitingGrade ? { label: "Đang chờ chấm", tone: "primary" } : { label: a.isLate ? "Đã nộp (muộn) — chờ kết quả" : "Đã nộp — chờ kết quả", tone: "neutral" };
  }
  if (a.returned) return { label: "Cần nộp lại", tone: "warning" };
  if (a.status === "CLOSED") return { label: "Đã đóng", tone: "neutral" };
  if (now > a.dueAt) return a.allowLate ? { label: "Quá hạn — vẫn nhận nộp muộn", tone: "warning" } : { label: "Quá hạn", tone: "danger" };
  return { label: a.submissionStatus === "IN_PROGRESS" ? "Đang làm" : "Chưa nộp", tone: "primary" };
}

/** Bài còn làm/nộp được: đang học, bài đang giao, chưa nộp (hoặc bị trả nộp lại), chưa hết hạn hay còn nhận muộn. */
function isTodo(a: Row, now: Date): boolean {
  return a.enrollmentStatus === "ACTIVE" && a.status === "PUBLISHED" && (a.submissionStatus === null || a.submissionStatus === "IN_PROGRESS") && (now <= a.dueAt || a.allowLate || a.returned);
}

const tabHref = (base: string, t: Tab) => (t === "bai-tap" ? `${base}/bai-tap` : `${base}/bai-tap?loai=${t}`);

// HS §1 "Bài tập" (phụ huynh: của con đang chọn, làm thay con được — DECISION-D42): mọi bài được giao gom theo dạng (bài tập, kiểm tra, bổ sung, tự ôn luyện).
// Mỗi mục: bài chưa xong để làm và nộp; bài xong rồi hiện kết quả hoặc "chờ kết quả".
export async function LearnerAssignmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { student: actor, base } = await requireLearner({ con: sp.con, den: "/phu-huynh/bai-tap" });
  const tab: Tab = TABS.find((t) => t.key === sp.loai)?.key ?? "bai-tap";
  const now = new Date();

  const options = tab === "on-luyen" ? await practiceFilterOptions(actor) : null;
  const pick = (v: string | undefined, list: string[]) => (v && list.includes(v) ? v : undefined);
  const filter: PracticeFilter = options
    ? {
        q: typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || undefined : undefined,
        subjectId: pick(sp.mon, options.subjects.map((s) => s.id)),
        topic: pick(sp.chuyende, options.topics),
        format: pick(sp.dang, options.formats),
        difficulty: pick(sp.mucdo, DIFFICULTIES) as PracticeDifficulty | undefined,
      }
    : {};
  const filtered = Object.values(filter).some(Boolean);

  const [rows, allSets] = await Promise.all([listMyAssignments(actor), listPracticeSets(actor, {})]);
  const sets = filtered ? await listPracticeSets(actor, filter) : allSets;

  const homework = rows.filter((r) => !r.isTest);
  const tests = rows.filter((r) => r.isTest);
  const supplemental = allSets.filter((s) => s.forStudent);
  const selfStudy = sets.filter((s) => !s.forStudent);
  const todoCount = (list: Row[]) => list.filter((r) => isTodo(r, now)).length;
  const counts: Record<Tab, number> = {
    "bai-tap": todoCount(homework),
    "kiem-tra": todoCount(tests),
    "bo-sung": supplemental.filter((s) => s.myAttempts === 0).length,
    "on-luyen": 0,
  };

  return (
    <>
      <PageHeader
        title="Bài tập"
        description="Bài chưa xong thì làm và nộp tại đây; bài xong rồi sẽ hiện kết quả hoặc đang chờ kết quả."
        action={
          tab === "on-luyen" ? (
            <ButtonLink href="/on-luyen/lich-su" variant="secondary" size="sm">
              Lịch sử luyện tập
            </ButtonLink>
          ) : undefined
        }
      />
      <TabLinks label="Dạng bài tập" active={tab} tabs={TABS.map((t) => ({ ...t, href: tabHref(base, t.key), count: counts[t.key] }))} />
      {tab === "bai-tap" && <AssignmentSections rows={homework} now={now} base={base} emptyTodo="Không có bài tập nào cần làm." emptyAll="Chưa có bài tập nào được giao." />}
      {tab === "kiem-tra" && <AssignmentSections rows={tests} now={now} base={base} emptyTodo="Không có bài kiểm tra nào cần làm." emptyAll="Chưa có bài kiểm tra nào." />}
      {tab === "bo-sung" && <SupplementalSections sets={supplemental} />}
      {tab === "on-luyen" && options && (
        <>
          <p className="mb-4 text-sm text-muted">Chọn đề theo chuyên đề, dạng bài, mức độ. Nộp bài là có điểm ngay, kèm đáp án và lời giải; làm lại bao nhiêu lần cũng được.</p>
          <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:items-end">
            <input type="hidden" name="loai" value="on-luyen" />
            <TextField name="q" label="Tìm đề" defaultValue={filter.q} maxLength={80} />
            <SearchSelect name="mon" label="Môn" emptyLabel="Tất cả" defaultValue={filter.subjectId ?? ""} options={options.subjects.map((s) => ({ value: s.id, label: s.name }))} />
            <SearchSelect name="chuyende" label="Chuyên đề" emptyLabel="Tất cả" defaultValue={filter.topic ?? ""} options={options.topics.map((t) => ({ value: t, label: t }))} />
            <SearchSelect name="dang" label="Dạng bài" emptyLabel="Tất cả" defaultValue={filter.format ?? ""} options={options.formats.map((f) => ({ value: f, label: f }))} />
            <SearchSelect name="mucdo" label="Mức độ" emptyLabel="Tất cả" defaultValue={filter.difficulty ?? ""} options={DIFFICULTIES.map((d) => ({ value: d, label: PRACTICE_DIFFICULTY[d].label }))} />
          </FilterForm>
          {selfStudy.length === 0 ? <EmptyState message="Chưa có đề luyện tập phù hợp." /> : <PracticeSetGrid sets={selfStudy} learner />}
        </>
      )}
    </>
  );
}

function AssignmentList({ items, now, base, todo }: { items: Row[]; now: Date; base: string; todo?: boolean }) {
  return (
    <ul className="divide-y divide-line rounded-block border border-line bg-surface">
      {items.map((a) => {
        const s = statusOf(a, now);
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="min-w-0">
              <Link href={`${base}/bai-tap/${a.id}`} className="font-medium">
                {a.title}
              </Link>
              {a.isTest && (
                <span className="ml-2 align-middle">
                  <Badge tone="warning">Kiểm tra</Badge>
                </span>
              )}
              <span className="block text-sm text-muted">
                {a.classCode} · hạn {formatDateTime(a.dueAt)}
                {a.submittedAt ? ` · nộp ${formatDateTime(a.submittedAt)}` : ""}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={s.tone}>{s.label}</Badge>
              {todo && (
                <ButtonLink href={`${base}/bai-tap/${a.id}`} size="sm">
                  Làm bài
                </ButtonLink>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Cần làm" (làm và nộp) rồi "Đã xong" (kết quả / chờ kết quả / đã đóng). */
function AssignmentSections({ rows, now, base, emptyTodo, emptyAll }: { rows: Row[]; now: Date; base: string; emptyTodo: string; emptyAll: string }) {
  if (rows.length === 0) return <EmptyState message={emptyAll} />;
  const todo = rows.filter((r) => isTodo(r, now));
  const done = rows.filter((r) => !todo.includes(r)).reverse();
  return (
    <>
      <h2 className="mb-3 text-xl">Cần làm ({todo.length})</h2>
      {todo.length === 0 ? <EmptyState message={emptyTodo} /> : <AssignmentList items={todo} now={now} base={base} todo />}
      {done.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl">Đã xong và đã đóng ({done.length})</h2>
          <AssignmentList items={done} now={now} base={base} />
        </>
      )}
    </>
  );
}

/** Đề giáo viên giao riêng cho em: chưa làm → làm ngay; đã làm → kết quả cao nhất, làm lại được. */
function SupplementalSections({ sets }: { sets: PracticeSetRow[] }) {
  if (sets.length === 0) return <EmptyState message="Giáo viên chưa giao bài bổ sung nào." />;
  const todo = sets.filter((s) => s.myAttempts === 0);
  const done = sets.filter((s) => s.myAttempts > 0);
  return (
    <>
      <h2 className="mb-3 text-xl">Cần làm ({todo.length})</h2>
      {todo.length === 0 ? <EmptyState message="Đã làm hết các bài bổ sung." /> : <PracticeSetGrid sets={todo} learner />}
      {done.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl">Đã làm ({done.length})</h2>
          <PracticeSetGrid sets={done} learner />
        </>
      )}
    </>
  );
}
