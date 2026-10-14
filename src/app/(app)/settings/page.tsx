import Link from "next/link";
import { logout } from "@/app/actions";
import { Icon } from "@/components/Icon";
import { PasswordForm, ProfileForm } from "@/components/ProfileForms";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data";

export default async function SettingsPage() {
  const u = await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader title="تنظیمات" subtitle={<span>حساب کاربری: <b dir="ltr">{u.user.username}</b></span>} />
      <Card title="مشخصات بدن" subtitle="در همه برنامه‌ها برای محاسبه سوخت‌وساز پایه استفاده می‌شود. وزن و هدف داخل هر برنامه تنظیم می‌شود.">
        <ProfileForm p={u.user} />
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile href="/plans" icon="target" label="برنامه‌ها" />
        <Tile href="/reports" icon="table" label="گزارش‌ها" />
        <Tile href="/foods" icon="apple" label="بانک غذا" />
        <Tile href="/activities" icon="run" label="بانک فعالیت" />
      </div>
      <Card title="تغییر رمز عبور">
        <PasswordForm />
      </Card>
      <form action={logout}>
        <button className="btn btn-ghost text-bad">
          <Icon name="logout" size={18} /> خروج از حساب
        </button>
      </form>
    </div>
  );
}

function Tile({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 font-medium shadow-card hover:border-brand">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon name={icon} size={18} /></span>
      {label}
    </Link>
  );
}
