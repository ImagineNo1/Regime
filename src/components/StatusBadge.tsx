import { STATUS_LABEL, type DayStatus } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Badge } from "./ui";

export function StatusBadge({ status, goal }: { status: DayStatus; goal: Goal }) {
  if (status === "good") return <Badge tone="good">{STATUS_LABEL[goal].good}</Badge>;
  if (status === "bad") return <Badge tone="bad">{STATUS_LABEL[goal].bad}</Badge>;
  if (status === "low") return <Badge tone="warn">⚠ کمتر از حداقل ایمن</Badge>;
  return <Badge tone="muted">ثبت نشده</Badge>;
}
