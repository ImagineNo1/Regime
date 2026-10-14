import type { Unit } from "./seed";

export const MEALS = ["صبحانه", "میان‌وعده صبح", "ناهار", "میان‌وعده عصر", "شام", "میان‌وعده شب"] as const;
export type Meal = (typeof MEALS)[number];

export type Gender = "مرد" | "زن";

export interface Settings {
  gender: Gender;
  age: number;
  height: number; // سانتی‌متر
  startWeight: number; // کیلوگرم
  targetWeight: number;
  startDate: string; // ISO میلادی
  activityFactor: number; // ضریب تحرک بدون ورزش
  deficit: number; // کسری کالری روزانه هدف
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
  kcal: number; // کالری نهایی همین ردیف
  protein: number;
  manual: boolean; // کالری دستی وارد شده
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
