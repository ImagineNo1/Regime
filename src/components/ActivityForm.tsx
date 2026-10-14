"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addActivityLog } from "@/app/actions";
import { activityKcal } from "@/lib/calc";
import { n0, n1, parseNum } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { Icon } from "./Icon";

export function ActivityForm({ date, activities, weight }: { date: string; activities: Activity[]; weight: number }) {
  const [state, action] = useActionState(addActivityLog, undefined);
  const [actId, setActId] = useState("");
  const [minutes, setMinutes] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      setActId("");
      setMinutes("");
      formRef.current?.reset();
    }
  }, [state]);
  const act = activities.find((a) => a.id === actId);
  const m = parseNum(minutes);
  const preview = act && m ? activityKcal(act.met, weight, m) : null;

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <div>
        <label className="label">فعالیت</label>
        <select name="activityId" className="field" value={actId} onChange={(e) => setActId(e.target.value)}>
          <option value="">انتخاب کنید…</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">مدت (دقیقه)</label>
          <input name="minutes" className="field tnum" inputMode="numeric" placeholder="مثلاً ۴۵" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div>
          <label className="label">کالری دستی (اختیاری)</label>
          <input name="kcalManual" className="field tnum" inputMode="numeric" placeholder="از ساعت هوشمند" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {preview !== null ? (
            <>
              حدود <b className="tnum text-ink">{n0(preview)}</b> کیلوکالری (وزن {n1(weight)})
            </>
          ) : act ? (
            <>شدت فعالیت (MET): {n1(act.met)}</>
          ) : null}
        </span>
        <SubmitButton>
          <Icon name="plus" size={18} /> افزودن
        </SubmitButton>
      </div>
      {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
    </form>
  );
}
