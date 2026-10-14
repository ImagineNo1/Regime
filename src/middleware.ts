import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth";

// آدرس ریدایرکت از هدر Host خود درخواست ساخته می‌شود؛ وگرنه در حالت standalone
// یا پشت ریورس‌پراکسی ممکن است به localhost فرستاده شوید.
function go(req: NextRequest, path: string) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? req.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL(path, `${proto}://${host}`));
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/auth/clear") return NextResponse.next();
  // فقط امضای کوکی بررسی می‌شود؛ وجود کاربر و نسخه نشست در خود صفحه‌ها (requireUser) چک می‌شود
  const ok = !!(await readSession(req.cookies.get(SESSION_COOKIE)?.value));
  const isPublic = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup";
  if (!ok && !isPublic) return go(req, "/login");
  if (ok && isPublic) return go(req, "/");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
