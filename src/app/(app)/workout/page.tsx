import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { getWorkoutDone, requireUser } from "@/lib/data";
import { n0 } from "@/lib/format";
import { WORKOUT, workoutMinutes } from "@/lib/workout";

const LEVEL_TONE = { آسان: "good", متوسط: "warn", سخت: "bad" } as const;

export default async function WorkoutPage() {
  const u = await requireUser();
  const done = await getWorkoutDone(u._id);
  const next = WORKOUT.find((d) => !done.includes(d.day))?.day ?? 1;
  const pct = Math.round((done.length / WORKOUT.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تمرین در خانه"
        subtitle="برنامه ۷ روزه چربی‌سوزی بدون وسیله؛ هر روز گرم کردن، تمرین اصلی و سرد کردن با تایمر و ویدیو آموزشی."
      >
        <Link href={`/workout/${next}`} className="btn btn-primary">
          <Icon name="play" size={18} />
          {done.length ? `ادامه: روز ${n0(next)}` : "شروع روز اول"}
        </Link>
      </PageHeader>

      <Card title="پیشرفت این هفته" subtitle="هفته از شنبه شروع می‌شود. هر تمرین انجام‌شده در «ثبت روزانه» هم به‌عنوان فعالیت ثبت می‌شود.">
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-3 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="tnum font-bold text-brand">
            {n0(done.length)} از {n0(WORKOUT.length)}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WORKOUT.map((d) => {
          const ok = done.includes(d.day);
          return (
            <Link
              key={d.day}
              href={`/workout/${d.day}`}
              className={`group rounded-2xl border bg-surface p-5 shadow-card transition hover:border-brand ${ok ? "border-good" : "border-line"}`}
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  روز {n0(d.day)} · {d.weekday}
                </span>
                {ok && (
                  <Badge tone="good">
                    <Icon name="check" size={14} />
                    انجام شد
                  </Badge>
                )}
              </div>
              <h2 className="mt-3 text-lg font-bold group-hover:text-brand">{d.title}</h2>
              <p className="mt-1 text-sm leading-7 text-ink-2">{d.focus}</p>
              <div className="mt-4 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-ink-2">
                  <Icon name="clock" size={15} />
                  {n0(workoutMinutes(d))} دقیقه
                </span>
                <Badge tone={LEVEL_TONE[d.level]}>{d.level}</Badge>
              </div>
            </Link>
          );
        })}
      </div>

      <Card title="نکات ایمنی">
        <p className="text-sm leading-7 text-ink-2">
          اگر بیماری قلبی، فشار خون، دیابت، آسیب مفصلی یا بارداری داری، قبل از شروع با پزشک مشورت کن. اگر حین تمرین درد قفسه سینه، سرگیجه یا
          درد مفصل داشتی، فوراً تمرین را متوقف کن. برای هر حرکت نسخه آسان‌تر هم نوشته شده است.
        </p>
      </Card>
    </div>
  );
}
