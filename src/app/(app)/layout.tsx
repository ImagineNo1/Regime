import { BottomNav, Sidebar } from "@/components/Nav";
import { PlanSwitcher } from "@/components/PlanSwitcher";
import { getPlans, pickActivePlan, requireUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const plans = await getPlans(u._id);
  const active = pickActivePlan(plans, u.user.activePlanId);
  return (
    <>
      <Sidebar name={u.user.name} switcher={<PlanSwitcher plans={plans} activeId={active?.id ?? null} />} />
      <main className="lg:pr-60">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur lg:hidden">
          <span className="shrink-0 text-sm font-bold">رژیم من</span>
          <div className="min-w-0 flex-1">
            <PlanSwitcher plans={plans} activeId={active?.id ?? null} compact />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
