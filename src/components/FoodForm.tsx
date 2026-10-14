"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { addFoodLog } from "@/app/actions";
import { foodValues } from "@/lib/calc";
import { n0, n1, parseNum } from "@/lib/format";
import { MEALS, type Food, type Meal } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { Icon } from "./Icon";

const UNIT_HINT: Record<string, string> = {
  گرم: "گرم",
  قاشق: "قاشق غذاخوری",
  عدد: "عدد",
  لیوان: "لیوان",
  فنجان: "فنجان",
};

function norm(s: string) {
  return s.replace(/[‌\s]+/g, " ").replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

export function FoodForm({ date, foods, defaultMeal }: { date: string; foods: Food[]; defaultMeal: Meal }) {
  const [state, action] = useActionState(addFoodLog, undefined);
  const [meal, setMeal] = useState<Meal>(defaultMeal);
  const [query, setQuery] = useState("");
  const [food, setFood] = useState<Food | null>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [qty, setQty] = useState("");
  const [manual, setManual] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return foods.slice(0, 8);
    const words = q.split(" ");
    return foods
      .filter((f) => {
        const n = norm(f.name);
        return words.every((w) => n.includes(w));
      })
      .sort((a, b) => Number(!norm(a.name).startsWith(q)) - Number(!norm(b.name).startsWith(q)))
      .slice(0, 8);
  }, [query, foods]);

  // بعد از ثبت موفق فرم را خالی کن
  useEffect(() => {
    if (state?.ok) {
      setQuery("");
      setFood(null);
      setQty("");
      setManual(false);
      formRef.current?.reset();
    }
  }, [state]);

  const q = parseNum(qty);
  const preview = food && q && q > 0 ? foodValues(food.unit, q, food.kcal, food.protein) : null;
  const notInBank = !food && query.trim() !== "";

  const pick = (f: Food) => {
    setFood(f);
    setQuery(f.name);
    setOpen(false);
    setTimeout(() => qtyRef.current?.focus(), 0);
  };

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="foodId" value={food?.id ?? ""} />

      <div className="flex flex-wrap gap-1.5">
        {MEALS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMeal(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              meal === m ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-2 hover:text-ink"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div className="relative">
          <label className="label">غذا</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-muted">
              <Icon name="search" size={17} />
            </span>
            <input
              name="name"
              className="field pr-9"
              placeholder="جستجو… مثلاً برنج، قیمه، اسپرسو"
              value={query}
              autoComplete="off"
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onChange={(e) => {
                setQuery(e.target.value);
                setFood(null);
                setOpen(true);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (!open || !results.length) return;
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                if (e.key === "Enter" && !food) { e.preventDefault(); pick(results[hi]); }
              }}
            />
          </div>
          {open && results.length > 0 && !food && (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
              {results.map((f, i) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(f)}
                    onMouseEnter={() => setHi(i)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-right text-sm ${i === hi ? "bg-surface-2" : ""}`}
                  >
                    <span>{f.name}</span>
                    <span className="shrink-0 text-xs text-muted tnum">
                      {n0(f.kcal)} کالری / {f.unit === "گرم" ? "۱۰۰ گرم" : UNIT_HINT[f.unit]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="label">
            مقدار {food ? <span className="text-brand">({UNIT_HINT[food.unit]})</span> : null}
          </label>
          <input
            ref={qtyRef}
            name="qty"
            className="field tnum"
            inputMode="decimal"
            placeholder={food?.unit === "گرم" ? "مثلاً ۱۵۰" : "مثلاً ۲"}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>

      {(manual || notInBank) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">کالری دستی (کیلوکالری)</label>
            <input name="kcalManual" className="field tnum" inputMode="numeric" placeholder="مثلاً ۳۵۰" />
          </div>
          <div>
            <label className="label">پروتئین (گرم) — اختیاری</label>
            <input name="proteinManual" className="field tnum" inputMode="decimal" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          {preview ? (
            <span className="text-ink-2">
              <b className="tnum text-ink">{n0(preview.kcal)}</b> کیلوکالری · <b className="tnum text-ink">{n1(preview.protein)}</b> گرم پروتئین
            </span>
          ) : notInBank ? (
            <span className="text-warn">این غذا در بانک نیست؛ کالری را دستی بنویسید.</span>
          ) : (
            <button type="button" onClick={() => setManual((m) => !m)} className="text-xs text-muted underline-offset-4 hover:underline">
              {manual ? "محاسبه خودکار" : "وارد کردن کالری دستی"}
            </button>
          )}
        </div>
        <SubmitButton>
          <Icon name="plus" size={18} /> افزودن به {meal}
        </SubmitButton>
      </div>
      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
    </form>
  );
}
