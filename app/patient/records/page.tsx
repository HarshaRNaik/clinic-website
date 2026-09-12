"use client";

import { useEffect, useState } from "react";
import { PageHeader, SkeletonBlock } from "@/components/portal/PortalStates";
import { readClinicSession } from "@/lib/clinic-auth";
import { readClinicData } from "@/lib/clinic-db";
import { prototypeMode } from "@/lib/prototype-mode";

type Visit = {
  id: string;
  date: string;
  doctor: string;
  summary: string;
  prescription: string;
  vitals: { bp: string; pulse: number; tempF: number };
};

export default function PatientRecordsPage() {
  const [stepUp, setStepUp] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const session = readClinicSession();
    if (!session) return;
    void readClinicData<Record<string, unknown>>("profiles", session.email).then(setProfile);
    const tourActive = window.localStorage.getItem("arogya-demo-tour-step") !== null;
    if (prototypeMode && tourActive && window.localStorage.getItem("arogya-demo-tour-role") === "patient") {
      setStepUp(true);
    }
  }, []);

  const visits = (profile?.visits || []) as Visit[];
  const allergies = (profile?.allergies || []) as string[];

  return (
    <main>
      <PageHeader eyebrow="Patient portal" title="My records" description="Your visit history, prescriptions, and reports in plain language." />
      {!stepUp ? (
        <section className="mt-6 rounded-[12px] border border-border bg-surface p-6">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Confirm it is you</h2>
          <p className="mt-2 text-ink-700">For your privacy, we need a fresh sign-in before showing clinical records.</p>
          <button type="button" onClick={() => setStepUp(true)} className="mt-5 min-h-11 rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white">Continue securely</button>
        </section>
      ) : (
        <section className="mt-6" data-tour="patient-records">
          <div className="rounded-[6px] border border-danger bg-red-50 p-4 text-danger">
            <strong>Safety information:</strong> {allergies.length ? allergies.join(", ") : "No allergies recorded."}
          </div>
          {!profile ? <SkeletonBlock className="mt-6 h-40" /> : (
            <div className="mt-6 space-y-4">
              {visits.map((visit) => (
                <article key={visit.id} className="rounded-[12px] border border-border bg-surface p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-ink-900">{visit.date}</h2>
                      <p className="text-sm text-ink-500">{visit.doctor}</p>
                    </div>
                    <span className="rounded-full bg-care-100 px-3 py-1 text-xs font-semibold text-care-700">{visit.vitals.bp} · Pulse {visit.vitals.pulse}</span>
                  </div>
                  <p className="mt-4 text-ink-700">{visit.summary}</p>
                  <p className="mt-2 text-sm text-ink-600"><strong>Prescription:</strong> {visit.prescription}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
