import type { DayStatus } from "@/lib/calc";
import { Badge } from "./ui";

export function StatusBadge({ status }: { status: DayStatus }) {
  if (status === "deficit") return <Badge tone="good">✓ کسری کالری</Badge>;
  if (status === "surplus") return <Badge tone="bad">✗ مازاد کالری</Badge>;
  if (status === "low") return <Badge tone="warn">⚠ کمتر از حداقل ایمن</Badge>;
  return <Badge tone="muted">ثبت نشده</Badge>;
}
