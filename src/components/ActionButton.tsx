"use client";

import { useTransition } from "react";
import { Icon } from "./Icon";

/** دکمه کوچک برای اجرای یک server action بدون فرم (حذف، کپی…) */
export function ActionButton({
  run,
  icon,
  label,
  confirmText,
  className = "",
  children,
}: {
  run: () => Promise<void>;
  icon?: string;
  label: string;
  confirmText?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(() => run());
      }}
      className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-50 ${className}`}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
