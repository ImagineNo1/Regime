import { addDays, todayIso } from "./jalali";
import type { Plan } from "./types";

/** مقادیر پیش‌فرض فرم برنامه جدید */
export function defaultPlan(latestWeight: number | null, gender: string): Plan {
  const sw = latestWeight ?? 75;
  const today = todayIso();
  return {
    id: "",
    name: "",
    goal: "lose",
    startDate: today,
    endDate: addDays(today, 83),
    startWeight: sw,
    targetWeight: Math.round(sw - 5),
    dailyDelta: 550,
    activityFactor: 1.2,
    minCal: gender === "زن" ? 1200 : 1500,
  };
}
