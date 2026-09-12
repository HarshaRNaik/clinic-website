import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export function PortalShell({
  title,
  eyebrow,
  subtitle,
  navItems,
  children,
  actions
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
  navItems: NavItem[];
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>

          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  item.active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mt-4 text-slate-600">{subtitle}</p>
        </header>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
