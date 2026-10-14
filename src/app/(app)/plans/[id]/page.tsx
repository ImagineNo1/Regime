import { notFound } from "next/navigation";
import { PlanForm } from "@/components/PlanForm";
import { Card, PageHeader } from "@/components/ui";
import { getPlans, requireUser } from "@/lib/data";
import { defaultPlan } from "@/lib/plans";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser();
  const plan = (await getPlans(u._id)).find((p) => p.id === id);
  if (!plan) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title={`ویرایش «${plan.name}»`} subtitle="تغییرها روی همه محاسبه‌های همین برنامه اعمال می‌شود." />
      <Card>
        <PlanForm profile={u.user} plan={plan} defaults={defaultPlan(plan.startWeight, u.user.gender)} />
      </Card>
    </div>
  );
}
