import "server-only";
import { MongoClient, type Db } from "mongodb";
import { SEED_ACTIVITIES, SEED_FOODS } from "./seed";
import { todayIso } from "./jalali";
import type { Settings } from "./types";

const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient>; _seeded?: Promise<void> };

function client() {
  if (!globalForMongo._mongo) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI در فایل .env تنظیم نشده است");
    globalForMongo._mongo = new MongoClient(uri).connect().catch((e) => {
      globalForMongo._mongo = undefined;
      throw e;
    });
  }
  return globalForMongo._mongo;
}

export const DEFAULT_SETTINGS: Settings = {
  gender: "مرد",
  age: 24,
  height: 183,
  startWeight: 81.2,
  targetWeight: 73,
  startDate: todayIso(),
  activityFactor: 1.2,
  deficit: 500,
  minCal: 1500,
};

async function seed(db: Db) {
  await Promise.all([
    db.collection("foodLogs").createIndex({ date: 1 }),
    db.collection("activityLogs").createIndex({ date: 1 }),
  ]);
  if ((await db.collection("foods").estimatedDocumentCount()) === 0) {
    await db.collection("foods").insertMany(SEED_FOODS.map((f) => ({ ...f })));
  }
  if ((await db.collection("activities").estimatedDocumentCount()) === 0) {
    await db.collection("activities").insertMany(SEED_ACTIVITIES.map((a) => ({ ...a })));
  }
  const settings = db.collection<{ _id: string } & Settings>("settings");
  if (!(await settings.findOne({ _id: "profile" }))) {
    await settings.insertOne({ _id: "profile", ...DEFAULT_SETTINGS, startDate: todayIso() });
  }
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || "rezhim");
  if (!globalForMongo._seeded) {
    globalForMongo._seeded = seed(db).catch((e) => {
      globalForMongo._seeded = undefined;
      throw e;
    });
  }
  await globalForMongo._seeded;
  return db;
}
