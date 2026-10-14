import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// آدرس ریدایرکت از هدر Host خود درخواست ساخته می‌شود؛ وگرنه در حالت standalone
// یا پشت ریورس‌پراکسی ممکن است به localhost فرستاده شوید.
function go(req: NextRequest, path: string) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? req.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL(path, `${proto}://${host}`));
}

export async function middleware(req: NextRequest) {
  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = req.nextUrl.pathname === "/login";
  if (!ok && !isLogin) return go(req, "/login");
  if (ok && isLogin) return go(req, "/");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
