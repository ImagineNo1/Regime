import Link from "next/link";
import { BalanceChart, ComboChart, MealDonut, WeightChart } from "@/components/charts";
import { Card, PageHeader } from "@/components/ui";
import { monthly, weekly } from "@/lib/calc";
import { getAll } from "@/lib/data";
import { jAxis } from "@/lib/jalali";

const RANGES = [
  { k: "14", label: "۱۴ روز" },
  { k: "30", label: "۳۰ روز" },
  { k: "90", label: "۹۰ روز" },
  { k: "all", label: "همه" },
];

export default async function ChartsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "30" } = await searchParams;
  const { settings: s, days, today } = await getAll();
  const upToToday = days.filter((d) => d.date <= today);
  const n = range === "all" ? upToToday.length : Number(range) || 30;
  const win = upToToday.slice(-n);

  const daily = win.map((d) => ({
    day: jAxis(d.date),
    intake: d.intake || null,
    goal: d.goal,
    burned: d.burned,
    balance: d.balance,
    protein: d.intake ? d.protein : null,
    exercise: d.exercise || null,
    weight: d.weight,
    target: s.targetWeight,
  }));
  const meals = [
    { name: "صبحانه", value: win.reduce((a, d) => a + d.breakfast, 0) },
    { name: "ناهار", value: win.reduce((a, d) => a + d.lunch, 0) },
    { name: "شام", value: win.reduce((a, d) => a + d.dinner, 0) },
    { name: "میان‌وعده‌ها", value: win.reduce((a, d) => a + d.snacks, 0) },
  ];
  const weeks = weekly(upToToday, s).map((w) => ({
    label: w.label,
    balance: w.loggedDays ? w.balance : null,
    avgWeight: w.avgWeight,
    avgIntake: w.avgIntake,
    exercise: w.exercise || null,
    target: s.targetWeight,
    weight: w.avgWeight,
  }));
  const months = monthly(upToToday, s).map((m) => ({
    label: m.label,
    balance: m.loggedDays ? m.balance : null,
    avgIntake: m.avgIntake,
    exercise: m.exercise || null,
    weight: m.avgWeight,
    target: s.targetWeight,
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="نمودارها" subtitle="همه نمودارها خودکار از ثبت‌های روزانه ساخته می‌شوند.">
        <div className="flex rounded-xl border border-line bg-surface p-1 shadow-card">
          {RANGES.map((r) => (
            <Link
              key={r.k}
              href={`/charts?range=${r.k}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${range === r.k ? "bg-brand text-brand-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <Section title="روزانه">
        <Card title="کالری دریافتی، هدف و کل سوزانده" className="lg:col-span-2">
          <ComboChart
            data={daily}
            x="day"
            unit="کیلوکالری"
            height={320}
            bars={[{ key: "intake", name: "دریافتی", color: "intake" }]}
            lines={[
              { key: "goal", name: "هدف", color: "goal", dashed: true },
              { key: "burned", name: "کل سوزانده", color: "burned", dots: n <= 30 },
            ]}
          />
        </Card>
        <Card title="تراز کالری روزانه" subtitle="سبز = کسری (خوب) · قرمز = مازاد">
          <BalanceChart data={daily} x="day" k="balance" />
        </Card>
        <Card title="پروتئین روزانه" subtitle="گرم">
          <ComboChart data={daily} x="day" unit="گرم" bars={[{ key: "protein", name: "پروتئین", color: "protein" }]} height={260} digits={0} />
        </Card>
        <Card title="کالری سوزانده با ورزش">
          <ComboChart data={daily} x="day" unit="کیلوکالری" bars={[{ key: "exercise", name: "ورزش", color: "exercise" }]} height={260} />
        </Card>
        <Card title="سهم وعده‌ها از کالری" subtitle={`در ${RANGES.find((r) => r.k === range)?.label ?? ""} اخیر`}>
          <MealDonut data={meals} height={230} />
        </Card>
      </Section>

      <Section title="وزن">
        <Card title="روند وزن روزانه و وزن هدف" subtitle="خط‌چین نارنجی: وزن هدف" className="lg:col-span-2">
          <WeightChart data={daily} x="day" target={s.targetWeight} height={340} />
        </Card>
      </Section>

      <Section title="هفتگی" note="هر هفته ۷ روز از تاریخ شروع رژیم است.">
        <Card title="تراز کالری هفتگی" subtitle="سبز = کسری (خوب) · قرمز = مازاد">
          <BalanceChart data={weeks} x="label" k="balance" />
        </Card>
        <Card title="میانگین وزن هفتگی">
          <WeightChart data={weeks} x="label" target={s.targetWeight} height={260} />
        </Card>
        <Card title="میانگین کالری دریافتی روزانه">
          <ComboChart data={weeks} x="label" unit="کیلوکالری" bars={[{ key: "avgIntake", name: "میانگین دریافتی", color: "intake" }]} height={260} />
        </Card>
        <Card title="کالری سوزانده با ورزش">
          <ComboChart data={weeks} x="label" unit="کیلوکالری" bars={[{ key: "exercise", name: "ورزش", color: "exercise" }]} height={260} />
        </Card>
      </Section>

      <Section title="ماهانه" note="بر اساس ماه‌های تقویم شمسی.">
        <Card title="تراز کالری ماهانه" subtitle="سبز = کسری (خوب) · قرمز = مازاد">
          <BalanceChart data={months} x="label" k="balance" />
        </Card>
        <Card title="میانگین وزن ماهانه">
          <WeightChart data={months} x="label" target={s.targetWeight} height={260} />
        </Card>
        <Card title="میانگین کالری دریافتی روزانه">
          <ComboChart data={months} x="label" unit="کیلوکالری" bars={[{ key: "avgIntake", name: "میانگین دریافتی", color: "intake" }]} height={260} />
        </Card>
        <Card title="کالری سوزانده با ورزش">
          <ComboChart data={months} x="label" unit="کیلوکالری" bars={[{ key: "exercise", name: "ورزش", color: "exercise" }]} height={260} />
        </Card>
      </Section>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
    </section>
  );
}
