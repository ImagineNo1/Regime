import "server-only";
import { MongoClient, ObjectId, type Db } from "mongodb";
import { SEED_ACTIVITIES, SEED_FOODS } from "./seed";
import { hashPassword } from "./password";
import { todayIso } from "./jalali";
import type { Gender, Goal } from "./types";

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _ready?: Promise<void> };

function client() {
  if (!g._mongo) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI در فایل .env تنظیم نشده است");
    g._mongo = new MongoClient(uri).connect().catch((e) => {
      g._mongo = undefined;
      throw e;
    });
  }
  return g._mongo;
}

export interface UserDoc {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  sv: number;
  name: string;
  gender: Gender;
  age: number;
  height: number;
  activePlanId: ObjectId | null;
  createdAt: Date;
}

export interface PlanDoc {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  goal: Goal;
  startDate: string;
  endDate: string | null;
  startWeight: number;
  targetWeight: number;
  dailyDelta: number;
  activityFactor: number;
  minCal: number;
  createdAt: Date;
}

/** بانک غذا و فعالیت پیش‌فرض برای کاربر جدید */
export async function seedBanks(db: Db, userId: ObjectId) {
  if (!(await db.collection("foods").findOne({ userId }))) {
    await db.collection("foods").insertMany(SEED_FOODS.map((f) => ({ ...f, userId })));
  }
  if (!(await db.collection("activities").findOne({ userId }))) {
    await db.collection("activities").insertMany(SEED_ACTIVITIES.map((a) => ({ ...a, userId })));
  }
}

async function setup(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ username: 1 }, { unique: true }),
    db.collection("plans").createIndex({ userId: 1 }),
    db.collection("foods").createIndex({ userId: 1, name: 1 }),
    db.collection("activities").createIndex({ userId: 1 }),
    db.collection("foodLogs").createIndex({ userId: 1, date: 1 }),
    db.collection("activityLogs").createIndex({ userId: 1, date: 1 }),
    db.collection("weightLogs").createIndex({ userId: 1, date: 1 }, { unique: true }),
    db.collection("workoutLogs").createIndex({ userId: 1, week: 1, day: 1 }, { unique: true }),
  ]);
  await migrateLegacy(db);
}

/**
 * نسخه قبلی سایت فقط یک کاربر داشت (از .env) و داده‌ها userId نداشتند.
 * اگر APP_USERNAME/APP_PASSWORD تنظیم باشد، همان کاربر ساخته می‌شود و همه داده‌های قبلی
 * (ثبت غذا، فعالیت، وزن، بانک‌ها و تنظیمات به‌عنوان «برنامه اول») به او منتقل می‌شود.
 */
async function migrateLegacy(db: Db) {
  const U = process.env.APP_USERNAME?.trim().toLowerCase();
  const P = process.env.APP_PASSWORD;
  if (!U || !P) return;

  const users = db.collection<UserDoc>("users");
  const settingsCol = db.collection<{ _id: string } & Record<string, unknown>>("settings");
  const legacy = await settingsCol.findOne({ _id: "profile" });

  let user = await users.findOne({ username: U });
  if (!user) {
    const doc: Omit<UserDoc, "_id"> = {
      username: U,
      passwordHash: await hashPassword(P),
      sv: 0,
      name: U,
      gender: (legacy?.gender as Gender) ?? "مرد",
      age: Number(legacy?.age ?? 30),
      height: Number(legacy?.height ?? 175),
      activePlanId: null,
      createdAt: new Date(),
    };
    try {
      const res = await users.insertOne(doc as UserDoc);
      user = { ...doc, _id: res.insertedId } as UserDoc;
    } catch {
      user = await users.findOne({ username: U }); // نمونه دیگری همزمان ساخت
      if (!user) return;
    }
  }
  const userId = user._id;

  if (legacy) {
    const start = Number(legacy.startWeight ?? 80);
    const target = Number(legacy.targetWeight ?? start);
    const goal: Goal = target < start ? "lose" : target > start ? "gain" : "maintain";
    const plan = await db.collection("plans").insertOne({
      userId,
      name: "برنامه اول",
      goal,
      startDate: (legacy.startDate as string) ?? todayIso(),
      endDate: null,
      startWeight: start,
      targetWeight: target,
      dailyDelta: goal === "maintain" ? 0 : Number(legacy.deficit ?? 500),
      activityFactor: Number(legacy.activityFactor ?? 1.2),
      minCal: Number(legacy.minCal ?? 1500),
      createdAt: new Date(),
    });
    await users.updateOne({ _id: userId }, { $set: { activePlanId: plan.insertedId } });
    await settingsCol.deleteOne({ _id: "profile" });
  }

  const orphan = { userId: { $exists: false } };
  for (const c of ["foods", "activities", "foodLogs", "activityLogs"]) {
    await db.collection(c).updateMany(orphan, { $set: { userId } });
  }
  // وزن‌های قدیمی: { _id: "2026-10-14", kg }
  const oldWeights = await db.collection<{ _id: unknown; kg: number }>("weights").find().toArray();
  for (const w of oldWeights) {
    if (typeof w._id === "string") {
      await db
        .collection("weightLogs")
        .updateOne({ userId, date: w._id }, { $set: { kg: w.kg } }, { upsert: true });
    }
    await db.collection("weights").deleteOne({ _id: w._id as never });
  }
  await seedBanks(db, userId);
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || "rezhim");
  if (!g._ready) {
    g._ready = setup(db).catch((e) => {
      g._ready = undefined;
      throw e;
    });
  }
  await g._ready;
  return db;
}

export const oid = (id: string | null | undefined) => (id && ObjectId.isValid(id) ? new ObjectId(id) : null);
