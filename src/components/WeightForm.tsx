"use client";

import { useActionState } from "react";
import { saveWeight } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function WeightForm({ date, kg }: { date: string; kg: number | null }) {
  const [state, action] = useActionState(saveWeight, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="date" value={date} />
      <div className="flex gap-2">
        <input
          key={`${date}-${kg}`}
          name="kg"
          defaultValue={kg ?? ""}
          className="field tnum text-lg font-bold"
          inputMode="decimal"
          placeholder="مثلاً ۸۰٫۴"
          aria-label="وزن صبح (کیلوگرم)"
        />
        <SubmitButton className="btn btn-ghost">ذخیره</SubmitButton>
      </div>
      <p className="text-xs text-muted">صبح، ناشتا، بعد از دستشویی. برای پاک کردن، خالی بگذارید و ذخیره کنید.</p>
      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="text-xs text-good">ذخیره شد ✓</p>}
    </form>
  );
}
