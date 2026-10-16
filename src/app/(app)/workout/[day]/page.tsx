import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { WorkoutDoneButton, WorkoutTimer } from "@/components/WorkoutTimer";
import { getWorkoutDone, requireUser } from "@/lib/data";
import { n0 } from "@/lib/format";
import { buildSteps, getWorkoutDay, workoutMinutes, type Move } from "@/lib/workout";

/** پلیر آپارات داخل <details>؛ iframe تنبل است و فقط با باز شدن لود می‌شود */
function Video({ move }: { move: Move }) {
  if (!move.video) return null;
  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg py-1 text-sm font-medium text-brand hover:underline">
        <Icon name="play" size={15} />
        <span className="group-open:hidden">ویدیو آموزشی</span>
        <span className="hidden group-open:inline">بستن ویدیو</span>
      </summary>
      <div className="mt-2 aspect-video overflow-hidden rounded-xl bg-surface-2">
        <iframe
          src={`https://www.aparat.com/video/video/embed/videohash/${move.video}/vt/frame`}
          title={`ویدیو آموزش ${move.name}`}
          loading="lazy"
          allowFullScreen
          className="size-full"
        />
      </div>
    </details>
  );
}

function MoveList({ title, moves }: { title: string; moves: Move[] }) {
  return (
    <Card title={title}>
      <ul className="divide-y divide-line text-sm">
        {moves.map((m, i) => (
          <li key={i} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex justify-between gap-3">
              <span>{m.name}</span>
              <span className="tnum text-muted">{n0(m.sec)} ثانیه</span>
            </div>
            <Video move={m} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function WorkoutDayPage({ params }: { params: Promise<{ day: string }> }) {
  const d = getWorkoutDay(Number((await params).day));
  if (!d) notFound();
  const u = await requireUser();
  const done = (await getWorkoutDone(u._id)).includes(d.day);
  const hiit = d.rounds > 1;

  return (
    <div className="space-y-6">
      <Link href="/workout" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <Icon name="chevR" size={16} />
        برنامه هفتگی
      </Link>
      <PageHeader title={`روز ${n0(d.day)} · ${d.weekday}: ${d.title}`} subtitle={d.focus}>
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">
            <Icon name="clock" size={14} />
            {n0(workoutMinutes(d))} دقیقه
          </Badge>
          {hiit && (
            <Badge tone="brand">
              {n0(d.rounds)} دور · {n0(d.work)} ثانیه کار / {n0(d.rest)} ثانیه استراحت
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <MoveList title="۱. گرم کردن" moves={d.warmup} />

          <Card
            title="۲. تمرین اصلی"
            subtitle={
              hiit
                ? `حرکات زیر یک دور است؛ ${n0(d.rounds)} دور تکرار کن و بین دورها ${n0(d.roundRest)} ثانیه استراحت کن.`
                : undefined
            }
          >
            <ol className="space-y-3">
              {d.exercises.map((e, i) => (
                <li key={i} className="flex gap-4 rounded-xl bg-surface-2 p-4">
                  <span className="tnum grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft font-bold text-brand">{n0(i + 1)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="font-bold">{e.name}</h3>
                      <span className="tnum text-sm text-muted">
                        {e.sec ? `${n0(e.sec / 60)} دقیقه` : `${n0(d.work)} ثانیه`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-7 text-ink-2">{e.cue}</p>
                    <Video move={e} />
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <MoveList title="۳. سرد کردن و کشش" moves={d.cooldown} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <WorkoutTimer steps={buildSteps(d)} />
          <WorkoutDoneButton day={d.day} done={done} />
          <nav className="flex justify-between text-sm">
            {d.day > 1 ? (
              <Link href={`/workout/${d.day - 1}`} className="text-ink-2 hover:text-ink">
                → روز قبل
              </Link>
            ) : (
              <span />
            )}
            {d.day < 7 && (
              <Link href={`/workout/${d.day + 1}`} className="text-ink-2 hover:text-ink">
                روز بعد ←
              </Link>
            )}
          </nav>
        </aside>
      </div>
    </div>
  );
}
