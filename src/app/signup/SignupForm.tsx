"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  const v = state?.values ?? {};
  return (
    <form key={state?.at} action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">اسم شما</label>
          <input id="name" name="name" defaultValue={v.name} className="field" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="username">نام کاربری (انگلیسی)</label>
          <input id="username" name="username" defaultValue={v.username} className="field" dir="ltr" autoComplete="username" autoCapitalize="none" required />
        </div>
        <div>
          <label className="label" htmlFor="gender">جنسیت</label>
          <select id="gender" name="gender" defaultValue={v.gender || "مرد"} className="field">
            <option value="مرد">مرد</option>
            <option value="زن">زن</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="password">رمز عبور</label>
          <input id="password" name="password" type="password" className="field" dir="ltr" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label className="label" htmlFor="password2">تکرار رمز عبور</label>
          <input id="password2" name="password2" type="password" className="field" dir="ltr" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label className="label" htmlFor="age">سن (سال)</label>
          <input id="age" name="age" defaultValue={v.age} className="field tnum" inputMode="numeric" required />
        </div>
        <div>
          <label className="label" htmlFor="height">قد (سانتی‌متر)</label>
          <input id="height" name="height" defaultValue={v.height} className="field tnum" inputMode="numeric" required />
        </div>
      </div>
      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      <SubmitButton className="btn btn-primary w-full py-3">ساختن حساب</SubmitButton>
    </form>
  );
}
