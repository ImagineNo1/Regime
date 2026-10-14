import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت‌نام | رژیم من" };

export default function SignupPage() {
  if (process.env.ALLOW_SIGNUP === "false") {
    return (
      <AuthShell title="ثبت‌نام بسته است" subtitle="فعلاً امکان ساختن حساب جدید نیست.">
        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-brand hover:underline">بازگشت به ورود</Link>
        </p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="ساختن حساب" subtitle="مشخصات بدن برای محاسبه کالری لازم است" wide>
      <SignupForm />
      <p className="mt-5 text-center text-sm text-ink-2">
        حساب دارید؟{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">وارد شوید</Link>
      </p>
    </AuthShell>
  );
}
