"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions";
import type { Settings } from "@/lib/types";
import { SubmitButton, useKeepValuesSubmit } from "./SubmitButton";

const FACTORS = [
  { v: 1.2, t: "۱٫۲ — پشت‌میزنشین (ورزش جدا ثبت می‌شود)" },
  { v: 1.375, t: "۱٫۳۷۵ — کم‌تحرک" },
  { v: 1.55, t: "۱٫۵۵ — نسبتاً فعال" },
  { v: 1.725, t: "۱٫۷۲۵ — خیلی فعال" },
];

export function SettingsForm({ s }: { s: Settings & { startDateText: string } }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const keep = useKeepValuesSubmit(action);
  return (
    <form onSubmit={keep.onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <F label="جنسیت" hint="برای فرمول سوخت‌وساز پایه">
          <select name="gender" defaultValue={s.gender} className="field">
            <option value="مرد">مرد</option>
            <option value="زن">زن</option>
          </select>
        </F>
        <F label="سن (سال)"><input name="age" defaultValue={s.age} className="field tnum" inputMode="numeric" /></F>
        <F label="قد (سانتی‌متر)"><input name="height" defaultValue={s.height} className="field tnum" inputMode="numeric" /></F>
        <F label="وزن شروع (کیلوگرم)"><input name="startWeight" defaultValue={s.startWeight} className="field tnum" inputMode="decimal" /></F>
        <F label="وزن هدف (کیلوگرم)"><input name="targetWeight" defaultValue={s.targetWeight} className="field tnum" inputMode="decimal" /></F>
        <F label="تاریخ شروع رژیم (شمسی)" hint="مثلاً 1405/07/22">
          <input name="startDate" defaultValue={s.startDateText} className="field tnum" dir="ltr" />
        </F>
        <F label="ضریب تحرک روزانه (بدون ورزش)">
          <select name="activityFactor" defaultValue={String(s.activityFactor)} className="field">
            {FACTORS.map((f) => (
              <option key={f.v} value={f.v}>{f.t}</option>
            ))}
          </select>
        </F>
        <F label="کسری کالری روزانه هدف" hint="۵۰۰ ≈ نیم کیلو در هفته">
          <input name="deficit" defaultValue={s.deficit} className="field tnum" inputMode="numeric" />
        </F>
        <F label="حداقل کالری ایمن روزانه" hint="کمتر از این هشدار می‌دهد">
          <input name="minCal" defaultValue={s.minCal} className="field tnum" inputMode="numeric" />
        </F>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pending={keep.pending}>ذخیره تنظیمات</SubmitButton>
        {state?.ok && <span className="text-sm text-good">ذخیره شد ✓</span>}
        {state?.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
