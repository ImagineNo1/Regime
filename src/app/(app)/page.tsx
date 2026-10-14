import Link from "next/link";
import { BalanceChart, ComboChart, MealDonut } from "@/components/charts";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { bmiCategory, bmr, calorieGoal, KCAL_PER_KG, progress, tdee } from "@/lib/calc";
import { getPlanData } from "@/lib/data";
import { n0, n1, signed } from "@/lib/format";
import { addDays, diffDays, jAxis, jLong, jNumeric, jShort } from "@/lib/jalali";
import { GOALS } from "@/lib/types";

export default async function Dashboard() {
  const { user, plan, days, weights, allWeights, today } = await getPlanData();

  if (!plan) {
    return (
      <div className="space-y-6">
        <PageHeader title={`سلام ${user.name}`} subtitle={jLong(today)} />
        <Card>
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="target" size={28} />
            </div>
            <h2 className="text-lg font-bold">اول یک برنامه بسازید</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
              هدف (کاهش، افزایش یا حفظ وزن) و بازه زمانی را مشخص کنید تا داشبورد، کالری روزانه و پیشرفت شما حساب شود.
            </p>
            <Link href="/plans/new" className="btn btn-primary mt-5">ساختن برنامه</Link>
          </div>
        </Card>
      </div>
    );
  }

  const g = plan.goal;
  const notStarted = plan.startDate > today;
  const ended = !!plan.endDate && plan.endDate < today;
  const refDay = ended ? plan.endDate! : today;

  // وزن فعلی: آخرین وزن ثبت‌شده تا امروز (داخل برنامه)، وگرنه وزن شروع برنامه
  const curW = weights.filter((w) => w.date <= refDay).at(-1)?.kg ?? plan.startWeight;
  const bmi = curW / (user.height / 100) ** 2;

  const nowBmr = bmr(user, curW);
  const nowTdee = tdee(user, plan.activityFactor, curW);
  const goalKcal = calorieGoal(user, plan, curW);

  const logged = days.filter((d) => d.intake > 0);
  const totalBalance = logged.reduce((a, d) => a + (d.balance ?? 0), 0);
  const avgBalance = logged.length ? totalBalance / logged.length : null;
  const pr = progress(plan, curW, avgBalance, today);

  const upto = days.filter((d) => d.date <= refDay);
  const last7 = upto.slice(-7);
  const last7Logged = last7.filter((d) => d.intake > 0);
  const avg7 = last7Logged.length ? last7Logged.reduce((a, d) => a + d.intake, 0) / last7Logged.length : null;
  const avg7Ok = avg7 === null ? null : g === "gain" ? avg7 >= goalKcal : g === "lose" ? avg7 <= goalKcal : Math.abs(avg7 - goalKcal) <= 200;

  const eta = (w: number | null) => (w === null ? null : addDays(today, Math.round(w * 7)));
  const todayRow = days.find((d) => d.date === today);
  const todayIntake = todayRow?.intake ?? 0;
  const left = goalKcal - todayIntake;

  const last14 = upto.slice(-14);
  const chart14 = last14.map((d) => ({
    day: jAxis(d.date),
    intake: d.intake || null,
    goal: d.goal,
    burned: d.burned,
    balance: d.balance,
  }));
  const meals = [
    { name: "صبحانه", value: last7.reduce((a, d) => a + d.breakfast, 0) },
    { name: "ناهار", value: last7.reduce((a, d) => a + d.lunch, 0) },
    { name: "شام", value: last7.reduce((a, d) => a + d.dinner, 0) },
    { name: "میان‌وعده‌ها", value: last7.reduce((a, d) => a + d.snacks, 0) },
  ];
  const dayNo = days.findIndex((d) => d.date === today) + 1;
  const goodWord = g === "lose" ? "کسری" : g === "gain" ? "مازاد" : "تعادل";
  const latestAny = allWeights.at(-1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={plan.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={g === "lose" ? "good" : g === "gain" ? "warn" : "muted"}>{GOALS[g].label}</Badge>
            <span className="tnum">
              {jNumeric(plan.startDate)} ← {plan.endDate ? jNumeric(plan.endDate) : "بدون پایان"}
            </span>
            {dayNo > 0 && <span>· روز {n0(dayNo)}{plan.endDate ? ` از ${n0(diffDays(plan.endDate, plan.startDate) + 1)}` : ""}</span>}
          </span>
        }
      >
        <div className="flex gap-2">
          <Link href={`/plans/${plan.id}`} className="btn btn-ghost">ویرایش برنامه</Link>
          <Link href="/day" className="btn btn-primary">
            <Icon name="plus" size={18} /> ثبت امروز
          </Link>
        </div>
      </PageHeader>

      {notStarted && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          این برنامه از {jLong(plan.startDate)} شروع می‌شود. تا آن روز آماری ندارد.
        </p>
      )}
      {ended && (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-2">
          این برنامه در {jLong(plan.endDate!)} تمام شده است. آمار زیر مربوط به همان دوره است.{" "}
          <Link href="/plans/new" className="font-semibold text-brand hover:underline">برنامه بعدی را بسازید ←</Link>
        </p>
      )}

      {/* امروز */}
      {!notStarted && !ended && (
        <section className="overflow-hidden rounded-2xl bg-brand p-5 text-brand-ink shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm opacity-80">امروز تا هدف کالری ({n0(goalKcal)})</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tnum text-4xl font-black">{n0(Math.abs(left))}</span>
                <span className="text-sm opacity-80">کیلوکالری {left >= 0 ? (g === "gain" ? "مانده تا هدف" : "باقی‌مانده") : "بیشتر از هدف"}</span>
              </div>
              <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (todayIntake / goalKcal) * 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <HeroNum label="دریافتی" value={n0(todayIntake)} />
              <HeroNum label="ورزش" value={n0(todayRow?.exercise ?? 0)} />
              <HeroNum label="پروتئین" value={n1(todayRow?.protein ?? 0)} unit="گرم" />
            </div>
          </div>
        </section>
      )}

      {/* وزن */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="وزن فعلی" value={n1(curW)} unit="کیلوگرم" icon="scale" tone="brand" hint={`شروع برنامه: ${n1(plan.startWeight)}`} />
        <Stat
          label="تغییر از شروع"
          value={signed(pr.change, 1)}
          unit="کیلوگرم"
          icon="check"
          tone={pr.change === 0 ? "default" : (g === "lose" ? pr.change < 0 : g === "gain" ? pr.change > 0 : Math.abs(pr.change) <= 1) ? "good" : "bad"}
        />
        {g !== "maintain" ? (
          <Stat label="باقی‌مانده تا هدف" value={n1(pr.remaining)} unit="کیلوگرم" icon="target" hint={`هدف: ${n1(plan.targetWeight)}`} />
        ) : (
          <Stat label="فاصله از وزن پایه" value={n1(pr.remaining)} unit="کیلوگرم" icon="target" hint={pr.remaining <= 1 ? "✓ در محدوده" : "بیش از ۱ کیلو"} tone={pr.remaining <= 1 ? "good" : "warn"} />
        )}
        <Stat label="شاخص توده بدنی (BMI)" value={n1(bmi)} hint={bmiCategory(bmi)} icon="flame" tone={bmi < 25 && bmi >= 18.5 ? "good" : "warn"} />
      </div>

      {g !== "maintain" && (
        <Card title="پیشرفت تا وزن هدف">
          <div className="flex items-center gap-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pr.fraction * 100}%` }} />
            </div>
            <span className="tnum w-12 text-left font-bold">{n0(pr.fraction * 100)}٪</span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Eta label={`طبق برنامه (${goodWord} ${n0(plan.dailyDelta)} در روز)`} weeks={pr.weeksPlan} date={eta(pr.weeksPlan)} />
            <Eta label="طبق روند واقعی شما" weeks={pr.weeksReal} date={eta(pr.weeksReal)} goodWord={goodWord} />
          </div>
          {pr.daysLeft !== null && !ended && pr.remaining > 0 && (
            <p className={`mt-3 text-sm ${pr.neededDelta !== null && pr.neededDelta > plan.dailyDelta ? "text-warn" : "text-ink-2"}`}>
              {n0(pr.daysLeft)} روز تا پایان دوره مانده؛ برای رسیدن به هدف تا آن روز، روزانه حدود{" "}
              <b className="tnum">{n0(pr.neededDelta)}</b> کیلوکالری {goodWord} لازم است.
            </p>
          )}
        </Card>
      )}

      {/* متابولیسم */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="سوخت‌وساز پایه (BMR)" value={n0(nowBmr)} unit="کیلوکالری" hint="با فرمول Mifflin-St Jeor" />
        <Stat label="مصرف روزانه بدون ورزش (TDEE)" value={n0(nowTdee)} unit="کیلوکالری" hint={`ضریب تحرک ${n1(plan.activityFactor)}`} />
        <Stat
          label="هدف کالری روزانه"
          value={n0(goalKcal)}
          unit="کیلوکالری"
          hint={g === "maintain" ? "برابر مصرف روزانه" : `${goodWord} ${n0(plan.dailyDelta)}`}
          tone="brand"
          icon="target"
        />
        <Stat
          label="میانگین دریافتی ۷ روز"
          value={avg7 === null ? "—" : n0(avg7)}
          unit={avg7 === null ? undefined : "کیلوکالری"}
          hint={avg7 === null ? "هنوز ثبت نشده" : avg7Ok ? "✓ مطابق هدف" : g === "gain" ? "✗ کمتر از هدف" : g === "lose" ? "✗ بالای هدف" : "✗ دور از هدف"}
          tone={avg7 === null ? "default" : avg7Ok ? "good" : "bad"}
          icon="chart"
        />
      </div>

      {!notStarted && (
        <>
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="کالری ۱۴ روز اخیر" subtitle="ستون: دریافتی · خط‌چین: هدف · خط خاکستری: کل سوزانده">
          <ComboChart
            data={chart14}
            x="day"
            unit="کیلوکالری"
            bars={[{ key: "intake", name: "دریافتی", color: "intake" }]}
            lines={[
              { key: "goal", name: "هدف", color: "goal", dashed: true },
              { key: "burned", name: "کل سوزانده", color: "burned", dots: true },
            ]}
          />
        </Card>
        <Card className="lg:col-span-2" title="سهم وعده‌ها" subtitle="۷ روز اخیر">
          <MealDonut data={meals} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="تراز کالری روزانه" subtitle={`سبز = هم‌جهت با هدف (${goodWord}) · قرمز = خلاف هدف`}>
          <BalanceChart data={chart14} x="day" k="balance" goal={g} />
        </Card>
        <Card className="lg:col-span-2" title="کل دوره">
          <dl className="space-y-3 text-sm">
            <Row k="روزهای ثبت‌شده" v={`${n0(logged.length)} از ${n0(upto.length)} روز`} />
            <Row
              k="تراز کالری کل"
              v={<span className={logged.length ? (g === "gain" ? totalBalance > 0 : totalBalance < 0) ? "text-good" : "text-bad" : ""}>{signed(totalBalance)}</span>}
            />
            <Row k="تغییر وزن تخمینی از کالری" v={`${signed(totalBalance / KCAL_PER_KG, 1)} کیلوگرم`} />
            <Row k="تغییر واقعی ترازو" v={`${signed(pr.change, 1)} کیلوگرم`} />
            {latestAny && latestAny.date > refDay && <Row k="آخرین وزن (بعد از دوره)" v={`${n1(latestAny.kg)} کیلوگرم`} />}
          </dl>
          <p className="mt-4 text-xs text-muted">حدود ۷۷۰۰ کیلوکالری ≈ یک کیلوگرم وزن بدن. همه اعداد تخمینی‌اند.</p>
        </Card>
      </div>

      <Card title="۷ روز اخیر" pad={false} action={<Link href="/reports" className="text-xs text-brand hover:underline">همه روزها ←</Link>}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>روز</th>
                <th>دریافتی</th>
                <th>هدف</th>
                <th>ورزش</th>
                <th>تراز</th>
                <th>وزن</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {[...last7].reverse().map((d) => (
                <tr key={d.date}>
                  <td>
                    <Link href={`/day?d=${d.date}`} className="font-medium hover:text-brand">{jShort(d.date)}</Link>
                  </td>
                  <td className="tnum">{d.intake ? n0(d.intake) : "—"}</td>
                  <td className="tnum text-ink-2">{n0(d.goal)}</td>
                  <td className="tnum">{d.exercise ? n0(d.exercise) : "—"}</td>
                  <td className={`tnum font-semibold ${d.status === "good" ? "text-good" : d.status === "bad" ? "text-bad" : ""}`}>{signed(d.balance)}</td>
                  <td className="tnum">{d.weight ? n1(d.weight) : "—"}</td>
                  <td><StatusBadge status={d.status} goal={g} /></td>
                </tr>
              ))}
              {last7.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted">هنوز روزی از این برنامه نگذشته.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

function HeroNum({ label, value, unit = "کیلوکالری" }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="tnum text-xl font-extrabold">{value}</div>
      <div className="text-[11px] opacity-75">{label} ({unit})</div>
    </div>
  );
}

function Eta({ label, weeks, date, goodWord }: { label: string; weeks: number | null; date: string | null; goodWord?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      {weeks === null || date === null ? (
        <div className="mt-1 text-ink-2">
          — <span className="text-xs text-muted">{goodWord ? `(هنوز ${goodWord} کالری ثبت نشده)` : ""}</span>
        </div>
      ) : weeks === 0 ? (
        <div className="mt-1 font-bold text-good">🎉 به هدف رسیدید</div>
      ) : (
        <div className="mt-1">
          <b className="tnum">{n1(weeks)}</b> هفته دیگر · حدود <b className="tnum">{jNumeric(date)}</b>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2 last:border-0">
      <dt className="text-ink-2">{k}</dt>
      <dd className="tnum font-semibold">{v}</dd>
    </div>
  );
}
