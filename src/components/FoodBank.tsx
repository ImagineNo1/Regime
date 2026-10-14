"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { deleteFood, saveFood } from "@/app/actions";
import { n0, n1 } from "@/lib/format";
import { UNITS } from "@/lib/seed";
import type { Food } from "@/lib/types";
import { ActionButton } from "./ActionButton";
import { Icon } from "./Icon";
import { SubmitButton, useKeepValuesSubmit } from "./SubmitButton";

export function FoodBank({ foods }: { foods: Food[] }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Food | null>(null);
  const [state, action] = useActionState(saveFood, undefined);
  const keep = useKeepValuesSubmit(action);
  const [ver, setVer] = useState(0); // بعد از ذخیره موفق، فرم از نو ساخته و خالی می‌شود
  useEffect(() => {
    if (state?.ok) {
      setEditing(null);
      setVer((v) => v + 1);
    }
  }, [state]);
  const list = useMemo(() => {
    const t = q.trim();
    return t ? foods.filter((f) => f.name.includes(t)) : foods;
  }, [q, foods]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line p-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-muted"><Icon name="search" size={17} /></span>
            <input className="field pr-9" placeholder={`جستجو در ${n0(foods.length)} غذا…`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>نام غذا</th>
                <th>واحد</th>
                <th>کالری</th>
                <th>پروتئین (گرم)</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className={editing?.id === f.id ? "bg-brand-soft" : ""}>
                  <td className="font-medium">{f.name}</td>
                  <td className="text-ink-2">{f.unit === "گرم" ? "۱۰۰ گرم" : f.unit}</td>
                  <td className="tnum">{n0(f.kcal)}</td>
                  <td className="tnum">{n1(f.protein)}</td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <ActionButton run={async () => setEditing(f)} icon="edit" label="ویرایش" />
                      <ActionButton run={deleteFood.bind(null, f.id)} icon="trash" label="حذف" confirmText={`«${f.name}» از بانک حذف شود؟ (ثبت‌های قبلی دست نمی‌خورند)`} className="hover:text-bad" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-6">
        <h2 className="mb-4 font-bold">{editing ? "ویرایش غذا" : "افزودن غذای جدید"}</h2>
        <form key={`${editing?.id ?? "new"}-${ver}`} onSubmit={keep.onSubmit} className="space-y-3">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div>
            <label className="label">نام غذا</label>
            <input name="name" defaultValue={editing?.name} className="field" required />
          </div>
          <div>
            <label className="label">واحد</label>
            <select name="unit" defaultValue={editing?.unit ?? "قاشق"} className="field">
              {UNITS.map((u) => (
                <option key={u} value={u}>{u === "گرم" ? "گرم (کالری در ۱۰۰ گرم)" : u === "قاشق" ? "قاشق غذاخوری" : u}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">کالری</label>
              <input name="kcal" defaultValue={editing?.kcal} className="field tnum" inputMode="decimal" required />
            </div>
            <div>
              <label className="label">پروتئین (گرم)</label>
              <input name="protein" defaultValue={editing?.protein} className="field tnum" inputMode="decimal" />
            </div>
          </div>
          {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton pending={keep.pending}>{editing ? "ذخیره تغییرات" : "افزودن"}</SubmitButton>
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>انصراف</button>
            )}
          </div>
          <p className="text-xs text-muted">تغییر کالری یک غذا روی ثبت‌های قبلی اثر ندارد؛ فقط از این به بعد.</p>
        </form>
      </section>
    </div>
  );
}
