"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, saveProfile } from "@/app/actions";
import type { Profile } from "@/lib/types";
import { SubmitButton, useKeepValuesSubmit } from "./SubmitButton";

export function ProfileForm({ p }: { p: Profile }) {
  const [state, action] = useActionState(saveProfile, undefined);
  const keep = useKeepValuesSubmit(action);
  return (
    <form onSubmit={keep.onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <F label="اسم"><input name="name" defaultValue={p.name} className="field" /></F>
        <F label="جنسیت" hint="برای فرمول سوخت‌وساز پایه">
          <select name="gender" defaultValue={p.gender} className="field">
            <option value="مرد">مرد</option>
            <option value="زن">زن</option>
          </select>
        </F>
        <F label="سن (سال)"><input name="age" defaultValue={p.age} className="field tnum" inputMode="numeric" /></F>
        <F label="قد (سانتی‌متر)"><input name="height" defaultValue={p.height} className="field tnum" inputMode="numeric" /></F>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pending={keep.pending}>ذخیره مشخصات</SubmitButton>
        {state?.ok && <span className="text-sm text-good">ذخیره شد ✓</span>}
        {state?.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <F label="رمز فعلی"><input name="current" type="password" className="field" dir="ltr" autoComplete="current-password" required /></F>
        <F label="رمز جدید" hint="حداقل ۸ کاراکتر"><input name="next" type="password" className="field" dir="ltr" autoComplete="new-password" minLength={8} required /></F>
        <F label="تکرار رمز جدید"><input name="next2" type="password" className="field" dir="ltr" autoComplete="new-password" minLength={8} required /></F>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton className="btn btn-ghost">تغییر رمز</SubmitButton>
        {state?.ok && <span className="text-sm text-good">رمز عوض شد ✓ (دستگاه‌های دیگر از حساب خارج شدند)</span>}
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
