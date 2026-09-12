"use client";

import { useEffect, useState } from "react";
import { PageHeader, EmptyState, ErrorState, SkeletonBlock } from "@/components/portal/PortalStates";
import { listAppointmentsForPatient } from "@/lib/data/appointments";
import { saveClinicAppointment } from "@/lib/clinic-db";
import { readClinicSession } from "@/lib/clinic-auth";
import type { Appointment } from "@/lib/data/types";

export default function PatientAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const session = readClinicSession();
    if (!session) return;
    listAppointmentsForPatient(session.email).then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  async function updateStatus(item: Appointment, status: Appointment["status"]) {
    const updated = { ...item, status };
    await saveClinicAppointment(updated, item.id || `appointment-${Date.now()}`);
    setItems((current) => current.map((candidate) => candidate.id === item.id ? updated : candidate));
  }

  const upcoming = items.filter((item) => item.status !== "Completed" && item.status !== "Cancelled");
  const past = items.filter((item) => item.status === "Completed" || item.status === "Cancelled");

  return (
    <main>
      <PageHeader eyebrow="Patient portal" title="Appointments" description="Review your upcoming and past clinic visits." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section data-tour="appointment-actions">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Upcoming</h2>
          {loading ? <SkeletonBlock className="mt-4 h-32" /> : error ? <ErrorState message="Appointments could not be loaded." /> : upcoming.length === 0 ? <div className="mt-4"><EmptyState title="No upcoming appointments" description="Book a visit when you are ready." action={<a href="/patient/book" className="inline-flex min-h-11 items-center rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white">Book appointment</a>} /></div> : (
            <div className="mt-4 space-y-3">
              {upcoming.map((item) => <AppointmentCard key={item.id} item={item} onCancel={() => void updateStatus(item, "Cancelled")} onReschedule={() => void updateStatus({ ...item, time: "15:30" }, item.status)} />)}
            </div>
          )}
        </section>
        <section>
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Past</h2>
          <div className="mt-4 space-y-3">{past.map((item) => <AppointmentCard key={item.id} item={item} />)}</div>
        </section>
      </div>
    </main>
  );
}

function AppointmentCard({ item, onCancel, onReschedule }: { item: Appointment; onCancel?: () => void; onReschedule?: () => void }) {
  return (
    <article className="rounded-[12px] border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(11,46,43,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">{item.doctor}</h3>
          <p className="text-sm text-ink-700">{item.specialty}</p>
        </div>
        <span className="rounded-full bg-care-100 px-3 py-1 text-xs font-semibold text-care-700">{item.status}</span>
      </div>
      <p className="mt-4 tabular-nums text-ink-700">{item.date} at {item.time}</p>
      <p className="mt-2 text-sm text-ink-500">{item.reason}</p>
      {onCancel || onReschedule ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onReschedule} className="min-h-11 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold text-ink-700">Reschedule to 3:30 PM</button>
          <button type="button" onClick={onCancel} className="min-h-11 rounded-[6px] border border-danger px-3 py-2 text-sm font-semibold text-danger">Cancel with reason</button>
        </div>
      ) : null}
    </article>
  );
}
