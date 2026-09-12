"use client";

import { useEffect, useState } from "react";
import { PageHeader, ErrorState, SkeletonBlock } from "@/components/portal/PortalStates";
import { readClinicSession } from "@/lib/clinic-auth";
import { readClinicData } from "@/lib/clinic-db";

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readClinicSession();
    if (!session) return;
    readClinicData<Record<string, unknown>>("profiles", session.email).then(setProfile).finally(() => setLoading(false));
  }, []);

  function downloadData() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arogya-demo-patient-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <PageHeader eyebrow="Patient portal" title="Profile" description="Keep your contact information and preferences up to date." />
      {loading ? <SkeletonBlock className="mt-6 h-48" /> : profile ? (
        <section className="mt-6 rounded-[12px] border border-border bg-surface p-6" data-tour="patient-profile">
          <dl className="grid gap-5 md:grid-cols-2 text-ink-700">
            <div><dt className="text-sm text-ink-500">Full name</dt><dd className="font-semibold text-ink-900">{String(profile.fullName || "Not provided")}</dd></div>
            <div><dt className="text-sm text-ink-500">Patient ID</dt><dd className="font-mono font-semibold text-ink-900">{String(profile.id || "Not provided")}</dd></div>
            <div><dt className="text-sm text-ink-500">Mobile</dt><dd className="font-semibold text-ink-900">{String(profile.phone || "Not provided")}</dd></div>
            <div><dt className="text-sm text-ink-500">Email</dt><dd className="font-semibold text-ink-900">{String(profile.email || "Not provided")}</dd></div>
          </dl>
          <div className="mt-8 border-t border-border pt-5">
            <h2 className="font-serif text-xl font-semibold text-ink-900">Privacy</h2>
            <p className="mt-2 text-ink-700">Last record opened by: <strong>{String(profile.openedBy || "No doctor access recorded")}</strong></p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={downloadData} className="min-h-11 rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white">Download my data</button>
              <button type="button" className="min-h-11 rounded-[6px] border border-danger px-4 py-2 font-semibold text-danger">Request data deletion</button>
            </div>
          </div>
        </section>
      ) : <ErrorState message="Your profile could not be loaded." />}
    </main>
  );
}
