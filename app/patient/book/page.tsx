"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, ErrorState, SkeletonBlock } from "@/components/portal/PortalStates";
import { listDoctors } from "@/lib/data/doctors";
import { createAppointment } from "@/lib/data/appointments";
import { readClinicSession } from "@/lib/clinic-auth";
import type { Doctor } from "@/lib/data/types";

export default function PatientBookPage() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState("all");
  const [step, setStep] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    try {
      const records = await listDoctors();
      setDoctors(records);
      setState(records.length ? "ready" : "empty");
    } catch {
      setState("error");
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!doctors.length) return;
    if (searchParams.get("tourSlot") || searchParams.get("tourConfirm")) {
      const demoDoctor = doctors.find((doctor) => doctor.fullName === "Dr. Arjun Mehta") || doctors[0];
      setSelected(demoDoctor);
      setDate((value) => value || new Date().toISOString().slice(0, 10));
      setTime((value) => value || "11:30");
      setReason((value) => value || "Demo follow-up visit");
      setStep(searchParams.get("tourConfirm") ? 3 : 2);
    }
  }, [doctors, searchParams]);

  const specialties = ["all", ...new Set(doctors.map((doctor) => doctor.specialisation))];
  const visible = filter === "all" ? doctors : doctors.filter((doctor) => doctor.specialisation === filter);

  async function confirm() {
    const session = readClinicSession();
    if (!session || !selected || !date || !time) {
      setMessage("Choose a doctor, date, and available time before confirming.");
      return;
    }
    setMessage("");
    await createAppointment({
      id: `appointment-${Date.now()}`,
      patientName: session.email.split("@")[0],
      patientEmail: session.email,
      doctor: selected.fullName,
      specialty: selected.specialisation,
      date,
      time,
      reason: reason.trim() || "General consultation",
      status: "Pending review",
      createdAt: new Date().toISOString()
    });
    setStep(4);
  }

  return (
    <main>
      <PageHeader eyebrow="Patient portal" title="Book an appointment" description="Choose a doctor, select an available time, and confirm your visit." />
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-700" aria-label="Booking progress">
        {["Choose doctor", "Choose slot", "Confirm"].map((label, index) => <span key={label} className={`rounded-full px-3 py-2 ${step === index + 1 ? "bg-care-100 text-care-700" : "bg-surface-warm text-ink-500"}`}>{index + 1}. {label}</span>)}
      </div>

      {state === "loading" ? <div className="mt-6 grid gap-4 md:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {state === "error" ? <div className="mt-6"><ErrorState message="Doctors could not be loaded." retry={() => void load()} /></div> : null}
      {state === "empty" ? <div className="mt-6"><EmptyState title="No doctors are available yet" description="The clinic has not published doctor availability. Please check again later." /></div> : null}

      {state === "ready" && step === 1 ? (
        <section className="mt-6" data-tour="doctor-list">
          <div className="max-w-sm">
            <label htmlFor="specialtyFilter" className="block text-ink-700">Filter by specialisation</label>
            <select id="specialtyFilter" value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-1 w-full rounded-[6px] border border-border bg-surface px-3">
              <option value="all">All specialisations</option>
              {specialties.slice(1).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {visible.map((doctor) => {
              const photoUrl = (doctor as Doctor & { photoUrl?: string }).photoUrl;
              return (
                <article key={doctor.id} className="rounded-[12px] border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(11,46,43,0.08)]">
                  <div className="flex items-start gap-3">
                    {photoUrl ? <img src={photoUrl} alt="" className="h-14 w-14 rounded-full object-cover bg-care-100" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-care-100 font-serif text-xl font-semibold text-care-700">{doctor.fullName.replace("Dr. ", "").charAt(0)}</div>}
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-ink-900">{doctor.fullName}</h2>
                      <p className="text-ink-700">{doctor.specialisation}</p>
                      <p className="mt-1 text-sm font-semibold text-care-700">Next available: today at 11:30</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-ink-700">{doctor.qualifications.join(" · ")}</p>
                  <p className="mt-2 text-sm text-ink-700">Languages: {doctor.languages.join(", ")}</p>
                  <p className="mt-3 font-semibold tabular-nums text-care-700">Consultation fee: Rs {doctor.consultationFee}</p>
                  <button type="button" onClick={() => { setSelected(doctor); setDate(new Date().toISOString().slice(0, 10)); setStep(2); }} className="mt-5 min-h-11 w-full rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white">Choose this doctor</button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 2 && selected ? (
        <section className="mt-6 max-w-xl rounded-[12px] border border-border bg-surface p-6" data-tour="slot-picker">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Choose a slot with {selected.fullName}</h2>
          <p className="mt-2 text-ink-700">Only published availability is bookable. Taken slots remain visible to show clinic capacity.</p>
          <div className="mt-5">
            <label htmlFor="slotDate" className="block text-ink-700">Date</label>
            <input id="slotDate" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-[6px] border border-border bg-surface px-3" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["09:30", "10:00", "10:30", "11:30"].map((slot) => {
              const taken = ["09:30", "10:00", "10:30"].includes(slot);
              return <button key={slot} type="button" disabled={taken} onClick={() => setTime(slot)} className={`min-h-11 rounded-[6px] border px-3 font-semibold ${time === slot ? "border-care-700 bg-care-100 text-care-700" : "border-border bg-surface-warm text-ink-700"} disabled:cursor-not-allowed disabled:opacity-50`}>{slot}{taken ? " taken" : ""}</button>;
            })}
          </div>
          <label htmlFor="reason" className="mt-4 block text-ink-700">Reason for visit <span className="font-normal text-ink-500">(optional, visible to the doctor only)</span></label>
          <textarea id="reason" maxLength={120} value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 w-full rounded-[6px] border border-border bg-surface px-3 py-2" />
          {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-[6px] border border-border px-4 font-semibold text-ink-700">Back</button>
            <button type="button" onClick={() => setStep(3)} className="min-h-11 rounded-[6px] bg-care-700 px-4 font-semibold text-white">Review</button>
          </div>
        </section>
      ) : null}

      {step === 3 && selected ? (
        <section className="mt-6 max-w-xl rounded-[12px] border border-border bg-surface p-6" data-tour="confirm-booking">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Confirm appointment</h2>
          <dl className="mt-5 space-y-3 text-ink-700">
            <div><dt className="font-semibold text-ink-900">Doctor</dt><dd>{selected.fullName}, {selected.specialisation}</dd></div>
            <div><dt className="font-semibold text-ink-900">When</dt><dd>{date} at {time}</dd></div>
            <div><dt className="font-semibold text-ink-900">Fee</dt><dd>Rs {selected.consultationFee}</dd></div>
            <div><dt className="font-semibold text-ink-900">Cancellation</dt><dd>Contact the clinic before the scheduled time. The clinic never silently cancels a booking.</dd></div>
          </dl>
          {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="min-h-11 rounded-[6px] border border-border px-4 font-semibold text-ink-700">Back</button>
            <button type="button" onClick={() => void confirm()} className="min-h-11 rounded-[6px] bg-care-700 px-4 font-semibold text-white">Confirm appointment</button>
          </div>
        </section>
      ) : null}

      {step === 4 ? <section className="mt-6 max-w-xl rounded-[12px] border border-success bg-green-50 p-6"><h2 className="font-serif text-2xl font-semibold text-ink-900">Appointment request received</h2><p className="mt-2 text-ink-700">The clinic has received your request. You can see its status in Appointments.</p><a className="mt-5 inline-flex min-h-11 items-center rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white" href="/patient/appointments">Go to appointments</a></section> : null}
    </main>
  );
}
