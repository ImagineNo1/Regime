/** برنامه ۷ روزه تمرین در خانه برای چربی‌سوزی (بدون وسیله). ویدیوها از آپارات embed می‌شوند. */

export interface Move {
  name: string;
  cue?: string;
  video?: string; // videohash آپارات
  sec?: number; // اگر نباشد، زمان کار همان روز
}

export interface WorkoutDay {
  day: number; // ۱ = شنبه
  weekday: string;
  title: string;
  focus: string;
  level: "آسان" | "متوسط" | "سخت";
  /** MET میانگین کل جلسه (با گرم و سرد کردن)؛ تقریبی، برای ثبت کالری در «ثبت روزانه» */
  met: number;
  work: number;
  rest: number;
  rounds: number;
  roundRest: number;
  warmup: Move[];
  exercises: Move[];
  cooldown: Move[];
}

const X = {
  jj: { name: "جامپینگ جک", video: "2G09q", cue: "پاها را باز و بسته کن و هم‌زمان دست‌ها را بالای سر ببر. نسخه آسان: بدون پرش، یک پا یک پا." },
  squat: { name: "اسکات", video: "j87554e", cue: "باسن را عقب بده، زانوها هم‌راستای پنجه، کمر صاف و وزن روی پاشنه." },
  jumpSquat: { name: "اسکات پرشی", video: "avp3ja8", cue: "از حالت اسکات با قدرت بپر و نرم فرود بیا. نسخه آسان: اسکات سریع بدون پرش." },
  climber: { name: "کوه‌نوردی", video: "o766543", cue: "در حالت شنا، زانوها را به نوبت و سریع به سمت سینه بیاور. باسن بالا نرود." },
  pushup: { name: "شنا سوئدی", video: "i12xc47", cue: "بدن یک خط صاف، آرنج‌ها ۴۵ درجه. نسخه آسان: روی زانو یا دست روی مبل." },
  highKnees: { name: "زانو بلند", video: "6oSkG", cue: "درجا بدو و زانوها را تا ارتفاع لگن بالا بیاور. روی پنجه فرود بیا." },
  lunge: { name: "لانژ معکوس", video: "d041a57", cue: "یک پا را عقب بگذار تا هر دو زانو ۹۰ درجه شوند. پاها را به نوبت عوض کن." },
  bridge: { name: "پل باسن", video: "woqi21h", cue: "به پشت بخواب، زانوها خم، باسن را بالا بیاور و در بالا یک ثانیه منقبض کن." },
  skater: { name: "اسکیتر", video: "e884l1x", cue: "به پهلو روی یک پا بپر و پای دیگر را پشت آن ضربدری بگذار." },
  wallSit: { name: "صندلی دیواری", video: "a78fah9", cue: "پشت به دیوار، زانوها ۹۰ درجه، مثل نشستن روی صندلی نامرئی بمان." },
  calf: { name: "ساق پا ایستاده", video: "n82cn2s", cue: "روی پنجه بالا برو، یک لحظه نگه دار و آرام پایین بیا." },
  plank: { name: "پلانک", video: "Q1vfV", cue: "روی ساعد، بدن یک خط صاف از سر تا پاشنه. شکم و باسن سفت." },
  bicycle: { name: "دوچرخه شکمی", video: "s029pw0", cue: "آرنج را به زانوی مخالف برسان و پاها را مثل رکاب زدن حرکت بده." },
  legRaise: { name: "بالا آوردن پا", video: "h29ca6q", cue: "به پشت بخواب، کمر چسبیده به زمین، پاهای صاف را بالا و آرام پایین بیاور." },
  plankJack: { name: "پلانک جک", video: "d60p0op", cue: "در حالت پلانک دست صاف، پاها را با پرش باز و بسته کن." },
  superman: { name: "سوپرمن", video: "u697on0", cue: "روی شکم بخواب و دست‌ها و پاها را هم‌زمان از زمین بلند کن." },
  dip: { name: "دیپ با صندلی", video: "x14r244", cue: "دست‌ها لبه صندلی محکم، آرنج‌ها را تا ۹۰ درجه خم کن و بالا بیا." },
  tap: { name: "پلانک ضربه به شانه", video: "e813ds0", cue: "در حالت شنا، با هر دست به نوبت به شانه مخالف ضربه بزن. لگن نچرخد." },
  boxing: { name: "بوکس سایه", video: "m146410", cue: "گارد بگیر و مشت‌های سریع جلو بزن، روی پنجه سبک حرکت کن." },
  burpee: { name: "برپی", video: "k3KjO", cue: "اسکات، دست‌ها روی زمین، پاها عقب، برگرد و بپر. نسخه آسان: بدون پرش و شنا." },
  march: { name: "راه رفتن سریع درجا", video: "c562d03", cue: "با ریتم تند درجا راه برو و دست‌ها را تاب بده. باید کمی نفس‌نفس بزنی ولی بتوانی حرف بزنی." },
  walk: { name: "پیاده‌روی تند", video: "h154k84", cue: "در خانه یا بیرون، با سرعتی که نفس‌ات کمی تند شود." },
} satisfies Record<string, Move>;

const ex = (k: keyof typeof X, sec?: number): Move => ({ ...X[k], ...(sec && { sec }) });

const warmup: Move[] = [
  { name: "درجا زدن آرام", video: "c562d03", sec: 60 },
  { name: "چرخش بازوها", video: "pQCw0", sec: 45 },
  { name: "چرخش لگن", video: "4XUb3", sec: 45 },
  { name: "اسکات آرام", video: "j87554e", sec: 45 },
  { name: "جامپینگ جک آرام", video: "fkjiowa", sec: 45 },
];

const cooldown: Move[] = [
  { name: "کشش پشت ران (همسترینگ)", video: "KE23i", sec: 45 },
  { name: "کشش جلوی ران", video: "vfAVw", sec: 45 },
  { name: "کشش کبرا", video: "O6rjh", sec: 30 },
  { name: "حالت کودک", video: "r75rbvu", sec: 45 },
  { name: "تنفس عمیق", video: "d6226cl", sec: 45 },
];

const base = { warmup, cooldown };

export const WORKOUT: WorkoutDay[] = [
  {
    ...base, day: 1, weekday: "شنبه", title: "HIIT کل بدن", focus: "شروع پرانرژی هفته با تمرین تناوبی شدید", level: "متوسط", met: 6,
    work: 40, rest: 20, rounds: 4, roundRest: 60,
    exercises: [ex("jj"), ex("squat"), ex("climber"), ex("pushup"), ex("highKnees")],
  },
  {
    ...base, day: 2, weekday: "یکشنبه", title: "پایین‌تنه و کاردیو", focus: "ران و باسن، بزرگ‌ترین عضلات بدن برای سوزاندن کالری", level: "متوسط", met: 6,
    work: 45, rest: 15, rounds: 3, roundRest: 60,
    exercises: [ex("jumpSquat"), ex("lunge"), ex("bridge"), ex("skater"), ex("wallSit"), ex("calf")],
  },
  {
    ...base, day: 3, weekday: "دوشنبه", title: "شکم و پهلو", focus: "تقویت عضلات مرکزی بدن و کاردیو سبک", level: "متوسط", met: 5,
    work: 40, rest: 20, rounds: 3, roundRest: 60,
    exercises: [ex("plank"), ex("bicycle"), ex("legRaise"), ex("climber"), ex("plankJack"), ex("superman")],
  },
  {
    ...base, day: 4, weekday: "سه‌شنبه", title: "ریکاوری فعال", focus: "کاردیو کم‌فشار؛ بدن ریکاوری می‌کند ولی چربی‌سوزی ادامه دارد", level: "آسان", met: 3.5,
    work: 0, rest: 0, rounds: 1, roundRest: 0,
    exercises: [ex("march", 600), ex("boxing", 300), ex("march", 600)],
  },
  {
    ...base, day: 5, weekday: "چهارشنبه", title: "بالاتنه و HIIT", focus: "سینه، شانه و پشت بازو همراه با ضربان بالا", level: "متوسط", met: 6,
    work: 40, rest: 20, rounds: 4, roundRest: 60,
    exercises: [ex("pushup"), ex("dip"), ex("tap"), ex("boxing"), ex("burpee"), ex("superman")],
  },
  {
    ...base, day: 6, weekday: "پنجشنبه", title: "تاباتا کل بدن", focus: "۲۰ ثانیه تمام‌قدرت، ۱۰ ثانیه استراحت؛ کوتاه و سنگین", level: "سخت", met: 7,
    work: 20, rest: 10, rounds: 8, roundRest: 60,
    exercises: [ex("burpee"), ex("jumpSquat"), ex("climber"), ex("highKnees")],
  },
  {
    ...base, day: 7, weekday: "جمعه", title: "پیاده‌روی و کشش", focus: "پیاده‌روی طولانی و کشش کامل برای آماده شدن برای هفته بعد", level: "آسان", met: 3.5,
    work: 0, rest: 0, rounds: 1, roundRest: 0,
    exercises: [ex("walk", 1800)],
  },
];

export const getWorkoutDay = (day: number) => WORKOUT.find((d) => d.day === day) ?? null;

const fa = (n: number) => n.toLocaleString("fa-IR");

export interface Step {
  label: string;
  sec: number;
  kind: string;
  rest?: boolean;
}

/** کل جلسه را به قدم‌های زمان‌دار برای تایمر تبدیل می‌کند */
export function buildSteps(d: WorkoutDay): Step[] {
  const s: Step[] = d.warmup.map((w) => ({ label: w.name, sec: w.sec!, kind: "گرم کردن" }));
  for (let r = 1; r <= d.rounds; r++) {
    d.exercises.forEach((e, i) => {
      s.push({ label: e.name, sec: e.sec ?? d.work, kind: d.rounds > 1 ? `دور ${fa(r)} از ${fa(d.rounds)}` : "تمرین اصلی" });
      const last = i === d.exercises.length - 1;
      const rest = last ? d.roundRest : d.rest;
      if (rest && !(last && r === d.rounds)) s.push({ label: last ? "استراحت بین دورها" : "استراحت", sec: rest, kind: "استراحت", rest: true });
    });
  }
  for (const c of d.cooldown) s.push({ label: c.name, sec: c.sec!, kind: "سرد کردن" });
  return s;
}

export const workoutMinutes = (d: WorkoutDay) => Math.round(buildSteps(d).reduce((a, s) => a + s.sec, 0) / 60);

/** شنبهٔ هفته‌ای که iso در آن است (هفته ایرانی از شنبه شروع می‌شود) */
export function weekStart(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // ۶ = شنبه
  const back = (dow + 1) % 7;
  const t = new Date(Date.UTC(y, m - 1, d - back));
  return t.toISOString().slice(0, 10);
}
