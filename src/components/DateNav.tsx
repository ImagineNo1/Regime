"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDays, isoToJalaliText, jalaliTextToIso, jLong } from "@/lib/jalali";
import { Icon } from "./Icon";

export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const [text, setText] = useState(isoToJalaliText(date));
  const [err, setErr] = useState(false);
  const go = (iso: string) => router.push(iso === today ? "/day" : `/day?d=${iso}`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-xl border border-line bg-surface shadow-card">
        <Link href={`/day?d=${addDays(date, -1)}`} className="grid size-10 place-items-center text-ink-2 hover:text-brand" aria-label="روز قبل">
          <Icon name="chevR" />
        </Link>
        <div className="min-w-44 px-2 text-center text-sm font-bold">{jLong(date)}</div>
        <Link href={`/day?d=${addDays(date, 1)}`} className="grid size-10 place-items-center text-ink-2 hover:text-brand" aria-label="روز بعد">
          <Icon name="chevL" />
        </Link>
      </div>
      {date !== today && (
        <Link href="/day" className="btn btn-ghost">امروز</Link>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const iso = jalaliTextToIso(text);
          setErr(!iso);
          if (iso) go(iso);
        }}
        className="flex items-center gap-1"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`field w-32 text-center tnum ${err ? "border-bad!" : ""}`}
          dir="ltr"
          aria-label="رفتن به تاریخ (شمسی)"
          title="مثلاً 1405/07/22"
        />
        <button className="btn btn-ghost px-3" aria-label="برو">برو</button>
      </form>
    </div>
  );
}
