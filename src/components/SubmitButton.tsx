"use client";

import { useTransition, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pending: pendingProp,
}: {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || !!pendingProp;
  return (
    <button type="submit" disabled={busy} className={className}>
      {busy ? "در حال ذخیره…" : children}
    </button>
  );
}

/**
 * ارسال فرم بدون پاک شدن خودکار فیلدها (React 19 بعد از action فرم را ریست می‌کند؛
 * برای فرم‌های ویرایش نمی‌خواهیم با یک خطا همه تغییرات از دست برود).
 */
export function useKeepValuesSubmit(action: (fd: FormData) => void) {
  const [pending, start] = useTransition();
  return {
    pending,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(() => action(fd));
    },
  };
}
