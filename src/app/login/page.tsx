import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ورود | رژیم من" };

export default function LoginPage() {
  const signup = process.env.ALLOW_SIGNUP !== "false";
  return (
    <AuthShell title="رژیم من" subtitle="برای ادامه وارد شوید">
      <LoginForm />
      {signup && (
        <p className="mt-5 text-center text-sm text-ink-2">
          حساب ندارید؟{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            ثبت‌نام کنید
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
