"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState, ErrorState, SkeletonBlock } from "@/components/portal/PortalStates";
import { listAppointmentsForDoctor } from "@/lib/data/appointments";
import { saveClinicAppointment } from "@/lib/clinic-db";
import type { Appointment } from "@/lib/data/types";

export default function StaffLandingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setAppointments(await listAppointmentsForDoctor("Dr. Arjun Mehta"));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function checkIn(item: Appointment) {
    const updated = { ...item, status: "Confirmed" as const };
    await saveClinicAppointment(updated, item.id || `appointment-${Date.now()}`);
    setAppointments((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
  }

  const seen = appointments.filter((item) => item.status === "Completed").length;
  const noShows = appointments.filter((item) => item.status === "No-show").length;

  return (
    <main>
      <PageHeader eyebrow="Staff portal" title="Today" description="Run the clinic session from one focused schedule." action={<Link href="/staff/patients" className="min-h-11 rounded-[6px] bg-clinic-800 px-4 py-2 font-semibold text-white">Patients</Link>} />
      {loading ? <div className="mt-6 grid gap-4 md:grid-cols-4"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div> : error ? <div className="mt-6"><ErrorState message="Today's schedule could not be loaded." retry={() => void load()} /></div> : (
        <section data-tour="today-schedule">
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[["Booked", appointments.length], ["Seen", seen], ["Remaining", appointments.length - seen - noShows], ["No-shows", noShows]].map(([label, value]) => <div key={String(label)} className="rounded-[12px] border border-border bg-surface p-5"><p className="text-sm text-ink-500">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-ink-900">{value}</p></div>)}
          </div>
          <section className="mt-8 rounded-[12px] border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl font-semibold text-ink-900">Today&apos;s timeline</h2>
            {appointments.length === 0 ? <div className="mt-4"><EmptyState title="No bookings today" description="Your schedule is clear. New patient bookings will appear here after confirmation." /></div> : (
              <div className="mt-5 space-y-3">
                {appointments.map((item, index) => (
                  <article key={item.id} className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface-warm p-4 md:flex-row md:items-center md:justify-between" data-tour={index === 0 ? "open-scheduled-patient" : undefined}>
                    <div>
                      <p className="font-semibold tabular-nums text-ink-900">{item.time} · {item.patientName}</p>
                      <p className="mt-1 text-sm text-ink-700">{item.reason} · {item.specialty}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-clinic-100 px-3 py-1 text-xs font-semibold text-clinic-800">{item.status}</span>
                      <button type="button" onClick={() => void checkIn(item)} className="min-h-11 rounded-[6px] border border-clinic-800 px-3 py-2 text-sm font-semibold text-clinic-800">Check in</button>
                      <Link href={`/staff/patients?record=${encodeURIComponent(item.patientEmail)}`} className="inline-flex min-h-11 items-center rounded-[6px] bg-clinic-800 px-3 py-2 text-sm font-semibold text-white">Open record</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
