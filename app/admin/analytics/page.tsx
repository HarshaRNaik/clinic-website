"use client";

import { useEffect, useState } from "react";
import { getOperationalAnalytics } from "@/lib/data/analytics";

type Analytics = Awaited<ReturnType<typeof getOperationalAnalytics>>;

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getOperationalAnalytics().then(setAnalytics).catch(() => setError(true));
  }, []);

  return (
    <main className="py-8">
      <section className="rounded-[10px] border border-border bg-surface p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Admin analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink-900">Operational overview</h1>
        <p className="mt-2 max-w-prose text-ink-700">Aggregate appointment activity for the selected stored dataset. No patient names or patient IDs are displayed.</p>

        {error ? (
          <div className="mt-6 rounded-[6px] border border-red-200 bg-red-50 p-4 text-danger" role="alert">Analytics could not be loaded. Retry by refreshing this page.</div>
        ) : !analytics ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Loading analytics">
            {["one", "two", "three"].map((item) => <div key={item} className="h-24 animate-pulse rounded-[6px] bg-subtle" />)}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[6px] border border-border bg-subtle p-5"><p className="text-sm text-ink-500">Appointments in stored range</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink-900">{analytics.totalAppointments}</p></div>
              {analytics.byStatus.slice(0, 2).map((item) => <div key={item.status} className="rounded-[6px] border border-border bg-subtle p-5"><p className="text-sm text-ink-500">{item.status}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink-900">{item.count}</p></div>)}
            </div>
            <div className="mt-8 rounded-[6px] border border-border">
              <div className="border-b border-border bg-subtle px-5 py-4"><h2 className="font-semibold text-ink-900">Appointments by doctor</h2><p className="mt-1 text-sm text-ink-500">Counts are aggregate operational data; cells under five are suppressed.</p></div>
              <div className="divide-y divide-border">
                {analytics.byDoctor.length === 0 ? <p className="p-5 text-ink-700">No aggregate data is available yet.</p> : analytics.byDoctor.map((item) => <div key={item.doctor} className="flex items-center justify-between px-5 py-4"><span className="text-ink-700">{item.doctor}</span><span className="tabular-nums text-ink-900">{item.count < 5 ? "Suppressed" : item.count}</span></div>)}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
