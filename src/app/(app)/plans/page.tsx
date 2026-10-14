import Link from "next/link";
import { deletePlan, setActivePlan } from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";
import { Icon } from "@/components/Icon";
import { Badge, Card, PageHeader } from "@/components/ui";
import { calorieGoal, progress } from "@/lib/calc";
import { getPlans, getWeights, pickActivePlan, requireUser } from "@/lib/data";
import { n0, n1, signed } from "@/lib/format";
import { diffDays, jNumeric, todayIso } from "@/lib/jalali";
import { GOALS, type Plan } from "@/lib/types";

function phase(p: Plan, today: string) {
  if (p.startDate > today) return { tone: "muted" as const, label: "آینده" };
  if (p.endDate && p.endDate < today) return { tone: "muted" as const, label: "تمام‌شده" };
  return { tone: "good" as const, label: "در جریان" };
}

export default async function PlansPage() {
  const u = await requireUser();
  const today = todayIso();
  const [plans, weights] = await Promise.all([getPlans(u._id), getWeights(u._id)]);
  const active = pickActivePlan(plans, u.user.activePlanId, today);

  return (
    <div className="space-y-6">
      <PageHeader title="برنامه‌ها" subtitle="برای هر دوره (کاهش، افزایش یا حفظ وزن) یک برنامه جدا بسازید. ثبت‌های روزانه مشترک‌اند و هر برنامه بازه خودش را نشان می‌دهد.">
        <Link href="/plans/new" className="btn btn-primary">
          <Icon name="plus" size={18} /> برنامه جدید
        </Link>
      </PageHeader>

      {plans.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="target" size={28} />
            </div>
            <h2 className="text-lg font-bold">هنوز برنامه‌ای ندارید</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
              هدف (کاهش، افزایش یا حفظ وزن)، بازه زمانی و سرعت دلخواه را انتخاب کنید تا کالری روزانه‌تان حساب شود.
            </p>
            <Link href="/plans/new" className="btn btn-primary mt-5">ساختن اولین برنامه</Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const ph = phase(p, today);
            const inPlan = weights.filter((w) => w.date >= p.startDate && w.date <= (p.endDate && p.endDate < today ? p.endDate : today));
            const curW = inPlan.at(-1)?.kg ?? p.startWeight;
            const pr = progress(p, curW, null, today);
            const length = p.endDate ? diffDays(p.endDate, p.startDate) + 1 : null;
            const isActive = active?.id === p.id;
            return (
              <section key={p.id} className={`rounded-2xl border bg-surface p-5 shadow-card ${isActive ? "border-brand" : "border-line"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-extrabold">{p.name}</h2>
                      {isActive && <Badge tone="brand">فعال</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                      <Badge tone={p.goal === "lose" ? "good" : p.goal === "gain" ? "warn" : "muted"}>{GOALS[p.goal].label}</Badge>
                      <Badge tone={ph.tone}>{ph.label}</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Link href={`/plans/${p.id}`} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="ویرایش" title="ویرایش">
                      <Icon name="edit" size={16} />
                    </Link>
                    <ActionButton
                      run={deletePlan.bind(null, p.id)}
                      icon="trash"
                      label="حذف برنامه"
                      confirmText={`برنامه «${p.name}» حذف شود؟ ثبت‌های غذا، ورزش و وزن پاک نمی‌شوند.`}
                      className="hover:text-bad"
                    />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Kv k="بازه" v={<span className="tnum">{jNumeric(p.startDate)} ← {p.endDate ? jNumeric(p.endDate) : "بدون پایان"}</span>} />
                  <Kv k="مدت" v={length ? `${n0(length)} روز` : "—"} />
                  <Kv
                    k="وزن"
                    v={
                      <span className="tnum">
                        {n1(p.startWeight)}
                        {p.goal !== "maintain" && <> ← {n1(p.targetWeight)}</>} کیلو
                      </span>
                    }
                  />
                  <Kv k="هدف کالری روزانه" v={<span className="tnum">{n0(calorieGoal(u.user, p, curW))}</span>} />
                </dl>

                {p.goal !== "maintain" ? (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>پیشرفت</span>
                      <span className="tnum">{n0(pr.fraction * 100)}٪ · تغییر {signed(pr.change, 1)} کیلو</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pr.fraction * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted">تغییر وزن از شروع: <span className="tnum">{signed(pr.change, 1)}</span> کیلو</p>
                )}

                {!isActive && (
                  <ActionButton run={setActivePlan.bind(null, p.id)} label="فعال کردن" className="mt-4 bg-surface-2 px-3! py-1.5! text-xs font-semibold text-ink!">
                    فعال کردن این برنامه
                  </ActionButton>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold">{v}</dd>
    </div>
  );
}
