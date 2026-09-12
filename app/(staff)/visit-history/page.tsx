"use client";

import { useState } from "react";
import { isValidPatientId } from "@/lib/security/patient-id";

const visits = [
  { date: "12 Sep 2026", doctor: "Dr. Arjun Mehta", complaint: "Follow-up consultation", diagnosis: "Recorded in structured note", vitals: "BP 122/80 • Weight 68 kg • Pulse 76", prescription: "Current course active", advice: "Review after follow-up" },
  { date: "18 Jun 2026", doctor: "Dr. Arjun Mehta", complaint: "General consultation", diagnosis: "Recorded in structured note", vitals: "BP 128/84 • Weight 69 kg • Pulse 79", prescription: "No repeat prescription", advice: "Return if symptoms persist" }
];

export default function VisitHistoryPage() {
  const [patientId, setPatientId] = useState("");
  const [confirmingDetail, setConfirmingDetail] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function openHistory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isValidPatientId(patientId) || confirmingDetail.trim().length < 4) {
      setError("The patient record could not be opened.");
      return;
    }
    setOpen(true);
  }

  return (
    <main className="py-8">
      <section className="rounded-[12px] border border-border bg-surface p-6 shadow-[0_8px_24px_rgba(11,46,43,0.08)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-clinic-800">Clinical record access</p><h1 className="mt-2 font-serif text-4xl font-semibold text-ink-900">Visit history</h1><p className="mt-2 text-ink-700">Open a record only through an appointment access window or exact patient ID plus one confirming detail.</p>
        <div className="mt-6 rounded-[6px] border border-danger bg-red-50 p-4 text-danger"><strong>Safety alert:</strong> allergies and chronic conditions must be reviewed before consultation.</div>
        {!open ? <form onSubmit={openHistory} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]"><div><label className="block text-sm font-medium text-ink-700">Exact patient ID</label><input value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="AC-XXXX-XXXX-XXXX-X" className="mt-1.5 min-h-11 w-full rounded-[6px] border border-border bg-surface-warm px-3 font-mono text-ink-900" /></div><div><label className="block text-sm font-medium text-ink-700">DOB or last 4 phone digits</label><input value={confirmingDetail} onChange={(event) => setConfirmingDetail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-[6px] border border-border bg-surface-warm px-3 text-ink-900" /></div><button type="submit" className="min-h-11 self-end rounded-[6px] bg-clinic-800 px-5 py-2 font-semibold text-white">Open record</button></form> : <div className="mt-6"><div className="rounded-[6px] border border-danger bg-red-50 p-4 text-danger"><strong>Allergies:</strong> None recorded in this demo record. <strong className="ml-4">Chronic conditions:</strong> None recorded in this demo record.</div><div className="mt-6 space-y-3">{visits.map((visit) => <details key={visit.date} className="rounded-[6px] border border-border bg-surface-warm p-4"><summary className="cursor-pointer font-semibold text-ink-900">{visit.date} • {visit.doctor} • {visit.complaint}</summary><div className="mt-4 grid gap-3 text-sm text-ink-700 md:grid-cols-2"><p><strong>Diagnosis:</strong> {visit.diagnosis}</p><p><strong>Vitals:</strong> {visit.vitals}</p><p><strong>Prescription:</strong> {visit.prescription}</p><p><strong>Advice:</strong> {visit.advice}</p><button type="button" className="min-h-11 w-fit rounded-[6px] border border-clinic-800 px-3 py-2 font-semibold text-clinic-800">View source note</button></div></details>)}</div></div>}
        {error ? <p className="mt-4 rounded-[6px] border border-danger bg-red-50 p-3 text-danger" role="alert">⚠ {error}</p> : null}
      </section>
    </main>
  );
}
