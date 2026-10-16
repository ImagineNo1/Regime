"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ObjectId } from "mongodb";
import { getDb, oid, seedBanks, type PlanDoc, type UserDoc } from "@/lib/db";
import { createSession, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireUser } from "@/lib/data";
import { foodValues } from "@/lib/calc";
import { parseNum } from "@/lib/format";
import { isValidIso, jalaliTextToIso, todayIso } from "@/lib/jalali";
import { getWorkoutDay, weekStart, workoutMinutes } from "@/lib/workout";
import { UNITS, type Unit } from "@/lib/seed";
import { MEALS, type Goal, type Meal } from "@/lib/types";

export type FormState =
  | { error?: string; ok?: boolean; at?: number; values?: Record<string, string>; id?: string }
  | undefined;

const ok = (extra: Partial<NonNullable<FormState>> = {}): FormState => ({ ok: true, at: Date.now(), ...extra });
const fail = (error: string, values?: Record<string, string>): FormState => ({ error, at: Date.now(), values });

function refresh() {
  revalidatePath("/", "layout");
}

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

async function startSession(user: Pick<UserDoc, "_id" | "sv">) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSession(String(user._id), user.sv ?? 0), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/* ---------------- حساب کاربری ---------------- */

const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
const slow = () => new Promise((r) => setTimeout(r, 600)); // کند کردن حدس زدن رمز

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ username });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await slow();
    return fail("نام کاربری یا رمز عبور اشتباه است.", { username });
  }
  await startSession(user);
  redirect("/");
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  if (process.env.ALLOW_SIGNUP === "false") return fail("ثبت‌نام در این سایت بسته است.");
  const values = {
    name: str(fd, "name"),
    username: str(fd, "username").toLowerCase(),
    gender: str(fd, "gender"),
    age: str(fd, "age"),
    height: str(fd, "height"),
  };
  const password = String(fd.get("password") ?? "");
  const password2 = String(fd.get("password2") ?? "");
  const age = parseNum(values.age);
  const height = parseNum(values.height);
  if (!values.name) return fail("اسم خود را بنویسید.", values);
  if (!USERNAME_RE.test(values.username))
    return fail("نام کاربری باید ۳ تا ۳۲ حرف انگلیسی، عدد یا . _ - باشد.", values);
  if (password.length < 8) return fail("رمز عبور باید حداقل ۸ کاراکتر باشد.", values);
  if (password !== password2) return fail("تکرار رمز عبور یکسان نیست.", values);
  if (values.gender !== "مرد" && values.gender !== "زن") return fail("جنسیت را انتخاب کنید.", values);
  if (!age || age < 10 || age > 100) return fail("سن را درست وارد کنید.", values);
  if (!height || height < 100 || height > 250) return fail("قد را به سانتی‌متر وارد کنید.", values);

  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  const doc = {
    username: values.username,
    passwordHash: await hashPassword(password),
    sv: 0,
    name: values.name.slice(0, 60),
    gender: values.gender as UserDoc["gender"],
    age,
    height,
    activePlanId: null,
    createdAt: new Date(),
  };
  let id: ObjectId;
  try {
    id = (await users.insertOne(doc as UserDoc)).insertedId;
  } catch {
    return fail("این نام کاربری قبلاً گرفته شده است.", values);
  }
  await seedBanks(db, id);
  await startSession({ _id: id, sv: 0 });
  redirect("/plans/new?welcome=1");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function saveProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = str(fd, "name").slice(0, 60);
  const gender = str(fd, "gender");
  const age = parseNum(fd.get("age"));
  const height = parseNum(fd.get("height"));
  if (!name) return fail("اسم را بنویسید.");
  if (gender !== "مرد" && gender !== "زن") return fail("جنسیت را انتخاب کنید.");
  if (!age || age < 10 || age > 100) return fail("سن را درست وارد کنید.");
  if (!height || height < 100 || height > 250) return fail("قد را به سانتی‌متر وارد کنید.");
  const db = await getDb();
  await db.collection<UserDoc>("users").updateOne({ _id: u._id }, { $set: { name, gender, age, height } });
  refresh();
  return ok();
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const next2 = String(fd.get("next2") ?? "");
  if (!(await verifyPassword(current, u.passwordHash))) {
    await slow();
    return fail("رمز فعلی اشتباه است.");
  }
  if (next.length < 8) return fail("رمز جدید باید حداقل ۸ کاراکتر باشد.");
  if (next !== next2) return fail("تکرار رمز جدید یکسان نیست.");
  const db = await getDb();
  const sv = (u.sv ?? 0) + 1; // نشست‌های دستگاه‌های دیگر باطل می‌شود
  await db.collection<UserDoc>("users").updateOne({ _id: u._id }, { $set: { passwordHash: await hashPassword(next), sv } });
  await startSession({ _id: u._id, sv });
  return ok();
}

/* ---------------- برنامه‌ها ---------------- */

const GOAL_SET: Goal[] = ["lose", "gain", "maintain"];

export async function savePlan(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(fd, "id");
  const values = Object.fromEntries(
    ["name", "goal", "startDate", "endDate", "startWeight", "targetWeight", "dailyDelta", "activityFactor", "minCal"].map((k) => [k, str(fd, k)]),
  );
  const goal = values.goal as Goal;
  const name = values.name.slice(0, 60);
  const startDate = jalaliTextToIso(values.startDate);
  const endDate = values.endDate ? jalaliTextToIso(values.endDate) : null;
  const startWeight = parseNum(values.startWeight);
  let targetWeight = parseNum(values.targetWeight);
  let dailyDelta = parseNum(values.dailyDelta) ?? 0;
  const activityFactor = parseNum(values.activityFactor);
  const minCal = parseNum(values.minCal);

  if (!name) return fail("برای برنامه یک اسم بنویسید.", values);
  if (!GOAL_SET.includes(goal)) return fail("هدف برنامه را انتخاب کنید.", values);
  if (!startDate) return fail("تاریخ شروع را شمسی و مثل ۱۴۰۵/۰۷/۲۲ بنویسید.", values);
  if (values.endDate && !endDate) return fail("تاریخ پایان را شمسی و مثل ۱۴۰۵/۱۰/۲۲ بنویسید.", values);
  if (endDate && endDate < startDate) return fail("تاریخ پایان باید بعد از تاریخ شروع باشد.", values);
  if (!startWeight || startWeight < 25 || startWeight > 350) return fail("وزن شروع را درست وارد کنید.", values);
  if (goal === "maintain") {
    targetWeight = startWeight;
    dailyDelta = 0;
  } else {
    if (!targetWeight || targetWeight < 25 || targetWeight > 350) return fail("وزن هدف را درست وارد کنید.", values);
    if (goal === "lose" && targetWeight >= startWeight) return fail("در برنامه کاهش وزن، وزن هدف باید کمتر از وزن شروع باشد.", values);
    if (goal === "gain" && targetWeight <= startWeight) return fail("در برنامه افزایش وزن، وزن هدف باید بیشتر از وزن شروع باشد.", values);
    if (dailyDelta <= 0 || dailyDelta > 1500) return fail("کالری کسری/مازاد روزانه باید بین ۱ و ۱۵۰۰ باشد.", values);
  }
  if (!activityFactor || activityFactor < 1 || activityFactor > 2.5) return fail("ضریب تحرک را انتخاب کنید.", values);
  if (!minCal || minCal < 800 || minCal > 4000) return fail("حداقل کالری ایمن را درست وارد کنید (۸۰۰ تا ۴۰۰۰).", values);

  const db = await getDb();
  const col = db.collection<PlanDoc>("plans");
  const data = { name, goal, startDate, endDate, startWeight, targetWeight: targetWeight!, dailyDelta: Math.round(dailyDelta), activityFactor, minCal };
  let planId = oid(id);
  if (planId) {
    const res = await col.updateOne({ _id: planId, userId: u._id }, { $set: data });
    if (!res.matchedCount) return fail("برنامه پیدا نشد.", values);
  } else {
    planId = (await col.insertOne({ ...data, userId: u._id, createdAt: new Date() } as PlanDoc)).insertedId;
  }
  await db.collection<UserDoc>("users").updateOne({ _id: u._id }, { $set: { activePlanId: planId } });
  refresh();
  return ok({ id: String(planId) });
}

export async function deletePlan(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("plans").deleteOne({ _id, userId: u._id });
  if (u.activePlanId && String(u.activePlanId) === id) {
    await db.collection<UserDoc>("users").updateOne({ _id: u._id }, { $set: { activePlanId: null } });
  }
  refresh();
}

export async function setActivePlan(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  if (!(await db.collection("plans").findOne({ _id, userId: u._id }))) return;
  await db.collection<UserDoc>("users").updateOne({ _id: u._id }, { $set: { activePlanId: _id } });
  refresh();
}

/* ---------------- ثبت غذا ---------------- */

export async function addFoodLog(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const date = str(fd, "date");
  const meal = str(fd, "meal") as Meal;
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  if (!MEALS.includes(meal)) return fail("وعده را انتخاب کنید.");

  const db = await getDb();
  const foodId = oid(str(fd, "foodId"));
  const qty = parseNum(fd.get("qty"));
  const manualKcal = parseNum(fd.get("kcalManual"));
  const manualProtein = parseNum(fd.get("proteinManual"));
  const note = str(fd, "note").slice(0, 200);

  let name = str(fd, "name");
  let unit: Unit | "" = "";
  let kcal: number;
  let protein = 0;
  let manual = false;

  const food = foodId ? await db.collection("foods").findOne({ _id: foodId, userId: u._id }) : null;
  if (food) {
    name = food.name;
    unit = food.unit;
    if (manualKcal === null) {
      if (qty === null || qty <= 0) return fail("مقدار را وارد کنید.");
      const v = foodValues(food.unit, qty, food.kcal, food.protein);
      kcal = v.kcal;
      protein = v.protein;
    } else {
      kcal = Math.round(manualKcal);
      protein = manualProtein ?? (qty ? foodValues(food.unit, qty, food.kcal, food.protein).protein : 0);
      manual = true;
    }
  } else {
    if (!name) return fail("غذا را از لیست انتخاب کنید یا اسمش را بنویسید.");
    if (manualKcal === null) return fail("این غذا در بانک نیست؛ کالری را دستی وارد کنید.");
    kcal = Math.round(manualKcal);
    protein = manualProtein ?? 0;
    manual = true;
  }
  if (kcal < 0 || kcal > 10000) return fail("عدد کالری منطقی نیست.");

  await db.collection("foodLogs").insertOne({
    userId: u._id,
    date,
    meal,
    name: name.slice(0, 120),
    unit,
    qty: qty ?? null,
    kcal,
    protein,
    manual,
    note,
    createdAt: new Date(),
  });
  refresh();
  return ok();
}

export async function deleteFoodLog(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("foodLogs").deleteOne({ _id, userId: u._id });
  refresh();
}

/** کپی یک وعده (یا کل روز) از روزی دیگر */
export async function copyMeal(from: string, to: string, meal: string) {
  const u = await requireUser();
  if (!isValidIso(from) || !isValidIso(to)) return;
  const db = await getDb();
  const filter: Record<string, unknown> = { userId: u._id, date: from };
  if (meal) filter.meal = meal;
  const docs = await db.collection("foodLogs").find(filter).sort({ createdAt: 1 }).toArray();
  if (!docs.length) return;
  const now = Date.now();
  await db.collection("foodLogs").insertMany(
    docs.map((d, i) => {
      const { _id, ...rest } = d;
      void _id;
      return { ...rest, date: to, createdAt: new Date(now + i) };
    }),
  );
  refresh();
}

/* ---------------- ثبت فعالیت ---------------- */

export async function addActivityLog(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const date = str(fd, "date");
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  const db = await getDb();
  const actId = oid(str(fd, "activityId"));
  const minutes = parseNum(fd.get("minutes"));
  const kcalManual = parseNum(fd.get("kcalManual"));
  const note = str(fd, "note").slice(0, 200);
  const act = actId ? await db.collection("activities").findOne({ _id: actId, userId: u._id }) : null;
  if (!act) return fail("فعالیت را از لیست انتخاب کنید.");
  if ((minutes === null || minutes <= 0) && kcalManual === null) return fail("مدت (دقیقه) را وارد کنید.");
  if (minutes !== null && minutes > 1440) return fail("مدت بیشتر از یک روز است!");
  await db.collection("activityLogs").insertOne({
    userId: u._id,
    date,
    name: act.name,
    met: act.met,
    minutes: minutes ?? 0,
    kcalManual: kcalManual === null ? null : Math.round(kcalManual),
    note,
    createdAt: new Date(),
  });
  refresh();
  return ok();
}

export async function deleteActivityLog(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("activityLogs").deleteOne({ _id, userId: u._id });
  refresh();
}

/* ---------------- وزن ---------------- */

export async function saveWeight(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const date = str(fd, "date");
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  const kg = parseNum(fd.get("kg"));
  const db = await getDb();
  const col = db.collection("weightLogs");
  if (kg === null) {
    await col.deleteOne({ userId: u._id, date });
  } else {
    if (kg < 25 || kg > 350) return fail("وزن منطقی نیست.");
    await col.updateOne({ userId: u._id, date }, { $set: { kg: Math.round(kg * 10) / 10 } }, { upsert: true });
  }
  refresh();
  return ok();
}

/* ---------------- بانک غذا و فعالیت (هر کاربر جدا) ---------------- */

export async function saveFood(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name").slice(0, 120);
  const unit = str(fd, "unit") as Unit;
  const kcal = parseNum(fd.get("kcal"));
  const protein = parseNum(fd.get("protein")) ?? 0;
  if (!name) return fail("اسم غذا را بنویسید.");
  if (!UNITS.includes(unit)) return fail("واحد را انتخاب کنید.");
  if (kcal === null || kcal < 0) return fail("کالری را وارد کنید.");
  const db = await getDb();
  const col = db.collection("foods");
  const dup = await col.findOne({ userId: u._id, name });
  if (dup && String(dup._id) !== id) return fail("غذایی با همین اسم در بانک هست.");
  const _id = oid(id);
  if (_id) await col.updateOne({ _id, userId: u._id }, { $set: { name, unit, kcal, protein } });
  else await col.insertOne({ userId: u._id, name, unit, kcal, protein });
  refresh();
  return ok();
}

export async function deleteFood(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("foods").deleteOne({ _id, userId: u._id });
  refresh();
}

export async function saveActivity(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name").slice(0, 120);
  const met = parseNum(fd.get("met"));
  if (!name) return fail("اسم فعالیت را بنویسید.");
  if (met === null || met < 1 || met > 25) return fail("MET باید عددی بین ۱ و ۲۵ باشد.");
  const db = await getDb();
  const col = db.collection("activities");
  const dup = await col.findOne({ userId: u._id, name });
  if (dup && String(dup._id) !== id) return fail("فعالیتی با همین اسم هست.");
  const _id = oid(id);
  if (_id) await col.updateOne({ _id, userId: u._id }, { $set: { name, met } });
  else await col.insertOne({ userId: u._id, name, met });
  refresh();
  return ok();
}

export async function deleteActivity(id: string) {
  const u = await requireUser();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("activities").deleteOne({ _id, userId: u._id });
  refresh();
}

/* ---------------- تمرین در خانه ---------------- */

/** علامت زدن/برداشتن «انجام شد» برای یک روز برنامه در هفته جاری؛ همراهش یک ثبت فعالیت امروز ساخته/حذف می‌شود */
export async function toggleWorkout(day: number) {
  const u = await requireUser();
  const w = getWorkoutDay(day);
  if (!w) return;
  const db = await getDb();
  const date = todayIso();
  const week = weekStart(date);
  const logs = db.collection("workoutLogs");
  const prev = await logs.findOne({ userId: u._id, week, day });
  if (prev) {
    await logs.deleteOne({ _id: prev._id });
    await db.collection("activityLogs").deleteOne({ _id: prev.activityLogId, userId: u._id });
  } else {
    const act = await db.collection("activityLogs").insertOne({
      userId: u._id,
      date,
      name: `تمرین در خانه: ${w.title}`,
      met: w.met,
      minutes: workoutMinutes(w),
      kcalManual: null,
      note: "",
      createdAt: new Date(),
    });
    try {
      await logs.insertOne({ userId: u._id, week, day, date, activityLogId: act.insertedId, createdAt: new Date() });
    } catch {
      // دابل‌کلیک: ایندکس یکتا جلوی ثبت دوم را گرفت
      await db.collection("activityLogs").deleteOne({ _id: act.insertedId });
    }
  }
  refresh();
}
