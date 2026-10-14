import Link from "next/link";
import { Card, PageHeader } from "./ui";

export function NoPlan({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <Card>
        <div className="py-8 text-center text-sm text-ink-2">
          برای دیدن {title}، اول یک برنامه بسازید.
          <div className="mt-4">
            <Link href="/plans/new" className="btn btn-primary">ساختن برنامه</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
