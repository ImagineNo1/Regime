import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Card, PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";
import { getSettings } from "@/lib/data";
import { isoToJalaliText } from "@/lib/jalali";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader title="تنظیمات" subtitle="مشخصات بدن و برنامه رژیم؛ همه محاسبه‌ها از این‌ها شروع می‌شود." />
      <Card title="مشخصات و برنامه">
        <SettingsForm s={{ ...s, startDateText: isoToJalaliText(s.startDate) }} />
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        <Link href="/foods" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <Icon name="apple" /> بانک غذا
        </Link>
        <Link href="/activities" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <Icon name="run" /> بانک فعالیت
        </Link>
      </div>
    </div>
  );
}
