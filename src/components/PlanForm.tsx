"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { savePlan } from "@/app/actions";
import { calorieGoal, KCAL_PER_KG, tdee } from "@/lib/calc";
import { n0, n1, parseNum } from "@/lib/format";
import { addDays, diffDays, isoToJalaliText, jalaliTextToIso, jNumeric } from "@/lib/jalali";
import { GOALS, type Goal, type Plan, type Profile } from "@/lib/types";
import { SubmitButton, useKeepValuesSubmit } from "./SubmitButton";

const FACTORS = [
  { v: "1.2", t: "۱٫۲ — پشت‌میزنشین (ورزش جدا ثبت می‌شود)" },
  { v: "1.375", t: "۱٫۳۷۵ — کم‌تحرک" },
  { v: "1.55", t: "۱٫۵۵ — نسبتاً فعال" },
  { v: "1.725", t: "۱٫۷۲۵ — خیلی فعال" },
];

/** سرعت تغییر وزن (کیلو در هفته) → کالری روزانه */
const RATES: Record<Exclude<Goal, "maintain">, number[]> = {
  lose: [0.25, 0.5, 0.75, 1],
  gain: [0.25, 0.5],
};
const rateToKcal = (kgPerWeek: number) => Math.round((kgPerWeek * KCAL_PER_KG) / 7);

const DURATIONS = [
  { label: "۴ هفته", days: 28 },
  { label: "۸ هفته", days: 56 },
  { label: "۱۲ هفته", days: 84 },
  { label: "۶ ماه", days: 182 },
];

export function PlanForm({ profile, plan, defaults }: { profile: Profile; plan?: Plan; defaults: Plan }) {
  const router = useRouter();
  const [state, action] = useActionState(savePlan, undefined);
  const keep = useKeepValuesSubmit(action);
  const p = plan ?? defaults;

  const [goal, setGoal] = useState<Goal>(p.goal);
  const [start, setStart] = useState(isoToJalaliText(p.startDate));
  const [end, setEnd] = useState(p.endDate ? isoToJalaliText(p.endDate) : "");
  const [startW, setStartW] = useState(String(p.startWeight));
  const [targetW, setTargetW] = useState(String(p.targetWeight));
  const [delta, setDelta] = useState(String(p.dailyDelta || 550));
  const [factor, setFactor] = useState(String(p.activityFactor));
  const [minCal, setMinCal] = useState(String(p.minCal));

  useEffect(() => {
    if (state?.ok) router.push("/plans");
  }, [state, router]);

  const startIso = jalaliTextToIso(start);
  const endIso = end ? jalaliTextToIso(end) : null;

  const preview = useMemo(() => {
    const sw = parseNum(startW);
    const tw = goal === "maintain" ? sw : parseNum(targetW);
    const d = goal === "maintain" ? 0 : parseNum(delta) ?? 0;
    const f = parseNum(factor);
    const m = parseNum(minCal);
    if (!sw || !tw || !f || !m) return null;
    const fake: Plan = { ...p, goal, startWeight: sw, targetWeight: tw, dailyDelta: d, activityFactor: f, minCal: m };
    const t = tdee(profile, f, sw);
    const g = calorieGoal(profile, fake, sw);
    const effective = goal === "lose" ? t - g : goal === "gain" ? g - t : 0; // اگر به حداقل کالری بخورد، کمتر می‌شود
    const kg = Math.abs(tw - sw);
    const weeks = effective > 0 ? (kg * KCAL_PER_KG) / (effective * 7) : null;
    const eta = weeks !== null && startIso ? addDays(startIso, Math.round(weeks * 7)) : null;
    const days = startIso && endIso ? diffDays(endIso, startIso) + 1 : null;
    const needed = days && kg ? Math.round((kg * KCAL_PER_KG) / days) : null;
    return { t, g, effective, weeks, eta, days, needed, clamped: goal === "lose" && g === m && t - d < m };
  }, [startW, targetW, delta, factor, minCal, goal, profile, p, startIso, endIso]);

  const rates = goal === "maintain" ? [] : RATES[goal];

  return (
    <form onSubmit={keep.onSubmit} className="space-y-6">
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <input type="hidden" name="goal" value={goal} />

      <div>
        <span className="label">هدف این دوره</span>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GOALS) as Goal[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setGoal(k);
                const sw = parseNum(startW) ?? 0;
                const tw = parseNum(targetW) ?? 0;
                if (k === "lose" && tw >= sw) setTargetW(String(Math.max(30, Math.round(sw - 5))));
                if (k === "gain" && tw <= sw) setTargetW(String(Math.round(sw + 4)));
                if (k === "gain" && (parseNum(delta) ?? 0) > 550) setDelta("275");
              }}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                goal === k ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-2 hover:text-ink"
              }`}
            >
              {k === "lose" ? "⬇ " : k === "gain" ? "⬆ " : "⟷ "}
              {GOALS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">اسم برنامه</label>
          <input name="name" defaultValue={p.name} className="field" placeholder="مثلاً کات تابستان" required />
        </div>
        <div>
          <label className="label">تاریخ شروع (شمسی)</label>
          <input name="startDate" value={start} onChange={(e) => setStart(e.target.value)} className={`field tnum ${start && !startIso ? "border-bad!" : ""}`} dir="ltr" placeholder="1405/07/22" />
        </div>
        <div>
          <label className="label">تاریخ پایان (شمسی) — اختیاری</label>
          <input name="endDate" value={end} onChange={(e) => setEnd(e.target.value)} className={`field tnum ${end && !endIso ? "border-bad!" : ""}`} dir="ltr" placeholder="بدون پایان" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                type="button"
                disabled={!startIso}
                onClick={() => startIso && setEnd(isoToJalaliText(addDays(startIso, d.days - 1)))}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2 hover:text-ink disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
            {end && (
              <button type="button" onClick={() => setEnd("")} className="rounded-full px-2.5 py-1 text-xs text-muted hover:text-bad">
                بدون پایان
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="label">وزن شروع (کیلوگرم)</label>
          <input name="startWeight" value={startW} onChange={(e) => setStartW(e.target.value)} className="field tnum" inputMode="decimal" />
        </div>
        {goal !== "maintain" ? (
          <div>
            <label className="label">وزن هدف (کیلوگرم)</label>
            <input name="targetWeight" value={targetW} onChange={(e) => setTargetW(e.target.value)} className="field tnum" inputMode="decimal" />
          </div>
        ) : (
          <input type="hidden" name="targetWeight" value={startW} />
        )}
      </div>

      {goal !== "maintain" ? (
        <div>
          <label className="label">{goal === "lose" ? "کسری" : "مازاد"} کالری روزانه</label>
          <div className="flex flex-wrap items-center gap-2">
            {rates.map((r) => {
              const k = rateToKcal(r);
              const on = parseNum(delta) === k;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDelta(String(k))}
                  className={`rounded-xl border px-3 py-2 text-xs transition ${on ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2 hover:text-ink"}`}
                >
                  <b className="tnum">{r.toLocaleString("fa-IR")}</b> کیلو در هفته
                  <span className="ms-1 text-muted tnum">({n0(k)})</span>
                </button>
              );
            })}
            <input name="dailyDelta" value={delta} onChange={(e) => setDelta(e.target.value)} className="field tnum w-28" inputMode="numeric" aria-label="کالری روزانه" />
          </div>
        </div>
      ) : (
        <input type="hidden" name="dailyDelta" value="0" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">ضریب تحرک روزانه (بدون ورزش)</label>
          <select name="activityFactor" value={factor} onChange={(e) => setFactor(e.target.value)} className="field">
            {FACTORS.map((f) => (
              <option key={f.v} value={f.v}>{f.t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">حداقل کالری ایمن روزانه</label>
          <input name="minCal" value={minCal} onChange={(e) => setMinCal(e.target.value)} className="field tnum" inputMode="numeric" />
        </div>
      </div>

      {preview && (
        <div className="grid gap-3 rounded-2xl bg-surface-2 p-4 text-sm sm:grid-cols-3">
          <Kv k="مصرف روزانه بدون ورزش (TDEE)" v={`${n0(preview.t)} کیلوکالری`} />
          <Kv k="هدف کالری روزانه" v={`${n0(preview.g)} کیلوکالری`} strong />
          {goal === "maintain" ? (
            <Kv k="محدوده متعادل" v={`± ۲۰۰ کیلوکالری از مصرف روزانه`} />
          ) : (
            <Kv
              k="رسیدن به هدف (تقریبی)"
              v={preview.weeks === null ? "—" : `${n1(preview.weeks)} هفته · ${preview.eta ? jNumeric(preview.eta) : ""}`}
            />
          )}
          {preview.clamped && (
            <p className="text-warn sm:col-span-3">
              هدف کالری به «حداقل کالری ایمن» خورده؛ کسری واقعی {n0(preview.effective)} کیلوکالری است.
            </p>
          )}
          {goal !== "maintain" && preview.days && preview.needed !== null && (
            <p className={`sm:col-span-3 ${preview.needed > preview.effective ? "text-warn" : "text-good"}`}>
              این دوره {n0(preview.days)} روز است. برای رسیدن به وزن هدف تا پایان دوره، روزانه حدود{" "}
              <b className="tnum">{n0(preview.needed)}</b> کیلوکالری {goal === "lose" ? "کسری" : "مازاد"} لازم است
              {preview.needed > preview.effective ? " — بیشتر از برنامه فعلی." : " — برنامه فعلی کافی است ✓"}
            </p>
          )}
        </div>
      )}

      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pending={keep.pending}>{plan ? "ذخیره تغییرات" : "ساختن برنامه"}</SubmitButton>
        <button type="button" onClick={() => router.push("/plans")} className="btn btn-ghost">انصراف</button>
      </div>
    </form>
  );
}

function Kv({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted">{k}</div>
      <div className={`mt-0.5 tnum ${strong ? "text-base font-extrabold text-brand" : "font-semibold"}`}>{v}</div>
    </div>
  );
}
