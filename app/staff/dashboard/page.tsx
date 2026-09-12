"use client";

import { useEffect, useState } from "react";
import { readClinicSession } from "@/lib/clinic-auth";
import { listClinicAppointments } from "@/lib/clinic-db";

type AppointmentRecord = {
  id?: string;
  patientName: string;
  patientEmail: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: string;
};

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    async function syncAppointments() {
      const allAppointments = await listClinicAppointments();
      const session = readClinicSession();
      const doctorName = session?.email === "doctor@clinic.com" ? "Dr. Arjun Mehta" : "";
      setAppointments(
        (allAppointments as AppointmentRecord[]).filter((appointment) => !doctorName || appointment.doctor === doctorName).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }

    void syncAppointments();
    const interval = window.setInterval(() => {
      void syncAppointments();
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  const pendingReviewCount = appointments.filter((appointment) => appointment.status === "Pending review").length;

  return (
    <main className="py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Staff dashboard</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Today’s clinic overview</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Appointments</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{appointments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Checked in</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{Math.max(0, Math.min(appointments.length, 7))}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{pendingReviewCount}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Patient appointment queue</h2>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Synced from patient portal
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {appointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No patient bookings yet. Appointments made from the patient side will appear here automatically.
              </p>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id || `${appointment.patientEmail}-${appointment.date}-${appointment.time}`} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-sm text-slate-600">{appointment.patientEmail}</p>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {appointment.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <p><span className="font-medium text-slate-900">Doctor:</span> {appointment.doctor}</p>
                    <p><span className="font-medium text-slate-900">Specialty:</span> {appointment.specialty}</p>
                    <p><span className="font-medium text-slate-900">Date:</span> {appointment.date} • {appointment.time}</p>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Reason:</span> {appointment.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
