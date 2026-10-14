const nf0 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** عدد صحیح با ارقام فارسی و جداکننده هزارگان */
export function n0(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return nf0.format(Math.round(v));
}

/** یک رقم اعشار */
export function n1(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return nf1.format(v);
}

/** با علامت مثبت/منفی؛ برای تراز کالری */
export function signed(v: number | null | undefined, digits: 0 | 1 = 0) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const s = digits ? n1(Math.abs(v)) : n0(Math.abs(v));
  if (Math.round(v * (digits ? 10 : 1)) === 0) return s;
  // LRI…PDI: عدد علامت‌دار در متن راست‌به‌چپ جابه‌جا نشود
  return "\u2066" + (v > 0 ? "+" : "−") + s + "\u2069";
}

export function pct(v: number) {
  return `${n0(v * 100)}٪`;
}

/** ورودی کاربر (ارقام فارسی/عربی، ممیز فارسی) → عدد */
export function parseNum(v: FormDataEntryValue | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v)
    .trim()
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/[٫,،]/g, ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
