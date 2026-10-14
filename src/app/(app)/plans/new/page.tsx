import { PlanForm } from "@/components/PlanForm";
import { Card, PageHeader } from "@/components/ui";
import { getWeights, requireUser } from "@/lib/data";
import { defaultPlan } from "@/lib/plans";

export default async function NewPlanPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const u = await requireUser();
  const weights = await getWeights(u._id);
  return (
    <div className="space-y-6">
      <PageHeader
        title={welcome ? `خوش آمدید ${u.user.name}!` : "برنامه جدید"}
        subtitle={welcome ? "برای شروع، اولین برنامه‌تان را بسازید." : "هدف، بازه زمانی و سرعت را انتخاب کنید."}
      />
      <Card>
        <PlanForm profile={u.user} defaults={defaultPlan(weights.at(-1)?.kg ?? null, u.user.gender)} />
      </Card>
    </div>
  );
}
