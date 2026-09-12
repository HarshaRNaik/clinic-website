"use client";

import { useEffect, useState } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-care-700">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink-900">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-ink-700">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-surface-warm p-8 text-center">
      <h2 className="font-serif text-xl font-semibold text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-ink-700">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-[6px] border border-danger bg-red-50 p-4 text-danger" role="alert">
      <p>{message}</p>
      {retry ? (
        <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-[6px] border border-danger px-3 py-2 font-semibold">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function SkeletonBlock({ className = "h-24" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[6px] bg-surface-warm ${className}`} aria-label="Loading" />;
}

export function NotFoundState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <section className="w-full max-w-lg rounded-[8px] border border-border bg-surface p-8 shadow-[0_10px_30px_rgba(11,46,43,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500">404</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-3 text-ink-700">This page is not available for the signed-in account.</p>
      </section>
    </main>
  );
}

export function ConnectionBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="border-b border-warning bg-marigold-100 px-4 py-3 text-sm font-semibold text-warning" role="status">
      Connection lost. Changes may not save until the network is back.
    </div>
  );
}

export function ToastHost() {
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[min(100%-2rem,360px)] flex-col gap-2 md:bottom-4" aria-live="polite" aria-atomic="true" />
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 p-4" role="presentation">
      <section className="w-full max-w-md rounded-[8px] border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(11,46,43,0.24)]" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 id="confirm-dialog-title" className="font-serif text-2xl font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 text-ink-700">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-[6px] border border-border px-4 py-2 font-semibold text-ink-700">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-[6px] bg-danger px-4 py-2 font-semibold text-white">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
