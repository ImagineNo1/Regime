"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div>
        <label className="label" htmlFor="username">نام کاربری</label>
        <input key={state?.at} id="username" name="username" defaultValue={state?.username} className="field" autoComplete="username" dir="ltr" required autoFocus={!state?.username} />
      </div>
      <div>
        <label className="label" htmlFor="password">رمز عبور</label>
        <input key={state?.at} id="password" name="password" type="password" className="field" autoComplete="current-password" dir="ltr" required autoFocus={!!state?.username} />
      </div>
      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      <SubmitButton className="btn btn-primary w-full py-3">ورود</SubmitButton>
    </form>
  );
}
