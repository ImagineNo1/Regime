import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/** کوکی نشست نامعتبر (کاربر حذف شده یا رمز عوض شده) را پاک می‌کند و به صفحه ورود می‌برد */
export function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? req.nextUrl.protocol.replace(":", "");
  const res = NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
