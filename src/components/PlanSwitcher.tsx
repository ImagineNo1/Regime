"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setActivePlan } from "@/app/actions";
import { GOALS, type Plan } from "@/lib/types";

export function PlanSwitcher({ plans, activeId, compact = false }: { plans: Plan[]; activeId: string | null; compact?: boolean }) {
  const [pending, start] = useTransition();
  if (!plans.length) {
    return (
      <Link href="/plans/new" className="btn btn-primary w-full text-xs">
        + ساختن اولین برنامه
      </Link>
    );
  }
  return (
    <label className="block">
      {!compact && <span className="mb-1 block text-[11px] font-medium text-muted">برنامه فعال</span>}
      <select
        value={activeId ?? ""}
        disabled={pending}
        onChange={(e) => start(() => setActivePlan(e.target.value))}
        className={`field ${compact ? "py-1.5 text-xs" : "text-sm"} font-semibold disabled:opacity-60`}
        aria-label="برنامه فعال"
      >
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {GOALS[p.goal].label}
          </option>
        ))}
      </select>
    </label>
  );
}
