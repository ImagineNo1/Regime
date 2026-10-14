import Link from "next/link";
import { BalanceChart, ComboChart, MealDonut } from "@/components/charts";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, PageHeader, Stat } from "@/components/ui";
import { bmiCategory, bmr, calorieGoal, KCAL_PER_KG, tdee } from "@/lib/calc";
import { getAll } from "@/lib/data";
import { n0, n1, signed } from "@/lib/format";
import { addDays, jAxis, jLong, jNumeric, jShort } from "@/lib/jalali";

export default async function Dashboard() {
  const { settings: s, days, weights, today } = await getAll();

  const curW = weights.filter((w) => w.date <= today).at(-1)?.kg ?? s.startWeight;
  const lost = s.startWeight - curW;
  const remainingKg = Math.max(0, curW - s.targetWeight);
  const bmi = curW / (s.height / 100) ** 2;
  const progress = s.startWeight <= s.targetWeight ? 0 : Math.max(0, Math.min(1, lost / (s.startWeight - s.targetWeight)));

  const nowBmr = bmr(s, curW);
  const nowTdee = tdee(s, curW);
  const goal = calorieGoal(s, curW);
  const planned = nowTdee - goal;

  const logged = days.filter((d) => d.intake > 0);
  const totalBalance = logged.reduce((a, d) => a + (d.balance ?? 0), 0);
  const avgBalance = logged.length ? totalBalance / logged.length : 0;
  const last7 = days.filter((d) => d.date <= today && d.date > addDays(today, -7));
  const last7Logged = last7.filter((d) => d.intake > 0);
  const avg7 = last7Logged.length ? last7Logged.reduce((a, d) => a + d.intake, 0) / last7Logged.length : null;

  const weeksPlan = planned > 0 ? (remainingKg * KCAL_PER_KG) / (planned * 7) : null;
  const weeksReal = avgBalance < 0 ? (remainingKg * KCAL_PER_KG) / (-avgBalance * 7) : null;
  const eta = (w: number | null) => (w === null ? null : addDays(today, Math.round(w * 7)));

  const todayRow = days.find((d) => d.date === today);
  const last14 = days.filter((d) => d.date <= today).slice(-14);
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

  return (
    <div className="space-y-6">
      <PageHeader title="داشبورد" subtitle={`${jLong(today)} · روز ${n0(Math.max(1, days.findIndex((d) => d.date === today) + 1))} رژیم`}>
        <Link href="/day" className="btn btn-primary">
          <Icon name="plus" size={18} /> ثبت امروز
        </Link>
      </PageHeader>

      {/* امروز */}
      <section className="overflow-hidden rounded-2xl bg-brand p-5 text-brand-ink shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-sm opacity-80">امروز تا هدف کالری</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tnum text-4xl font-black">{n0(Math.abs(goal - (todayRow?.intake ?? 0)))}</span>
              <span className="text-sm opacity-80">
                کیلوکالری {goal - (todayRow?.intake ?? 0) >= 0 ? "باقی‌مانده" : "بیشتر از هدف"}
              </span>
            </div>
            <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, ((todayRow?.intake ?? 0) / goal) * 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <HeroNum label="دریافتی" value={n0(todayRow?.intake ?? 0)} />
            <HeroNum label="ورزش" value={n0(todayRow?.exercise ?? 0)} />
            <HeroNum label="پروتئین" value={n1(todayRow?.protein ?? 0)} unit="گرم" />
          </div>
        </div>
      </section>

      {/* وزن */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="وزن فعلی" value={n1(curW)} unit="کیلوگرم" icon="scale" tone="brand" hint={`شروع: ${n1(s.startWeight)}`} />
        <Stat label={lost >= 0 ? "کاهش تا امروز" : "افزایش تا امروز"} value={n1(Math.abs(lost))} unit="کیلوگرم" icon="check" tone={lost > 0 ? "good" : lost < 0 ? "bad" : "default"} />
        <Stat label="باقی‌مانده تا هدف" value={n1(remainingKg)} unit="کیلوگرم" icon="target" hint={`هدف: ${n1(s.targetWeight)}`} />
        <Stat label="شاخص توده بدنی (BMI)" value={n1(bmi)} hint={bmiCategory(bmi)} icon="flame" tone={bmi < 25 && bmi >= 18.5 ? "good" : "warn"} />
      </div>

      <Card title="پیشرفت تا وزن هدف">
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="tnum w-12 text-left font-bold">{n0(progress * 100)}٪</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Eta label="طبق برنامه (کسری روزانه)" weeks={weeksPlan} date={eta(weeksPlan)} />
          <Eta label="طبق روند واقعی شما" weeks={weeksReal} date={eta(weeksReal)} />
        </div>
      </Card>

      {/* متابولیسم */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="سوخت‌وساز پایه (BMR)" value={n0(nowBmr)} unit="کیلوکالری" hint="با فرمول Mifflin-St Jeor" />
        <Stat label="مصرف روزانه بدون ورزش (TDEE)" value={n0(nowTdee)} unit="کیلوکالری" hint={`ضریب تحرک ${n1(s.activityFactor)}`} />
        <Stat label="هدف کالری روزانه" value={n0(goal)} unit="کیلوکالری" hint={`کسری ${n0(planned)}`} tone="brand" icon="target" />
        <Stat
          label="میانگین دریافتی ۷ روز"
          value={avg7 === null ? "—" : n0(avg7)}
          unit={avg7 === null ? undefined : "کیلوکالری"}
          hint={avg7 === null ? "هنوز ثبت نشده" : avg7 <= goal ? "✓ زیر هدف" : "✗ بالای هدف"}
          tone={avg7 === null ? "default" : avg7 <= goal ? "good" : "bad"}
          icon="chart"
        />
      </div>

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
        <Card className="lg:col-span-3" title="تراز کالری روزانه" subtitle="سبز = کسری (خوب) · قرمز = مازاد">
          <BalanceChart data={chart14} x="day" k="balance" />
        </Card>
        <Card className="lg:col-span-2" title="کل دوره">
          <dl className="space-y-3 text-sm">
            <Row k="شروع رژیم" v={jNumeric(s.startDate)} />
            <Row k="روزهای ثبت‌شده" v={`${n0(logged.length)} روز`} />
            <Row k="تراز کالری کل" v={<span className={totalBalance < 0 ? "text-good" : totalBalance > 0 ? "text-bad" : ""}>{signed(totalBalance)}</span>} />
            <Row k="کاهش تخمینی از کالری" v={`${n1(-totalBalance / KCAL_PER_KG)} کیلوگرم`} />
            <Row k="کاهش واقعی ترازو" v={`${n1(lost)} کیلوگرم`} />
          </dl>
          <p className="mt-4 text-xs text-muted">حدود ۷۷۰۰ کیلوکالری کسری ≈ یک کیلوگرم چربی. همه اعداد تخمینی‌اند.</p>
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
                    <Link href={`/day?d=${d.date}`} className="font-medium hover:text-brand">
                      {jShort(d.date)}
                    </Link>
                  </td>
                  <td className="tnum">{d.intake ? n0(d.intake) : "—"}</td>
                  <td className="tnum text-ink-2">{n0(d.goal)}</td>
                  <td className="tnum">{d.exercise ? n0(d.exercise) : "—"}</td>
                  <td className={`tnum font-semibold ${d.balance === null ? "" : d.balance < 0 ? "text-good" : "text-bad"}`}>{signed(d.balance)}</td>
                  <td className="tnum">{d.weight ? n1(d.weight) : "—"}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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

function Eta({ label, weeks, date }: { label: string; weeks: number | null; date: string | null }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      {weeks === null || date === null ? (
        <div className="mt-1 text-ink-2">—{" "}<span className="text-xs text-muted">(هنوز کسری کالری ثبت نشده)</span></div>
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
