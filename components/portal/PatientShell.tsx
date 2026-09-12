"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearClinicSession, readClinicSession, type ClinicUser } from "@/lib/clinic-auth";
import { NoticeCenter } from "@/components/patient/NoticeCenter";
import { ConnectionBanner, NotFoundState, SkeletonBlock, ToastHost } from "@/components/portal/PortalStates";
import { PrototypeTour } from "@/components/demo/PrototypeTour";
import { seedPrototypeData } from "@/lib/prototype-seed";

const authRoutes = new Set(["/patient/login", "/patient/register"]);
const tabs = [
  { href: "/patient", label: "Home" },
  { href: "/patient/book", label: "Book" },
  { href: "/patient/records", label: "Records" },
  { href: "/patient/profile", label: "Profile" }
];

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ClinicUser | null>(null);
  const [checked, setChecked] = useState(false);
  const authPage = authRoutes.has(pathname);

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

      if (!current && !authPage) {
        router.replace("/patient/login");
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [authPage, pathname, router]);

  function signOut() {
    clearClinicSession();
    setSession(null);
    router.replace("/");
  }

  if (authPage) return <>{children}</>;

  if (!checked || !session) {
    return (
      <div className="min-h-screen bg-page p-4">
        <SkeletonBlock className="mx-auto mt-8 h-32 max-w-7xl" />
      </div>
    );
  }

  if (session.role !== "patient") {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen bg-page pb-16 md:pb-0">
      <ConnectionBanner />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/patient" className="font-serif text-xl font-semibold text-ink-900">
            Arogya Chikitsalaya
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <NoticeCenter email={session.email} />
            <span className="hidden max-w-52 truncate rounded-full bg-care-100 px-3 py-2 text-sm font-medium text-ink-900 sm:inline">
              {session.email}
            </span>
            <button type="button" onClick={signOut} className="min-h-11 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold text-ink-700">
              Not you? Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-7xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface md:hidden" aria-label="Patient">
        <div className="grid grid-cols-4 text-center text-xs font-semibold text-ink-700">
          {tabs.map((tab) => (
            <Link key={tab.href} className="min-h-14 px-2 py-4" href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
      <ToastHost />
      <PrototypeTour />
    </div>
  );
}
