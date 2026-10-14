// همان فرمول‌های فایل اکسل، به صورت توابع خالص — حالا برای هر برنامه (کاهش / افزایش / حفظ وزن)
import { addDays, diffDays, toJalali, jMonthLabel } from "./jalali";
import type { ActivityLog, FoodLog, Goal, Plan, Profile, WeightLog } from "./types";
import type { Unit } from "./seed";

export const KCAL_PER_KG = 7700; // حدود ۷۷۰۰ کیلوکالری ≈ یک کیلوگرم وزن بدن
/** در برنامه «حفظ وزن»، تراز روزانه تا این مقدار (مثبت یا منفی) «متعادل» حساب می‌شود */
export const MAINTAIN_BAND = 200;

/** وقتی روزی داخل هیچ برنامه‌ای نیست، با این تنظیمات (حفظ وزن) حساب می‌شود */
export function fallbackPlan(startWeight: number, date: string): Plan {
  return {
    id: "",
    name: "",
    goal: "maintain",
    startDate: date,
    endDate: date,
    startWeight,
    targetWeight: startWeight,
    dailyDelta: 0,
    activityFactor: 1.2,
    minCal: 1200,
  };
}

export function foodValues(unit: Unit, qty: number, kcalPer: number, proteinPer: number) {
  const factor = unit === "گرم" ? qty / 100 : qty;
  return { kcal: Math.round(factor * kcalPer), protein: Math.round(factor * proteinPer * 10) / 10 };
}

/** Mifflin-St Jeor */
export function bmr(p: Profile, weight: number) {
  return Math.round(10 * weight + 6.25 * p.height - 5 * p.age + (p.gender === "مرد" ? 5 : -161));
}

export function tdee(p: Profile, factor: number, weight: number) {
  return Math.round(bmr(p, weight) * factor);
}

export function calorieGoal(p: Profile, plan: Plan, weight: number) {
  const t = tdee(p, plan.activityFactor, weight);
  if (plan.goal === "lose") return Math.max(plan.minCal, t - plan.dailyDelta);
  if (plan.goal === "gain") return t + plan.dailyDelta;
  return Math.max(plan.minCal, t);
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

/** آیا این تراز کالری با هدف برنامه هم‌جهت است؟ */
export function balanceIsGood(goal: Goal, balance: number, days = 1) {
  if (goal === "lose") return balance < 0;
  if (goal === "gain") return balance > 0;
  return Math.abs(balance / Math.max(1, days)) <= MAINTAIN_BAND;
}

export type DayStatus = "none" | "low" | "good" | "bad";

export const STATUS_LABEL: Record<Goal, Record<"good" | "bad", string>> = {
  lose: { good: "✓ کسری کالری", bad: "✗ مازاد کالری" },
  gain: { good: "✓ مازاد کالری", bad: "✗ کسری کالری" },
  maintain: { good: "✓ متعادل", bad: "✗ خارج از محدوده" },
};

export interface DayRow {
  index: number; // روز چندم برنامه (از ۱)
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  intake: number;
  protein: number;
  weight: number | null;
  refWeight: number;
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

/** آخرین روزی که جدول برنامه باید نشان دهد */
export function planLastDay(plan: Plan, today: string, logDates: string[]) {
  let last = plan.endDate && plan.endDate < today ? plan.endDate : today;
  for (const d of logDates) if (d > last && d >= plan.startDate && (!plan.endDate || d <= plan.endDate)) last = d;
  return last;
}

export function buildDays(
  profile: Profile,
  plan: Plan,
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

  const end = planLastDay(plan, today, [...foodMap.keys(), ...actMap.keys(), ...wMap.keys()]);
  const n = diffDays(end, plan.startDate) + 1;
  if (n <= 0) return [];

  // وزن مرجع: وزن شروع برنامه، تا وقتی وزن جدیدی داخل برنامه ثبت شود
  let ref = plan.startWeight;

  const rows: DayRow[] = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const date = addDays(plan.startDate, i);
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
    const b = bmr(profile, ref);
    const t = Math.round(b * plan.activityFactor);
    const exercise = exerciseFor(al, ref);
    const burned = t + exercise;
    const goal = calorieGoal(profile, plan, ref);
    const balance = intake > 0 ? intake - burned : null;
    if (balance !== null) cum += balance;
    const status: DayStatus =
      intake === 0
        ? "none"
        : intake < plan.minCal
          ? "low"
          : balanceIsGood(plan.goal, balance!)
            ? "good"
            : "bad";

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

/* ---------------- پیشرفت برنامه ---------------- */

export interface Progress {
  direction: -1 | 0 | 1; // کاهش، حفظ، افزایش
  change: number; // تغییر وزن از شروع (منفی = کاهش)
  remaining: number; // کیلوگرم باقی‌مانده در جهت هدف (برای حفظ وزن: فاصله از وزن شروع)
  fraction: number; // ۰ تا ۱
  weeksPlan: number | null;
  weeksReal: number | null;
  daysLeft: number | null; // تا پایان دوره
  neededDelta: number | null; // کالری روزانه لازم برای رسیدن به هدف تا پایان دوره
}

export function progress(plan: Plan, curW: number, avgBalance: number | null, today: string): Progress {
  const direction = plan.goal === "lose" ? -1 : plan.goal === "gain" ? 1 : 0;
  const change = Math.round((curW - plan.startWeight) * 10) / 10;
  const daysLeft = plan.endDate ? Math.max(0, diffDays(plan.endDate, today)) : null;
  if (direction === 0) {
    return {
      direction,
      change,
      remaining: Math.abs(change),
      fraction: Math.abs(change) <= 1 ? 1 : 0,
      weeksPlan: null,
      weeksReal: null,
      daysLeft,
      neededDelta: null,
    };
  }
  const total = Math.abs(plan.targetWeight - plan.startWeight);
  const remaining = Math.max(0, (plan.targetWeight - curW) * direction);
  const done = (curW - plan.startWeight) * direction;
  const fraction = total ? Math.max(0, Math.min(1, done / total)) : 1;
  const weeksPlan = plan.dailyDelta > 0 ? (remaining * KCAL_PER_KG) / (plan.dailyDelta * 7) : null;
  const realRate = avgBalance === null ? 0 : avgBalance * direction; // کالری روزانه در جهت هدف
  const weeksReal = realRate > 0 ? (remaining * KCAL_PER_KG) / (realRate * 7) : null;
  const neededDelta = daysLeft && remaining > 0 ? Math.round((remaining * KCAL_PER_KG) / daysLeft) : null;
  return { direction, change, remaining, fraction, weeksPlan, weeksReal, daysLeft, neededDelta };
}

/* ---------------- هفتگی / ماهانه ---------------- */

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
  estChange: number; // کیلوگرم، از روی کالری (منفی = کاهش)
  avgWeight: number | null;
  weightChange: number | null; // نسبت به دوره قبل (یا وزن شروع)
  good: boolean | null;
}

function summarize(goal: Goal, key: string, label: string, rows: DayRow[]): Omit<PeriodRow, "weightChange"> {
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
    estChange: balance / KCAL_PER_KG,
    avgWeight: ws.length ? Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10 : null,
    good: logged.length ? balanceIsGood(goal, balance, logged.length) : null,
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

/** هفته‌ها: هر ۷ روز از تاریخ شروع برنامه */
export function weekly(days: DayRow[], plan: Plan): PeriodRow[] {
  const out: Omit<PeriodRow, "weightChange">[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    out.push(summarize(plan.goal, `w${i / 7 + 1}`, `هفته ${(i / 7 + 1).toLocaleString("fa-IR")}`, chunk));
  }
  return withChange(out, plan.startWeight);
}

/** ماه‌ها: ماه‌های تقویم شمسی */
export function monthly(days: DayRow[], plan: Plan): PeriodRow[] {
  const groups = new Map<string, { jy: number; jm: number; rows: DayRow[] }>();
  for (const d of days) {
    const [jy, jm] = toJalali(d.date);
    const k = `${jy}-${jm}`;
    const g = groups.get(k);
    if (g) g.rows.push(d);
    else groups.set(k, { jy, jm, rows: [d] });
  }
  const out = [...groups.entries()].map(([k, g]) => summarize(plan.goal, k, jMonthLabel(g.jy, g.jm), g.rows));
  return withChange(out, plan.startWeight);
}
