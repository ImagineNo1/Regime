"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* پالت: نقش هر رنگ در همه نمودارها ثابت است */
const LIGHT = {
  intake: "#2a78d6",
  goal: "#eb6834",
  burned: "#64748b",
  deficit: "#1baf7a",
  surplus: "#e34948",
  weight: "#6250d6",
  protein: "#6250d6",
  exercise: "#eda100",
  meals: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
  grid: "#e6ebe9",
  axis: "#8a9894",
  surface: "#ffffff",
};
const DARK: typeof LIGHT = {
  intake: "#3987e5",
  goal: "#d95926",
  burned: "#94a3b8",
  deficit: "#199e70",
  surplus: "#e66767",
  weight: "#9085e9",
  protein: "#9085e9",
  exercise: "#c98500",
  meals: ["#3987e5", "#d95926", "#199e70", "#c98500"],
  grid: "#27312f",
  axis: "#7b8a86",
  surface: "#151b1a",
};
export type Palette = typeof LIGHT;
export type ColorKey = Exclude<keyof Palette, "meals" | "grid" | "axis" | "surface">;

function usePalette() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return dark ? DARK : LIGHT;
}

const faNum = (v: number, digits = 0) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v);

type Row = Record<string, string | number | null>;

interface TipProps {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string; dataKey?: string | number }[];
  label?: string | number;
  unit: string;
  digits: number;
}

function Tip({ active, payload, label, unit, digits }: TipProps) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value !== null && p.value !== undefined);
  return (
    <div dir="rtl" className="min-w-36 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1.5 font-bold text-ink">{label}</div>
      {items.length === 0 && <div className="text-muted">داده‌ای ثبت نشده</div>}
      {items.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="tnum font-semibold text-ink">
            {faNum(Number(p.value), digits)} <span className="font-normal text-muted">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendText({ value }: { value: string }) {
  return <span style={{ color: "var(--ink-2)", fontSize: 12, marginInlineStart: 4 }}>{value}</span>;
}

const axisProps = (p: Palette) => ({
  tick: { fill: p.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
});

function Frame({ height, children }: { height: number; children: React.ReactElement }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export interface SeriesSpec {
  key: string;
  name: string;
  color: ColorKey;
  dashed?: boolean;
  dots?: boolean;
}

/** ستون + خط (مثلاً دریافتی ستونی، هدف و سوزانده خطی) */
export function ComboChart({
  data,
  x,
  bars = [],
  lines = [],
  unit,
  height = 280,
  digits = 0,
  zeroBased = true,
}: {
  data: Row[];
  x: string;
  bars?: SeriesSpec[];
  lines?: SeriesSpec[];
  unit: string;
  height?: number;
  digits?: number;
  zeroBased?: boolean;
}) {
  const p = usePalette();
  const showLegend = bars.length + lines.length > 1;
  return (
    <Frame height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={p.grid} />
        <XAxis dataKey={x} {...axisProps(p)} interval="preserveStartEnd" minTickGap={14} />
        <YAxis
          {...axisProps(p)}
          width={44}
          tickFormatter={(v) => faNum(v, digits)}
          domain={zeroBased ? [0, "auto"] : ["dataMin - 1", "dataMax + 1"]}
          allowDecimals={digits > 0}
        />
        <Tooltip content={<Tip unit={unit} digits={digits} />} cursor={{ fill: p.grid, opacity: 0.5 }} />
        {showLegend && <Legend formatter={(v) => <LegendText value={v} />} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 6 }} />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={p[b.color]} radius={[4, 4, 0, 0]} maxBarSize={34} />
        ))}
        {lines.map((l) => (
          <Line
            key={l.key}
            dataKey={l.key}
            name={l.name}
            stroke={p[l.color]}
            strokeWidth={2}
            strokeDasharray={l.dashed ? "6 5" : undefined}
            dot={l.dots ? { r: 3.5, fill: p[l.color], stroke: p.surface, strokeWidth: 2 } : false}
            activeDot={{ r: 5, stroke: p.surface, strokeWidth: 2 }}
            connectNulls
            type="linear"
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </Frame>
  );
}

/** تراز کالری: منفی (کسری) سبز، مثبت (مازاد) قرمز */
export function BalanceChart({ data, x, k, height = 260 }: { data: Row[]; x: string; k: string; height?: number }) {
  const p = usePalette();
  // محور همیشه صفر را شامل شود و تیک‌ها عدد رُند باشند
  const vals = data.map((d) => d[k]).filter((v): v is number => typeof v === "number");
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const raw = (hi - lo || 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw)!;
  const ticks: number[] = [];
  for (let t = Math.floor(lo / step) * step; t <= Math.ceil(hi / step) * step + 1e-9; t += step) ticks.push(Math.round(t));
  return (
    <Frame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={p.grid} />
        <XAxis dataKey={x} {...axisProps(p)} interval="preserveStartEnd" minTickGap={14} />
        <YAxis
          {...axisProps(p)}
          width={56}
          tickFormatter={(v) => faNum(v)}
          domain={[ticks[0], ticks[ticks.length - 1]]}
          ticks={ticks}
        />
        <ReferenceLine y={0} stroke={p.axis} />
        <Tooltip content={<Tip unit="کیلوکالری" digits={0} />} cursor={{ fill: p.grid, opacity: 0.5 }} />
        <Bar dataKey={k} name="تراز" radius={4} maxBarSize={34}>
          {data.map((d, i) => (
            <Cell key={i} fill={Number(d[k]) < 0 ? p.deficit : p.surplus} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

/** وزن (نقطه‌ها + خط) و خط‌چین وزن هدف */
export function WeightChart({ data, x, height = 300, target }: { data: Row[]; x: string; height?: number; target: number }) {
  const p = usePalette();
  const vals = data.map((d) => d.weight).filter((v): v is number => typeof v === "number");
  const lo = Math.floor(Math.min(target, ...(vals.length ? vals : [target])) - 1);
  const hi = Math.ceil(Math.max(target, ...(vals.length ? vals : [target])) + 1);
  return (
    <Frame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={p.grid} />
        <XAxis dataKey={x} {...axisProps(p)} interval="preserveStartEnd" minTickGap={18} />
        <YAxis {...axisProps(p)} width={40} domain={[lo, hi]} tickFormatter={(v) => faNum(v)} allowDecimals={false} />
        <Tooltip content={<Tip unit="کیلوگرم" digits={1} />} />
        <Legend formatter={(v) => <LegendText value={v} />} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 6 }} />
        <ReferenceLine y={target} stroke={p.goal} strokeDasharray="6 5" strokeWidth={1.5} />
        <Line
          dataKey="weight"
          name="وزن صبح"
          stroke={p.weight}
          strokeWidth={2}
          dot={{ r: 3.5, fill: p.weight, stroke: p.surface, strokeWidth: 2 }}
          activeDot={{ r: 5.5, stroke: p.surface, strokeWidth: 2 }}
          connectNulls
          type="linear"
          isAnimationActive={false}
        />
        <Line dataKey="target" name="وزن هدف" stroke={p.goal} strokeDasharray="6 5" strokeWidth={0} dot={false} activeDot={false} legendType="plainline" />
      </LineChart>
    </Frame>
  );
}

/** دونات سهم وعده‌ها */
export function MealDonut({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  const p = usePalette();
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="grid h-40 place-items-center text-sm text-muted">هنوز داده‌ای نیست</div>;
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
      <Frame height={height}>
        <PieChart>
          <Tooltip content={<Tip unit="کیلوکالری" digits={0} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke={p.surface} strokeWidth={2} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={p.meals[i % p.meals.length]} />
            ))}
          </Pie>
        </PieChart>
      </Frame>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="inline-block size-3 rounded" style={{ background: p.meals[i % p.meals.length] }} />
              {d.name}
            </span>
            <span className="tnum font-semibold">
              {faNum(Math.round((d.value / total) * 100))}٪
              <span className="ms-2 text-xs font-normal text-muted">{faNum(d.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
