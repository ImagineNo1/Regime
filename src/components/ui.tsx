import { Icon } from "./Icon";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  pad = true,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            {title && <h2 className="font-bold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  icon?: string;
  tone?: "default" | "good" | "bad" | "warn" | "brand";
}) {
  const toneCls = {
    default: "bg-surface-2 text-ink-2",
    good: "bg-good-soft text-good",
    bad: "bg-bad-soft text-bad",
    warn: "bg-warn-soft text-warn",
    brand: "bg-brand-soft text-brand",
  }[tone];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        {icon && (
          <span className={`grid size-8 place-items-center rounded-lg ${toneCls}`}>
            <Icon name={icon} size={17} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-2xl font-extrabold">{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "good" | "bad" | "warn" | "muted" | "brand"; children: React.ReactNode }) {
  const cls = {
    good: "bg-good-soft text-good",
    bad: "bg-bad-soft text-bad",
    warn: "bg-warn-soft text-warn",
    muted: "bg-surface-2 text-muted",
    brand: "bg-brand-soft text-brand",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</div>;
}
