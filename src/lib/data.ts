import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import { getDb, oid, type PlanDoc, type UserDoc } from "./db";
import { readSession, SESSION_COOKIE } from "./auth";
import { todayIso } from "./jalali";
import { buildDays } from "./calc";
import type { Activity, ActivityLog, Food, FoodLog, Plan, User, WeightLog } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const withId = <T,>(d: any): T => {
  const { _id, userId, createdAt, ...rest } = d;
  void userId;
  void createdAt;
  return { id: String(_id), ...rest } as T;
};

/** کاربر واردشده (یا null). در هر درخواست فقط یک بار از دیتابیس خوانده می‌شود. */
export const getSessionUser = cache(async (): Promise<(UserDoc & { user: User }) | null> => {
  const jar = await cookies();
  const s = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const db = await getDb();
  const u = await db.collection<UserDoc>("users").findOne({ _id: oid(s.userId)! });
  if (!u || (u.sv ?? 0) !== s.sv) return null;
  return {
    ...u,
    user: {
      id: String(u._id),
      username: u.username,
      name: u.name,
      gender: u.gender,
      age: u.age,
      height: u.height,
      activePlanId: u.activePlanId ? String(u.activePlanId) : null,
    },
  };
});

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) redirect("/auth/clear");
  return u;
}

const toPlan = (d: PlanDoc): Plan => withId<Plan>(d);

export async function getPlans(userId: ObjectId): Promise<Plan[]> {
  const db = await getDb();
  const docs = await db.collection<PlanDoc>("plans").find({ userId }).sort({ startDate: -1 }).toArray();
  return docs.map(toPlan);
}

/** برنامه فعال: انتخاب کاربر؛ وگرنه برنامه‌ای که امروز را شامل می‌شود؛ وگرنه جدیدترین */
export function pickActivePlan(plans: Plan[], activeId: string | null, today = todayIso()): Plan | null {
  return (
    plans.find((p) => p.id === activeId) ??
    plans.find((p) => p.startDate <= today && (!p.endDate || p.endDate >= today)) ??
    plans[0] ??
    null
  );
}

/** برنامه‌ای که یک روز مشخص داخلش است (اولویت با برنامه فعال) */
export function planForDate(plans: Plan[], active: Plan | null, date: string): Plan | null {
  const inside = (p: Plan) => p.startDate <= date && (!p.endDate || p.endDate >= date);
  if (active && inside(active)) return active;
  return plans.find(inside) ?? null;
}

export async function getFoods(userId: ObjectId): Promise<Food[]> {
  const db = await getDb();
  return (await db.collection("foods").find({ userId }).toArray()).map((d) => withId<Food>(d));
}

export async function getActivities(userId: ObjectId): Promise<Activity[]> {
  const db = await getDb();
  return (await db.collection("activities").find({ userId }).toArray()).map((d) => withId<Activity>(d));
}

type Range = { from?: string; to?: string | null };
function dateFilter(userId: ObjectId, r: Range | string = {}) {
  if (typeof r === "string") return { userId, date: r };
  const date: Record<string, string> = {};
  if (r.from) date.$gte = r.from;
  if (r.to) date.$lte = r.to;
  return Object.keys(date).length ? { userId, date } : { userId };
}

export async function getFoodLogs(userId: ObjectId, r: Range | string = {}): Promise<FoodLog[]> {
  const db = await getDb();
  const docs = await db.collection("foodLogs").find(dateFilter(userId, r)).sort({ date: 1, createdAt: 1 }).toArray();
  return docs.map((d) => withId<FoodLog>(d));
}

export async function getActivityLogs(userId: ObjectId, r: Range | string = {}): Promise<ActivityLog[]> {
  const db = await getDb();
  const docs = await db.collection("activityLogs").find(dateFilter(userId, r)).sort({ date: 1, createdAt: 1 }).toArray();
  return docs.map((d) => withId<ActivityLog>(d));
}

export async function getWeights(userId: ObjectId, r: Range = {}): Promise<WeightLog[]> {
  const db = await getDb();
  const docs = await db
    .collection<{ date: string; kg: number }>("weightLogs")
    .find(dateFilter(userId, r))
    .sort({ date: 1 })
    .toArray();
  return docs.map((d) => ({ date: d.date, kg: d.kg }));
}

/** همه چیز برای داشبورد/نمودار/گزارش برنامه فعال */
export async function getPlanData() {
  const u = await requireUser();
  const today = todayIso();
  const plans = await getPlans(u._id);
  const plan = pickActivePlan(plans, u.user.activePlanId, today);
  if (!plan) return { user: u.user, plans, plan: null, days: [], weights: [] as WeightLog[], allWeights: [] as WeightLog[], today };
  const range = { from: plan.startDate, to: plan.endDate };
  const [foodLogs, actLogs, allWeights] = await Promise.all([
    getFoodLogs(u._id, range),
    getActivityLogs(u._id, range),
    getWeights(u._id),
  ]);
  const weights = allWeights.filter((w) => w.date >= plan.startDate && (!plan.endDate || w.date <= plan.endDate));
  const days = buildDays(u.user, plan, foodLogs, actLogs, weights, today);
  return { user: u.user, plans, plan, days, weights, allWeights, today };
}
