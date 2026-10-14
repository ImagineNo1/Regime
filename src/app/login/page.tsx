import { LoginForm } from "./LoginForm";

export const metadata = { title: "ورود | رژیم من" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--brand), transparent)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand text-brand-ink shadow-card">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 0 3 1 4 3 5 0-4-1-6 0-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold">رژیم من</h1>
          <p className="mt-1 text-sm text-ink-2">برای ادامه وارد شوید</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
