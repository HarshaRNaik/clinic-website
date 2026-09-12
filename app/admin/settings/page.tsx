const settings = [
  "Retention windows",
  "Data export and erasure",
  "Break-glass access",
  "Feature flags",
  "Audit thresholds"
];

export default function AdminSettingsPage() {
  return (
    <main className="py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin settings</h1>
        <div className="mt-6 space-y-3">
          {settings.map((label) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800">
              {label}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
