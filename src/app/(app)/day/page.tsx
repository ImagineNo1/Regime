import { copyMeal, deleteActivityLog, deleteFoodLog } from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";
import { ActivityForm } from "@/components/ActivityForm";
import { DateNav } from "@/components/DateNav";
import { FoodForm } from "@/components/FoodForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Empty } from "@/components/ui";
import { WeightForm } from "@/components/WeightForm";
import Link from "next/link";
import { activityKcal, buildDays, fallbackPlan } from "@/lib/calc";
import {
  getActivities,
  getActivityLogs,
  getFoodLogs,
  getFoods,
  getPlans,
  getWeights,
  pickActivePlan,
  planForDate,
  requireUser,
} from "@/lib/data";
import { n0, n1, signed } from "@/lib/format";
import { addDays, isValidIso, jShort, todayIso } from "@/lib/jalali";
import { GOALS, MEALS, type Meal } from "@/lib/types";

function defaultMeal(): Meal {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (h < 10) return "صبحانه";
  if (h < 12) return "میان‌وعده صبح";
  if (h < 16) return "ناهار";
  if (h < 19) return "میان‌وعده عصر";
  if (h < 22) return "شام";
  return "میان‌وعده شب";
}

export default async function DayPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const today = todayIso();
  const date = isValidIso(d) ? d : today;

  const u = await requireUser();
  const [plans, foods, activities, foodLogs, actLogs, weights] = await Promise.all([
    getPlans(u._id),
    getFoods(u._id),
    getActivities(u._id),
    getFoodLogs(u._id, date),
    getActivityLogs(u._id, date),
    getWeights(u._id, { to: date }),
  ]);
  foods.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  activities.sort((a, b) => a.name.localeCompare(b.name, "fa"));

  // این روز با تنظیمات برنامه‌ای که شاملش است حساب می‌شود؛ اگر هیچ برنامه‌ای نبود، «حفظ وزن»
  const plan = planForDate(plans, pickActivePlan(plans, u.user.activePlanId, today), date);
  // وزن مرجع: آخرین وزن ثبت‌شده تا این روز (داخل برنامه)، وگرنه وزن شروع برنامه
  const inside = weights.filter((w) => !plan || w.date >= plan.startDate);
  const refW = inside.at(-1)?.kg ?? plan?.startWeight ?? weights.at(-1)?.kg ?? 75;
  const dayPlan = { ...(plan ?? fallbackPlan(refW, date)), startDate: date, endDate: date, startWeight: refW };
  const row = buildDays(u.user, dayPlan, foodLogs, actLogs, weights.filter((w) => w.date === date), date)[0];
  const weightToday = weights.find((w) => w.date === date)?.kg ?? null;
  const remaining = row.goal - row.intake;
  const pctOfGoal = Math.min(1, row.intake / row.goal);
  const yesterday = addDays(date, -1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">ثبت روزانه</h1>
          <p className="mt-1 text-sm text-ink-2">غذا، ورزش و وزن هر روز را اینجا ثبت کنید.</p>
        </div>
        <DateNav date={date} today={today} />
      </div>

      {plan ? (
        <p className="text-xs text-muted">
          محاسبه با برنامه «<Link href={`/plans/${plan.id}`} className="font-semibold text-ink-2 hover:text-brand">{plan.name}</Link>» ({GOALS[plan.goal].label})
        </p>
      ) : (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          این روز داخل هیچ برنامه‌ای نیست؛ هدف کالری برابر مصرف روزانه (حفظ وزن) در نظر گرفته شده.{" "}
          <Link href="/plans/new" className="font-semibold underline">ساختن برنامه</Link>
        </p>
      )}

      {/* خلاصه روز */}
      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card md:grid-cols-[auto_1fr]">
        <Ring value={pctOfGoal} over={row.intake > row.goal && dayPlan.goal !== "gain"}>
          <div className="text-center">
            <div className="tnum text-2xl font-extrabold">{n0(Math.abs(remaining))}</div>
            <div className="text-[11px] text-muted">{remaining >= 0 ? "کالری باقی‌مانده" : "کالری بیشتر از هدف"}</div>
          </div>
        </Ring>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 self-center sm:grid-cols-3">
          <Mini label="دریافتی" value={n0(row.intake)} unit="کیلوکالری" />
          <Mini label="هدف امروز" value={n0(row.goal)} unit="کیلوکالری" />
          <Mini label="پروتئین" value={n1(row.protein)} unit="گرم" />
          <Mini label="ورزش" value={n0(row.exercise)} unit="کیلوکالری" />
          <Mini label="کل سوزانده" value={n0(row.burned)} unit="کیلوکالری" hint={`پایه ${n0(row.tdee)} + ورزش`} />
          <div>
            <div className="text-xs text-muted">تراز امروز</div>
            <div className={`tnum mt-0.5 text-lg font-bold ${row.status === "good" ? "text-good" : row.status === "bad" ? "text-bad" : ""}`}>
              {row.balance === null ? "—" : signed(row.balance)}
            </div>
            <div className="mt-1"><StatusBadge status={row.status} goal={dayPlan.goal} /></div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card title="افزودن خوراکی" subtitle="از بانک غذا جستجو کنید؛ اگر نبود، اسم و کالری را دستی بنویسید.">
            <FoodForm date={date} foods={foods} defaultMeal={defaultMeal()} />
          </Card>

          <Card
            title="خوراکی‌های این روز"
            action={
              <ActionButton
                run={copyMeal.bind(null, yesterday, date, "")}
                icon="copy"
                label="کپی همه خوراکی‌های دیروز"
                confirmText={`همه خوراکی‌های ${jShort(yesterday)} به این روز اضافه شود؟`}
                className="text-xs"
              >
                کپی از دیروز
              </ActionButton>
            }
          >
            {foodLogs.length === 0 ? (
              <Empty>هنوز چیزی ثبت نشده.</Empty>
            ) : (
              <div className="space-y-4">
                {MEALS.filter((m) => foodLogs.some((f) => f.meal === m)).map((m) => {
                  const items = foodLogs.filter((f) => f.meal === m);
                  const total = items.reduce((s, f) => s + f.kcal, 0);
                  return (
                    <div key={m}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-bold">{m}</span>
                        <span className="tnum text-ink-2">{n0(total)} کیلوکالری</span>
                      </div>
                      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                        {items.map((f) => (
                          <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{f.name}</div>
                              <div className="text-xs text-muted">
                                {f.qty ? `${n1(f.qty).replace(/٫۰$/, "")} ${f.unit === "قاشق" ? "قاشق" : f.unit}` : ""}
                                {f.manual ? (f.qty ? " · " : "") + "کالری دستی" : ""}
                                {f.protein ? ` · ${n1(f.protein)} گرم پروتئین` : ""}
                              </div>
                            </div>
                            <span className="tnum font-bold">{n0(f.kcal)}</span>
                            <ActionButton run={deleteFoodLog.bind(null, f.id)} icon="trash" label="حذف" className="hover:text-bad" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="وزن صبح" subtitle="کیلوگرم">
            <WeightForm date={date} kg={weightToday} />
          </Card>

          <Card title="ورزش و فعالیت">
            <ActivityForm date={date} activities={activities} weight={row.refWeight} />
            {actLogs.length > 0 && (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
                {actLogs.map((a) => {
                  const kcal = a.kcalManual ?? (a.met ? activityKcal(a.met, row.refWeight, a.minutes) : 0);
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="text-xs text-muted">
                          {a.minutes ? `${n0(a.minutes)} دقیقه` : ""}
                          {a.kcalManual !== null ? " · کالری دستی" : ""}
                        </div>
                      </div>
                      <span className="tnum font-bold">{n0(kcal)}</span>
                      <ActionButton run={deleteActivityLog.bind(null, a.id)} icon="trash" label="حذف" className="hover:text-bad" />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="tnum text-lg font-bold">{value}</span>
        <span className="text-[11px] text-muted">{unit}</span>
      </div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

function Ring({ value, over, children }: { value: number; over: boolean; children: React.ReactNode }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto grid size-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={over ? "var(--bad)" : "var(--brand)"}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          opacity={value > 0 ? 1 : 0}
        />
      </svg>
      {children}
    </div>
  );
}
