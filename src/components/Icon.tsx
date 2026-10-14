const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  plus: "M12 5v14M5 12h14",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14",
  apple: "M12 7c-1-3 1-5 3-5 0 2-1 4-3 5zm0 0c-3-2-8-1-8 5 0 5 3 9 5 9 1.5 0 2-1 3-1s1.5 1 3 1c2 0 5-4 5-9 0-6-5-7-8-5z",
  run: "M13 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0M5 21l4-7 3 2v5M9 14l2-6 5 3 3-1M11 8 8 9l-2 3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  chevR: "M9 6l6 6-6 6",
  chevL: "M15 6l-6 6 6 6",
  scale: "M5 7h14l-2 13H7zM9 7a3 3 0 0 1 6 0",
  flame: "M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 0 3 1 4 3 5 0-4-1-6 0-9z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  copy: "M8 8h12v12H8zM4 16V4h12",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  check: "M5 12l5 5L20 7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4-4",
  menu: "M4 6h16M4 12h16M4 18h16",
};

export function Icon({ name, size = 20, className = "" }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
