"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { logout } from "@/app/actions";

const ITEMS = [
  { href: "/", label: "داشبورد", icon: "home", mobile: true },
  { href: "/day", label: "ثبت روزانه", icon: "plus", mobile: true },
  { href: "/charts", label: "نمودارها", icon: "chart", mobile: true },
  { href: "/reports", label: "گزارش‌ها", icon: "table", mobile: false },
  { href: "/plans", label: "برنامه‌ها", icon: "target", mobile: true },
  { href: "/workout", label: "تمرین در خانه", short: "تمرین", icon: "dumbbell", mobile: true },
  { href: "/foods", label: "بانک غذا", icon: "apple", mobile: false },
  { href: "/activities", label: "بانک فعالیت", icon: "run", mobile: false },
  { href: "/settings", label: "تنظیمات", icon: "gear", mobile: true },
];

function active(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function Sidebar({ name, switcher }: { name: string; switcher: React.ReactNode }) {
  const path = usePathname();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 right-0 w-60 flex-col border-l border-line bg-surface px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-ink">
          <Icon name="flame" size={22} />
        </div>
        <div>
          <div className="font-bold">رژیم من</div>
          <div className="text-xs text-muted">سلام {name}</div>
        </div>
      </div>
      <div className="mb-6">{switcher}</div>
      <nav className="flex flex-col gap-1">
        {ITEMS.map((it) => {
          const on = active(path, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                on ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <Icon name={it.icon} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2">
          <Icon name="logout" />
          خروج
        </button>
      </form>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6">
        {ITEMS.filter((i) => i.mobile).map((it) => {
          const on =
            active(path, it.href) ||
            (it.href === "/settings" && ["/foods", "/activities", "/reports"].some((p) => path.startsWith(p)));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on ? "text-brand" : "text-muted"}`}
            >
              <Icon name={it.icon} size={22} />
              {it.short ?? it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
