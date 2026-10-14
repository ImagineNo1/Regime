"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { createSession, safeEqual, SESSION_COOKIE, SESSION_DAYS, verifySession } from "@/lib/auth";
import { foodValues } from "@/lib/calc";
import { parseNum } from "@/lib/format";
import { isValidIso, jalaliTextToIso } from "@/lib/jalali";
import { UNITS, type Unit } from "@/lib/seed";
import { MEALS, type Meal } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean; at?: number; username?: string } | undefined;

const ok = (): FormState => ({ ok: true, at: Date.now() });
const fail = (error: string): FormState => ({ error, at: Date.now() });

async function requireAuth() {
  const jar = await cookies();
  if (!(await verifySession(jar.get(SESSION_COOKIE)?.value))) redirect("/login");
}

function refresh() {
  revalidatePath("/", "layout");
}

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

function oid(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

/* ---------------- ورود / خروج ---------------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const u = str(fd, "username");
  const p = String(fd.get("password") ?? "");
  const U = process.env.APP_USERNAME ?? "";
  const P = process.env.APP_PASSWORD ?? "";
  if (!U || !P) return fail("APP_USERNAME و APP_PASSWORD در فایل .env تنظیم نشده‌اند.");
  const good = safeEqual(u, U) && safeEqual(p, P);
  if (!good) {
    await new Promise((r) => setTimeout(r, 700)); // کند کردن حدس زدن رمز
    return { ...fail("نام کاربری یا رمز عبور اشتباه است."), username: u };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSession(U), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

/* ---------------- ثبت غذا ---------------- */

export async function addFoodLog(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const date = str(fd, "date");
  const meal = str(fd, "meal") as Meal;
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  if (!MEALS.includes(meal)) return fail("وعده را انتخاب کنید.");

  const db = await getDb();
  const foodId = str(fd, "foodId");
  const qty = parseNum(fd.get("qty"));
  const manualKcal = parseNum(fd.get("kcalManual"));
  const manualProtein = parseNum(fd.get("proteinManual"));
  const note = str(fd, "note").slice(0, 200);

  let name = str(fd, "name");
  let unit: Unit | "" = "";
  let kcal: number;
  let protein = 0;
  let manual = false;

  const food = foodId && oid(foodId) ? await db.collection("foods").findOne({ _id: oid(foodId)! }) : null;
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
  await requireAuth();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("foodLogs").deleteOne({ _id });
  refresh();
}

/** کپی یک وعده (یا کل روز) از روزی دیگر */
export async function copyMeal(from: string, to: string, meal: string) {
  await requireAuth();
  if (!isValidIso(from) || !isValidIso(to)) return;
  const db = await getDb();
  const filter: Record<string, unknown> = { date: from };
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
  await requireAuth();
  const date = str(fd, "date");
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  const db = await getDb();
  const actId = str(fd, "activityId");
  const minutes = parseNum(fd.get("minutes"));
  const kcalManual = parseNum(fd.get("kcalManual"));
  const note = str(fd, "note").slice(0, 200);
  const act = actId && oid(actId) ? await db.collection("activities").findOne({ _id: oid(actId)! }) : null;
  if (!act) return fail("فعالیت را از لیست انتخاب کنید.");
  if ((minutes === null || minutes <= 0) && kcalManual === null) return fail("مدت (دقیقه) را وارد کنید.");
  if (minutes !== null && minutes > 1440) return fail("مدت بیشتر از یک روز است!");
  await db.collection("activityLogs").insertOne({
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
  await requireAuth();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("activityLogs").deleteOne({ _id });
  refresh();
}

/* ---------------- وزن ---------------- */

export async function saveWeight(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const date = str(fd, "date");
  if (!isValidIso(date)) return fail("تاریخ نامعتبر است.");
  const kg = parseNum(fd.get("kg"));
  const db = await getDb();
  const col = db.collection<{ _id: string; kg: number }>("weights");
  if (kg === null) {
    await col.deleteOne({ _id: date });
  } else {
    if (kg < 25 || kg > 350) return fail("وزن منطقی نیست.");
    await col.updateOne({ _id: date }, { $set: { kg: Math.round(kg * 10) / 10 } }, { upsert: true });
  }
  refresh();
  return ok();
}

/* ---------------- تنظیمات ---------------- */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const gender = str(fd, "gender");
  const startDate = jalaliTextToIso(str(fd, "startDate"));
  const nums = {
    age: parseNum(fd.get("age")),
    height: parseNum(fd.get("height")),
    startWeight: parseNum(fd.get("startWeight")),
    targetWeight: parseNum(fd.get("targetWeight")),
    activityFactor: parseNum(fd.get("activityFactor")),
    deficit: parseNum(fd.get("deficit")),
    minCal: parseNum(fd.get("minCal")),
  };
  if (gender !== "مرد" && gender !== "زن") return fail("جنسیت را انتخاب کنید.");
  if (!startDate) return fail("تاریخ شروع را شمسی و مثل ۱۴۰۵/۰۷/۲۲ بنویسید.");
  for (const [k, v] of Object.entries(nums)) if (v === null || v <= 0) return fail(`مقدار «${LABELS[k]}» را درست وارد کنید.`);
  const db = await getDb();
  await db
    .collection<{ _id: string }>("settings")
    .updateOne({ _id: "profile" }, { $set: { gender, startDate, ...nums } }, { upsert: true });
  refresh();
  return ok();
}

const LABELS: Record<string, string> = {
  age: "سن",
  height: "قد",
  startWeight: "وزن شروع",
  targetWeight: "وزن هدف",
  activityFactor: "ضریب تحرک",
  deficit: "کسری کالری",
  minCal: "حداقل کالری",
};

/* ---------------- بانک غذا و فعالیت ---------------- */

export async function saveFood(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
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
  const dup = await col.findOne({ name });
  if (dup && String(dup._id) !== id) return fail("غذایی با همین اسم در بانک هست.");
  if (id && oid(id)) await col.updateOne({ _id: oid(id)! }, { $set: { name, unit, kcal, protein } });
  else await col.insertOne({ name, unit, kcal, protein });
  refresh();
  return ok();
}

export async function deleteFood(id: string) {
  await requireAuth();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("foods").deleteOne({ _id });
  refresh();
}

export async function saveActivity(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const id = str(fd, "id");
  const name = str(fd, "name").slice(0, 120);
  const met = parseNum(fd.get("met"));
  if (!name) return fail("اسم فعالیت را بنویسید.");
  if (met === null || met < 1 || met > 25) return fail("MET باید عددی بین ۱ و ۲۵ باشد.");
  const db = await getDb();
  const col = db.collection("activities");
  const dup = await col.findOne({ name });
  if (dup && String(dup._id) !== id) return fail("فعالیتی با همین اسم هست.");
  if (id && oid(id)) await col.updateOne({ _id: oid(id)! }, { $set: { name, met } });
  else await col.insertOne({ name, met });
  refresh();
  return ok();
}

export async function deleteActivity(id: string) {
  await requireAuth();
  const _id = oid(id);
  if (!_id) return;
  const db = await getDb();
  await db.collection("activities").deleteOne({ _id });
  refresh();
}
