import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 16384, r = 8, p = 1, LEN = 64;

/** scrypt$N$r$p$salt$hash */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, LEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string | undefined) {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, salt, hash] = parts;
  const expected = Buffer.from(hash, "base64");
  const got = await scrypt(pw, Buffer.from(salt, "base64"), expected.length, { N: +n, r: +rr, p: +pp });
  return got.length === expected.length && timingSafeEqual(got, expected);
}
