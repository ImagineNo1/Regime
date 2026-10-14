// تبدیل تاریخ میلادی ↔ شمسی و کار با «روز» به شکل رشته ISO (YYYY-MM-DD)
// همه روزها در دیتابیس به صورت ISO میلادی ذخیره می‌شوند و فقط در نمایش شمسی می‌شوند.

export const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
// ترتیب getUTCDay: یکشنبه = ۰
export const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

export function g2j(gy: number, gm: number, gd: number): [number, number, number] {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? 1 + (days % 31) : 1 + ((days - 186) % 30);
  return [jy, jm, jd];
}

export function j2g(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days =
    -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal[gm]; gm++) gd -= sal[gm];
  return [gy, gm, gd];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isoFromParts(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

export function isValidIso(iso: unknown): iso is string {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = parseIso(iso);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(iso: string, n: number) {
  const [y, m, d] = parseIso(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return isoFromParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function diffDays(a: string, b: string) {
  const [ay, am, ad] = parseIso(a);
  const [by, bm, bd] = parseIso(b);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

/** امروز به وقت تهران */
export function todayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA => YYYY-MM-DD
}

export function toJalali(iso: string) {
  const [y, m, d] = parseIso(iso);
  return g2j(y, m, d);
}

export function weekday(iso: string) {
  const [y, m, d] = parseIso(iso);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

const fa = (n: number | string) => String(n).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]);

/** ۱۴۰۵/۰۷/۲۲ */
export function jNumeric(iso: string) {
  const [y, m, d] = toJalali(iso);
  return fa(`${y}/${pad(m)}/${pad(d)}`);
}

/** ۲۲ مهر */
export function jShort(iso: string) {
  const [, m, d] = toJalali(iso);
  return `${fa(d)} ${MONTHS[m - 1]}`;
}

/** ۰۷/۲۲ برای محور نمودار */
export function jAxis(iso: string) {
  const [, m, d] = toJalali(iso);
  return fa(`${pad(m)}/${pad(d)}`);
}

/** چهارشنبه ۲۲ مهر ۱۴۰۵ */
export function jLong(iso: string) {
  const [y, m, d] = toJalali(iso);
  return `${weekday(iso)} ${fa(d)} ${MONTHS[m - 1]} ${fa(y)}`;
}

/** مهر ۱۴۰۵ */
export function jMonthLabel(jy: number, jm: number) {
  return `${MONTHS[jm - 1]} ${fa(jy)}`;
}

/** «1405/07/22» یا «۱۴۰۵/۷/۲۲» → ISO میلادی؛ اگر نامعتبر بود null */
export function jalaliTextToIso(text: string): string | null {
  const t = text
    .trim()
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
  const m = t.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (!m) return null;
  const jy = Number(m[1]), jm = Number(m[2]), jd = Number(m[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > (jm <= 6 ? 31 : 30)) return null;
  const [gy, gm, gd] = j2g(jy, jm, jd);
  const iso = isoFromParts(gy, gm, gd);
  // رد تاریخ‌هایی مثل ۳۰ اسفند در سال غیرکبیسه
  const [ry, rm, rd] = toJalali(iso);
  if (ry !== jy || rm !== jm || rd !== jd) return null;
  return iso;
}

export function isoToJalaliText(iso: string) {
  const [y, m, d] = toJalali(iso);
  return `${y}/${pad(m)}/${pad(d)}`;
}
