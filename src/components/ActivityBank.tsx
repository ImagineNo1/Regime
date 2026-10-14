"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteActivity, saveActivity } from "@/app/actions";
import { n1 } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { ActionButton } from "./ActionButton";
import { SubmitButton, useKeepValuesSubmit } from "./SubmitButton";

export function ActivityBank({ acts }: { acts: Activity[] }) {
  const [editing, setEditing] = useState<Activity | null>(null);
  const [state, action] = useActionState(saveActivity, undefined);
  const keep = useKeepValuesSubmit(action);
  const [ver, setVer] = useState(0); // بعد از ذخیره موفق، فرم از نو ساخته و خالی می‌شود
  useEffect(() => {
    if (state?.ok) {
      setEditing(null);
      setVer((v) => v + 1);
    }
  }, [state]);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>فعالیت</th>
              <th>شدت (MET)</th>
              <th>واحد</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {acts.map((a) => (
              <tr key={a.id} className={editing?.id === a.id ? "bg-brand-soft" : ""}>
                <td className="font-medium">{a.name}</td>
                <td className="tnum">{n1(a.met)}</td>
                <td className="text-ink-2">دقیقه</td>
                <td>
                  <div className="flex justify-end gap-0.5">
                    <ActionButton run={async () => setEditing(a)} icon="edit" label="ویرایش" />
                    <ActionButton run={deleteActivity.bind(null, a.id)} icon="trash" label="حذف" confirmText={`«${a.name}» حذف شود؟`} className="hover:text-bad" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-6">
        <h2 className="mb-4 font-bold">{editing ? "ویرایش فعالیت" : "افزودن فعالیت"}</h2>
        <form key={`${editing?.id ?? "new"}-${ver}`} onSubmit={keep.onSubmit} className="space-y-3">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div>
            <label className="label">نام فعالیت</label>
            <input name="name" defaultValue={editing?.name} className="field" required />
          </div>
          <div>
            <label className="label">شدت فعالیت (MET)</label>
            <input name="met" defaultValue={editing?.met} className="field tnum" inputMode="decimal" required />
            <p className="mt-1 text-xs text-muted">پیاده‌روی تند ≈ ۴٫۳ · بدنسازی متوسط ≈ ۵ · دویدن ≈ ۸ تا ۱۰</p>
          </div>
          {state?.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton pending={keep.pending}>{editing ? "ذخیره تغییرات" : "افزودن"}</SubmitButton>
            {editing && <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>انصراف</button>}
          </div>
        </form>
      </section>
    </div>
  );
}
