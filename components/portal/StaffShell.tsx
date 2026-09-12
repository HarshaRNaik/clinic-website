"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearClinicSession, readClinicSession, type ClinicUser } from "@/lib/clinic-auth";
import { ConnectionBanner, NotFoundState, SkeletonBlock, ToastHost } from "@/components/portal/PortalStates";
import { PrototypeTour } from "@/components/demo/PrototypeTour";
import { seedPrototypeData } from "@/lib/prototype-seed";

const demoRouteEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const staffLinks = [
  { href: "/staff", label: "Today" },
  { href: "/staff/patients", label: "Patients" },
  { href: "/staff/schedule", label: "Schedule" }
];

const adminLinks = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/staff", label: "Staff" }
];

export function StaffShell({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ClinicUser | null>(null);
  const [checked, setChecked] = useState(false);
  const publicRoute = pathname === "/staff/login" || (demoRouteEnabled && pathname === "/staff/demo");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      await seedPrototypeData();

      if (!active) {
        return;
      }

      const current = readClinicSession();
      setSession(current);
      setChecked(true);

      if (!current && !publicRoute) {
        router.replace("/staff/login");
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [pathname, publicRoute, router]);

  function signOut() {
    clearClinicSession();
    setSession(null);
    router.replace("/");
  }

  if (publicRoute) return <>{children}</>;

  if (!checked || !session) {
    return (
      <div className="min-h-screen bg-page p-4">
        <SkeletonBlock className="mx-auto mt-8 h-32 max-w-7xl" />
      </div>
    );
  }

  if (session.role === "patient" || (adminOnly && session.role !== "admin")) {
    return <NotFoundState />;
  }

  const isAdmin = session.role === "admin";

  return (
    <div className="min-h-screen bg-page md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-screen bg-clinic-800 p-5 text-white md:block">
        <Link href="/staff" className="font-serif text-xl font-semibold">
          Arogya Chikitsalaya
        </Link>
        <nav className="mt-10 space-y-2" aria-label="Staff">
          {staffLinks.map((link) => (
            <Link key={link.href} className="block rounded-[6px] px-3 py-3 text-clinic-100 hover:bg-clinic-600" href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <div className="pt-6">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-clinic-100">Admin</p>
              <div className="mt-2 space-y-2">
                {adminLinks.map((link) => (
                  <Link key={link.href} className="block rounded-[6px] px-3 py-3 text-clinic-100 hover:bg-clinic-600" href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </nav>
      </aside>
      <div className="min-w-0">
        <ConnectionBanner />
        <header className="border-b border-border bg-surface">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clinic-800">{isAdmin ? "Admin portal" : "Staff portal"}</p>
              <p className="truncate font-semibold text-ink-900">{session.email}</p>
            </div>
            <button type="button" onClick={signOut} className="min-h-11 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold text-ink-700">
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
      <ToastHost />
      <PrototypeTour />
    </div>
  );
}
