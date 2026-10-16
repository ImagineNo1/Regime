"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { toggleWorkout } from "@/app/actions";
import type { Step } from "@/lib/workout";

const fa = (n: number) => n.toLocaleString("fa-IR");
const clock = (s: number) => `${fa(Math.floor(s / 60))}:${fa(s % 60).padStart(2, "۰")}`;

function beep(freq = 880) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    o.connect(ctx.destination);
    o.onended = () => ctx.close();
    o.start();
    o.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function WorkoutTimer({ steps }: { steps: Step[] }) {
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(steps[0].sec);
  const [run, setRun] = useState(false);
  const step = steps[i];
  const finished = i === steps.length - 1 && left === 0;

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [run]);

  useEffect(() => {
    if (!run) return;
    if (left > 0 && left <= 3) beep(660);
    if (left > 0) return;
    beep();
    if (i + 1 < steps.length) go(i + 1);
    else setRun(false);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(j: number) {
    setI(j);
    setLeft(steps[j].sec);
  }

  const total = steps.reduce((a, s) => a + s.sec, 0);
  const elapsed = steps.slice(0, i).reduce((a, s) => a + s.sec, 0) + step.sec - left;

  return (
    <section
      aria-label="تایمر تمرین"
      className={`rounded-2xl border p-5 shadow-card ${step.rest ? "border-good bg-good-soft" : "border-line bg-surface"}`}
    >
      <div className="tnum flex justify-between text-xs text-muted">
        <span>{step.kind}</span>
        <span>
          {fa(i + 1)} / {fa(steps.length)}
        </span>
      </div>
      <h2 className="mt-3 text-xl font-extrabold" aria-live="polite">
        {finished ? "تمام شد! آفرین" : step.label}
      </h2>
      <p dir="ltr" className={`tnum mt-2 text-right text-6xl font-black ${step.rest ? "text-good" : "text-brand"}`}>
        {clock(left)}
      </p>
      <p className="mt-2 h-5 text-sm text-muted">{steps[i + 1] && `بعدی: ${steps[i + 1].label}`}</p>

      <div className="mt-4 h-2 rounded-full bg-surface-2">
        <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${(elapsed / total) * 100}%` }} />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_2fr_1fr] gap-2">
        <button className="btn btn-ghost" onClick={() => go(i - 1)} disabled={i === 0}>
          قبلی
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (finished) {
              go(0);
              setRun(true);
            } else setRun(!run);
          }}
        >
          <Icon name={run ? "pause" : "play"} size={18} />
          {finished ? "از اول" : run ? "مکث" : elapsed ? "ادامه" : "شروع"}
        </button>
        <button className="btn btn-ghost" onClick={() => go(i + 1)} disabled={i === steps.length - 1}>
          بعدی
        </button>
      </div>
    </section>
  );
}

export function WorkoutDoneButton({ day, done }: { day: number; done: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => toggleWorkout(day))}
      className={`btn w-full ${done ? "bg-good text-bg" : "btn-ghost border border-good text-good"}`}
    >
      <Icon name="check" size={18} />
      {done ? "این روز انجام شد" : "تمرین امروز را انجام دادم"}
    </button>
  );
}
