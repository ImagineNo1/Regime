import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Empty, PageHeader } from "@/components/ui";
import { monthly, weekly, type PeriodRow } from "@/lib/calc";
import { getPlanData } from "@/lib/data";
import { NoPlan } from "@/components/NoPlan";
import { n0, n1, signed } from "@/lib/format";
import { jNumeric, jShort, weekday } from "@/lib/jalali";

export default async function ReportsPage() {
  const { plan: s, days, today } = await getPlanData();
  if (!s) return <NoPlan title="گزارش‌ها" />;
  const upToToday = days.filter((d) => d.date <= today);
  const weeks = weekly(upToToday, s);
  const months = monthly(upToToday, s);

  return (
    <div className="space-y-6">
      <PageHeader title="گزارش‌ها" subtitle={`برنامه «${s.name}» — جمع‌بندی هفتگی، ماهانه و جزئیات همه روزها.`} />

      <Card title="هفتگی" subtitle="هر هفته ۷ روز از تاریخ شروع برنامه" pad={false}>
        <PeriodTable rows={[...weeks].reverse()} showRange />
      </Card>

      <Card title="ماهانه" subtitle="ماه‌های تقویم شمسی" pad={false}>
        <PeriodTable rows={[...months].reverse()} />
      </Card>

      <Card title="همه روزها" subtitle="جدیدترین بالا" pad={false}>
        {upToToday.length === 0 ? (
          <div className="p-5"><Empty>این برنامه هنوز شروع نشده است.</Empty></div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>تاریخ</th>
                  <th>صبحانه</th>
                  <th>ناهار</th>
                  <th>شام</th>
                  <th>میان‌وعده‌ها</th>
                  <th>جمع دریافتی</th>
                  <th>پروتئین (گرم)</th>
                  <th>وزن صبح</th>
                  <th>BMR</th>
                  <th>TDEE</th>
                  <th>ورزش</th>
                  <th>کل سوزانده</th>
                  <th>هدف</th>
                  <th>تراز</th>
                  <th>وضعیت</th>
                  <th>تراز تجمعی</th>
                  <th>تغییر وزن تخمینی</th>
                </tr>
              </thead>
              <tbody>
                {[...upToToday].reverse().map((d) => (
                  <tr key={d.date} className={d.date === today ? "bg-brand-soft/50" : ""}>
                    <td className="tnum text-muted">{n0(d.index)}</td>
                    <td>
                      <Link href={`/day?d=${d.date}`} className="font-medium hover:text-brand">
                        {jNumeric(d.date)}
                      </Link>
                      <span className="ms-2 text-xs text-muted">{weekday(d.date)}</span>
                    </td>
                    <Num v={d.breakfast} />
                    <Num v={d.lunch} />
                    <Num v={d.dinner} />
                    <Num v={d.snacks} />
                    <td className="tnum font-bold">{d.intake ? n0(d.intake) : "—"}</td>
                    <td className="tnum">{d.intake ? n1(d.protein) : "—"}</td>
                    <td className="tnum">{d.weight ? n1(d.weight) : "—"}</td>
                    <td className="tnum text-ink-2">{n0(d.bmr)}</td>
                    <td className="tnum text-ink-2">{n0(d.tdee)}</td>
                    <Num v={d.exercise} />
                    <td className="tnum">{n0(d.burned)}</td>
                    <td className="tnum text-ink-2">{n0(d.goal)}</td>
                    <td className={`tnum font-semibold ${d.status === "good" ? "text-good" : d.status === "bad" ? "text-bad" : ""}`}>{signed(d.balance)}</td>
                    <td><StatusBadge status={d.status} goal={s.goal} /></td>
                    <td className="tnum">{signed(d.cumBalance)}</td>
                    <td className="tnum">{d.cumBalance === null ? "—" : `${signed(d.cumBalance / 7700, 1)} کیلو`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Num({ v }: { v: number }) {
  return <td className="tnum">{v ? n0(v) : "—"}</td>;
}

function PeriodTable({ rows, showRange = false }: { rows: PeriodRow[]; showRange?: boolean }) {
  if (!rows.length) return <div className="p-5"><Empty>هنوز داده‌ای نیست.</Empty></div>;
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>دوره</th>
            {showRange && <th>بازه</th>}
            <th>روزهای ثبت‌شده</th>
            <th>میانگین دریافتی روزانه</th>
            <th>میانگین پروتئین</th>
            <th>جمع ورزش</th>
            <th>جمع تراز کالری</th>
            <th>تغییر وزن تخمینی</th>
            <th>میانگین وزن</th>
            <th>تغییر وزن واقعی</th>
            <th>ارزیابی</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="font-bold">{r.label}</td>
              {showRange && (
                <td className="text-xs text-ink-2">
                  {jShort(r.from)} تا {jShort(r.to)}
                </td>
              )}
              <td className="tnum">{n0(r.loggedDays)}</td>
              <td className="tnum">{r.avgIntake === null ? "—" : n0(r.avgIntake)}</td>
              <td className="tnum">{r.avgProtein === null ? "—" : `${n1(r.avgProtein)} گرم`}</td>
              <td className="tnum">{r.exercise ? n0(r.exercise) : "—"}</td>
              <td className={`tnum font-semibold ${r.good === null ? "" : r.good ? "text-good" : "text-bad"}`}>
                {r.loggedDays ? signed(r.balance) : "—"}
              </td>
              <td className="tnum">{r.loggedDays ? `${signed(r.estChange, 1)} کیلو` : "—"}</td>
              <td className="tnum">{r.avgWeight === null ? "—" : n1(r.avgWeight)}</td>
              <td className="tnum">
                {r.weightChange === null ? "—" : signed(r.weightChange, 1)}
              </td>
              <td>
                {r.good === null ? (
                  <span className="text-muted">—</span>
                ) : r.good ? (
                  <span className="font-semibold text-good">✓ موفق</span>
                ) : (
                  <span className="font-semibold text-bad">✗ تلاش بیشتر</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
