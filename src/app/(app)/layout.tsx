import { BottomNav, Sidebar } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="lg:pr-60">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
