import { ActivityBank } from "@/components/ActivityBank";
import { PageHeader } from "@/components/ui";
import { getActivities } from "@/lib/data";

export default async function ActivitiesPage() {
  const acts = await getActivities();
  acts.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  return (
    <div className="space-y-6">
      <PageHeader
        title="بانک فعالیت"
        subtitle="MET یا «معادل متابولیک» یعنی شدت فعالیت نسبت به حالت استراحت (منبع: Compendium of Physical Activities). مدت همه فعالیت‌ها به دقیقه ثبت می‌شود."
      />
      <ActivityBank acts={acts} />
    </div>
  );
}
