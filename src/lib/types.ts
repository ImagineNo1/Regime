import type { Unit } from "./seed";

export const MEALS = ["صبحانه", "میان‌وعده صبح", "ناهار", "میان‌وعده عصر", "شام", "میان‌وعده شب"] as const;
export type Meal = (typeof MEALS)[number];

export type Gender = "مرد" | "زن";

/** مشخصات ثابت هر کاربر (برای فرمول سوخت‌وساز پایه) */
export interface Profile {
  name: string;
  gender: Gender;
  age: number;
  height: number; // سانتی‌متر
}

export interface User extends Profile {
  id: string;
  username: string;
  activePlanId: string | null;
}

export type Goal = "lose" | "gain" | "maintain";

export const GOALS: Record<Goal, { label: string; short: string }> = {
  lose: { label: "کاهش وزن", short: "کاهش" },
  gain: { label: "افزایش وزن", short: "افزایش" },
  maintain: { label: "حفظ وزن", short: "حفظ" },
};

/** یک دوره/برنامه رژیم */
export interface Plan {
  id: string;
  name: string;
  goal: Goal;
  startDate: string; // ISO میلادی
  endDate: string | null; // بدون پایان = null
  startWeight: number;
  targetWeight: number;
  dailyDelta: number; // کسری (کاهش) یا مازاد (افزایش) کالری روزانه؛ برای حفظ وزن ۰
  activityFactor: number; // ضریب تحرک بدون ورزش
  minCal: number; // حداقل کالری ایمن
}

export interface Food {
  id: string;
  name: string;
  unit: Unit;
  kcal: number; // برای «گرم»: در ۱۰۰ گرم؛ بقیه: هر واحد
  protein: number;
}

export interface Activity {
  id: string;
  name: string;
  met: number;
}

export interface FoodLog {
  id: string;
  date: string;
  meal: Meal;
  name: string;
  unit: Unit | "";
  qty: number | null;
  kcal: number;
  protein: number;
  manual: boolean;
  note?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  name: string;
  met: number | null;
  minutes: number;
  kcalManual: number | null;
  note?: string;
}

export interface WeightLog {
  date: string;
  kg: number;
}
