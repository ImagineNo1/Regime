import { FoodBank } from "@/components/FoodBank";
import { PageHeader } from "@/components/ui";
import { getFoods, requireUser } from "@/lib/data";

export default async function FoodsPage() {
  const u = await requireUser();
  const foods = await getFoods(u._id);
  foods.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  return (
    <div className="space-y-6">
      <PageHeader
        title="بانک غذا"
        subtitle="مقادیر تقریبی‌اند. برای «گرم» کالری در ۱۰۰ گرم است؛ برای «قاشق» (قاشق غذاخوری پر)، «عدد»، «لیوان» و «فنجان» کالری هر واحد."
      />
      <FoodBank foods={foods} />
    </div>
  );
}
