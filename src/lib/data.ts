import "server-only";
import { getDb, DEFAULT_SETTINGS } from "./db";
import { todayIso } from "./jalali";
import { buildDays } from "./calc";
import type { Activity, ActivityLog, Food, FoodLog, Settings, WeightLog } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const withId = <T,>(d: any): T => {
  const { _id, ...rest } = d;
  return { id: String(_id), ...rest } as T;
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const doc = await db.collection<{ _id: string } & Settings>("settings").findOne({ _id: "profile" });
  if (!doc) return DEFAULT_SETTINGS;
  const { _id, ...s } = doc;
  void _id;
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function getFoods(): Promise<Food[]> {
  const db = await getDb();
  const docs = await db.collection("foods").find().toArray();
  return docs.map((d) => withId<Food>(d));
}

export async function getActivities(): Promise<Activity[]> {
  const db = await getDb();
  const docs = await db.collection("activities").find().toArray();
  return docs.map((d) => withId<Activity>(d));
}

export async function getFoodLogs(date?: string): Promise<FoodLog[]> {
  const db = await getDb();
  const docs = await db
    .collection("foodLogs")
    .find(date ? { date } : {})
    .sort({ date: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => {
    const { createdAt, ...rest } = d;
    void createdAt;
    return withId<FoodLog>(rest);
  });
}

export async function getActivityLogs(date?: string): Promise<ActivityLog[]> {
  const db = await getDb();
  const docs = await db
    .collection("activityLogs")
    .find(date ? { date } : {})
    .sort({ date: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => {
    const { createdAt, ...rest } = d;
    void createdAt;
    return withId<ActivityLog>(rest);
  });
}

export async function getWeights(): Promise<WeightLog[]> {
  const db = await getDb();
  const docs = await db.collection<{ _id: string; kg: number }>("weights").find().sort({ _id: 1 }).toArray();
  return docs.map((d) => ({ date: d._id, kg: d.kg }));
}

/** همه چیز برای داشبورد/گزارش‌ها */
export async function getAll() {
  const [settings, foodLogs, actLogs, weights] = await Promise.all([
    getSettings(),
    getFoodLogs(),
    getActivityLogs(),
    getWeights(),
  ]);
  const today = todayIso();
  const days = buildDays(settings, foodLogs, actLogs, weights, today);
  return { settings, days, weights, today };
}
