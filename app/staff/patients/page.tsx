"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, ErrorState, SkeletonBlock } from "@/components/portal/PortalStates";
import { listAppointmentsForDoctor } from "@/lib/data/appointments";
import { readClinicData, saveClinicProfile } from "@/lib/clinic-db";
import { isValidPatientId } from "@/lib/security/patient-id";
import { DEMO_DOCTOR_NAME, DEMO_PATIENT_ID } from "@/lib/prototype-mode";
import { DoctorReviewPanel } from "@/components/demo/DoctorReviewPanel";
import type { Appointment } from "@/lib/data/types";

type Visit = {
  id: string;
  date: string;
  doctor: string;
  summary: string;
  prescription: string;
  vitals: { bp: string; pulse: number; tempF: number };
};

export default function StaffPatientsPage() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [confirming, setConfirming] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    listAppointmentsForDoctor(DEMO_DOCTOR_NAME).then(setAppointments).catch(() => setError("Appointments could not be loaded.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const record = searchParams.get("record");
    if (!record) return;
    const email = record === "riya" ? "patient@clinic.com" : record;
    void openProfile(email);
  }, [searchParams]);

  const scoped = appointments.filter((item) => item.patientName.toLowerCase().includes(query.toLowerCase()));
  const appointmentEmails = useMemo(() => new Set(appointments.map((item) => item.patientEmail)), [appointments]);
  const visits = (profile?.visits || []) as Visit[];
  const allergies = (profile?.allergies || []) as string[];

  async function openProfile(email: string) {
    if (!appointmentEmails.has(email) && email !== "patient@clinic.com") {
      setError("The patient record could not be opened.");
      return;
    }
    const record = await readClinicData<Record<string, unknown>>("profiles", email);
    if (record) {
      const updated = { ...record, openedBy: DEMO_DOCTOR_NAME };
      await saveClinicProfile(updated, String(record.email || email));
      setProfile(updated);
      setError("");
    }
  }

  async function lookupById() {
    if (!isValidPatientId(patientId) || confirming.length < 4 || patientId !== DEMO_PATIENT_ID) {
      setError("The patient record could not be opened.");
      return;
    }
    await openProfile("patient@clinic.com");
  }

  return (
    <main>
      <PageHeader eyebrow="Staff portal" title="Patient access" description="Use one of the two approved access routes. Search never reaches the full patient database." />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[12px] border border-border bg-surface p-6">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Search within my appointments</h2>
          <p className="mt-2 text-sm text-ink-700">Only today and the configured access window are included.</p>
          <div className="mt-5">
            <label htmlFor="appointmentPatientSearch" className="block text-sm font-medium text-ink-700">Patient name</label>
            <input id="appointmentPatientSearch" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Patient name" className="mt-1.5 w-full rounded-[6px] border border-border px-3" />
          </div>
          {loading ? <SkeletonBlock className="mt-4 h-24" /> : error && !profile ? <div className="mt-4"><ErrorState message={error} /></div> : scoped.length ? (
            <div className="mt-4 space-y-2">
              {scoped.map((item) => <button key={item.id} type="button" onClick={() => void openProfile(item.patientEmail)} className="block w-full rounded-[6px] bg-surface-warm p-3 text-left"><p className="font-semibold text-ink-900">{item.patientName}</p><p className="text-sm text-ink-700">{item.date} at {item.time} · {item.reason}</p></button>)}
            </div>
          ) : <div className="mt-4"><EmptyState title="No matching appointment" description="Name search is limited to your appointment schedule." /></div>}
        </section>

        <section className="rounded-[12px] border border-border bg-surface p-6" data-tour="patient-id-lookup">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Look up by patient ID</h2>
          <p className="mt-2 text-sm text-ink-700">Enter the exact ID and one confirming detail. Invalid and unknown IDs use the same response.</p>
          <div className="mt-5">
            <label htmlFor="patientIdLookup" className="block text-sm font-medium text-ink-700">Exact patient ID</label>
            <input id="patientIdLookup" value={patientId} onChange={(event) => setPatientId(event.target.value.toUpperCase())} placeholder={DEMO_PATIENT_ID} className="mt-1.5 w-full rounded-[6px] border border-border px-3 font-mono" />
          </div>
          <div className="mt-3">
            <label htmlFor="patientConfirmingDetail" className="block text-sm font-medium text-ink-700">DOB or last 4 mobile digits</label>
            <input id="patientConfirmingDetail" value={confirming} onChange={(event) => setConfirming(event.target.value)} placeholder="DOB or last 4 mobile digits" className="mt-1.5 w-full rounded-[6px] border border-border px-3" />
          </div>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <button type="button" onClick={() => void lookupById()} className="mt-4 min-h-11 rounded-[6px] bg-clinic-800 px-4 py-2 font-semibold text-white">Open record</button>
          <button type="button" className="mt-6 block text-sm font-semibold text-danger underline">Break-glass access</button>
        </section>
      </div>

      {profile ? (
        <section className="mt-6 space-y-6" data-tour="clinical-record">
          <div className="rounded-[12px] border border-border bg-surface p-6">
            <div className="rounded-[6px] border border-danger bg-red-50 p-4 text-danger" data-tour="allergy-banner"><strong>Allergy banner:</strong> {allergies.length ? allergies.join(", ") : "No allergies recorded."}</div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink-900">{String(profile.fullName)}</h2>
                <p className="mt-1 font-mono text-sm text-ink-500">{String(profile.id)}</p>
                <div className="mt-4 rounded-[6px] bg-surface-warm p-4" data-tour="vitals-trend">
                  <p className="text-sm font-semibold text-ink-900">Vitals trend</p>
                  <p className="mt-2 text-ink-700">{visits.map((visit) => `${visit.date}: ${visit.vitals.bp}, ${visit.vitals.tempF.toFixed(1)}F`).join(" | ")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {visits.slice(0, 4).map((visit) => <article key={visit.id} className="rounded-[6px] border border-border p-3"><p className="font-semibold text-ink-900">{visit.date} · {visit.doctor}</p><p className="mt-1 text-sm text-ink-700">{visit.summary}</p></article>)}
              </div>
            </div>
          </div>
          <div data-tour="consultation-panel">
            <DoctorReviewPanel />
          </div>
        </section>
      ) : null}
    </main>
  );
}
