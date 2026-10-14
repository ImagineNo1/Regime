// همان فرمول‌های فایل اکسل، به صورت توابع خالص
import { addDays, diffDays, toJalali, jMonthLabel } from "./jalali";
import type { ActivityLog, FoodLog, Settings, WeightLog } from "./types";
import type { Unit } from "./seed";

export const KCAL_PER_KG = 7700; // حدود ۷۷۰۰ کیلوکالری ≈ یک کیلوگرم چربی

export function foodValues(unit: Unit, qty: number, kcalPer: number, proteinPer: number) {
  const factor = unit === "گرم" ? qty / 100 : qty;
  return { kcal: Math.round(factor * kcalPer), protein: Math.round(factor * proteinPer * 10) / 10 };
}

/** Mifflin-St Jeor */
export function bmr(s: Settings, weight: number) {
  return Math.round(10 * weight + 6.25 * s.height - 5 * s.age + (s.gender === "مرد" ? 5 : -161));
}

export function tdee(s: Settings, weight: number) {
  return Math.round(bmr(s, weight) * s.activityFactor);
}

export function calorieGoal(s: Settings, weight: number) {
  return Math.max(s.minCal, tdee(s, weight) - s.deficit);
}

/** (MET − ۱) × وزن × ساعت؛ «منهای ۱» چون کالری حالت استراحت در TDEE حساب شده */
export function activityKcal(met: number, weight: number, minutes: number) {
  return Math.max(0, Math.round(((met - 1) * weight * minutes) / 60));
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "کم‌وزن";
  if (bmi < 25) return "محدوده نرمال";
  if (bmi < 30) return "اضافه‌وزن";
  return "چاقی";
}

export type DayStatus = "none" | "low" | "deficit" | "surplus";

export interface DayRow {
  index: number; // روز چندم رژیم (از ۱)
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  intake: number;
  protein: number;
  weight: number | null; // وزن ثبت‌شده همان روز
  refWeight: number; // آخرین وزن تا این روز
  bmr: number;
  tdee: number;
  exercise: number;
  burned: number;
  goal: number;
  balance: number | null; // دریافتی − سوزانده (فقط روزهای ثبت‌شده)
  status: DayStatus;
  cumBalance: number | null;
}

export function exerciseFor(logs: ActivityLog[], weight: number) {
  return logs.reduce(
    (sum, a) => sum + (a.kcalManual ?? (a.met ? activityKcal(a.met, weight, a.minutes) : 0)),
    0,
  );
}

export function buildDays(
  s: Settings,
  foods: FoodLog[],
  acts: ActivityLog[],
  weights: WeightLog[],
  today: string,
): DayRow[] {
  const byDate = <T extends { date: string }>(arr: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of arr) {
      const l = m.get(x.date);
      if (l) l.push(x);
      else m.set(x.date, [x]);
    }
    return m;
  };
  const foodMap = byDate(foods);
  const actMap = byDate(acts);
  const wMap = new Map(weights.map((w) => [w.date, w.kg]));

  let end = today;
  for (const d of [...foodMap.keys(), ...actMap.keys(), ...wMap.keys()]) if (d > end) end = d;
  const n = diffDays(end, s.startDate) + 1;
  if (n <= 0) return [];

  // وزن مرجع روز اول: آخرین وزنی که قبل یا همان روز شروع ثبت شده، وگرنه وزن شروع
  let ref = s.startWeight;
  for (const w of [...weights].sort((a, b) => a.date.localeCompare(b.date))) {
    if (w.date <= s.startDate) ref = w.kg;
  }

  const rows: DayRow[] = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const date = addDays(s.startDate, i);
    const fl = foodMap.get(date) ?? [];
    const al = actMap.get(date) ?? [];
    const w = wMap.get(date) ?? null;
    if (w !== null) ref = w;

    let breakfast = 0, lunch = 0, dinner = 0, snacks = 0, protein = 0;
    for (const f of fl) {
      if (f.meal === "صبحانه") breakfast += f.kcal;
      else if (f.meal === "ناهار") lunch += f.kcal;
      else if (f.meal === "شام") dinner += f.kcal;
      else snacks += f.kcal;
      protein += f.protein;
    }
    const intake = breakfast + lunch + dinner + snacks;
    const b = bmr(s, ref);
    const t = Math.round(b * s.activityFactor);
    const exercise = exerciseFor(al, ref);
    const burned = t + exercise;
    const goal = Math.max(s.minCal, t - s.deficit);
    const balance = intake > 0 ? intake - burned : null;
    if (balance !== null) cum += balance;
    const status: DayStatus =
      intake === 0 ? "none" : intake < s.minCal ? "low" : balance! < 0 ? "deficit" : "surplus";

    rows.push({
      index: i + 1,
      date,
      breakfast,
      lunch,
      dinner,
      snacks,
      intake,
      protein: Math.round(protein * 10) / 10,
      weight: w,
      refWeight: ref,
      bmr: b,
      tdee: t,
      exercise,
      burned,
      goal,
      balance,
      status,
      cumBalance: balance !== null ? cum : null,
    });
  }
  return rows;
}

export interface PeriodRow {
  key: string;
  label: string;
  from: string;
  to: string;
  loggedDays: number;
  intake: number;
  avgIntake: number | null;
  avgProtein: number | null;
  exercise: number;
  balance: number;
  estLoss: number; // کیلوگرم، مثبت یعنی کاهش
  avgWeight: number | null;
  weightChange: number | null; // نسبت به دوره قبل (یا وزن شروع)
}

function summarize(key: string, label: string, rows: DayRow[]): Omit<PeriodRow, "weightChange"> {
  const logged = rows.filter((r) => r.intake > 0);
  const ws = rows.filter((r) => r.weight !== null).map((r) => r.weight!);
  const intake = logged.reduce((s, r) => s + r.intake, 0);
  const balance = logged.reduce((s, r) => s + (r.balance ?? 0), 0);
  return {
    key,
    label,
    from: rows[0].date,
    to: rows[rows.length - 1].date,
    loggedDays: logged.length,
    intake,
    avgIntake: logged.length ? Math.round(intake / logged.length) : null,
    avgProtein: logged.length
      ? Math.round((logged.reduce((s, r) => s + r.protein, 0) / logged.length) * 10) / 10
      : null,
    exercise: rows.reduce((s, r) => s + r.exercise, 0),
    balance,
    estLoss: -balance / KCAL_PER_KG,
    avgWeight: ws.length ? Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10 : null,
  };
}

function withChange(list: Omit<PeriodRow, "weightChange">[], startWeight: number): PeriodRow[] {
  let prev: number | null = startWeight;
  return list.map((p) => {
    const change = p.avgWeight !== null && prev !== null ? Math.round((p.avgWeight - prev) * 10) / 10 : null;
    if (p.avgWeight !== null) prev = p.avgWeight;
    return { ...p, weightChange: change };
  });
}

/** هفته‌ها: هر ۷ روز از تاریخ شروع رژیم */
export function weekly(days: DayRow[], s: Settings): PeriodRow[] {
  const out: Omit<PeriodRow, "weightChange">[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    out.push(summarize(`w${i / 7 + 1}`, `هفته ${(i / 7 + 1).toLocaleString("fa-IR")}`, chunk));
  }
  return withChange(out, s.startWeight);
}

/** ماه‌ها: ماه‌های تقویم شمسی */
export function monthly(days: DayRow[], s: Settings): PeriodRow[] {
  const groups = new Map<string, { jy: number; jm: number; rows: DayRow[] }>();
  for (const d of days) {
    const [jy, jm] = toJalali(d.date);
    const k = `${jy}-${jm}`;
    const g = groups.get(k);
    if (g) g.rows.push(d);
    else groups.set(k, { jy, jm, rows: [d] });
  }
  const out = [...groups.entries()].map(([k, g]) => summarize(k, jMonthLabel(g.jy, g.jm), g.rows));
  return withChange(out, s.startWeight);
}
