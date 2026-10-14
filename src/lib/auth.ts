import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const SESSION_COOKIE = "rezhim_session";
export const SESSION_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET در .env باید حداقل ۳۲ کاراکتر باشد");
  return new TextEncoder().encode(s);
}

/** sv = نسخه نشست کاربر؛ با تغییر رمز زیاد می‌شود تا نشست‌های قبلی باطل شوند */
export async function createSession(userId: string, sv: number) {
  return new SignJWT({ sub: userId, sv })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<{ userId: string; sv: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !/^[a-f0-9]{24}$/.test(payload.sub)) return null;
    return { userId: payload.sub, sv: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch {
    return null;
  }
}
