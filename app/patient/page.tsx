"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readClinicSession } from "@/lib/clinic-auth";
import { listClinicAppointments, saveClinicAppointment } from "@/lib/clinic-db";
import { patientMetrics } from "@/lib/clinic-data";
import { generatePatientId } from "@/lib/security/patient-id";
import { NoticeCenter } from "@/components/patient/NoticeCenter";

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

type ChatMessage = {
  sender: "bot" | "user";
  text: string;
};

const doctorDirectory = [
  {
    name: "Dr. Meera Nair",
    specialty: "Dermatology",
    nextSlot: "Today • 4:30 PM",
    symptoms: ["skin", "rash", "acne", "allergy"]
  },
  {
    name: "Dr. Arjun Mehta",
    specialty: "General Medicine",
    nextSlot: "Tomorrow • 10:00 AM",
    symptoms: ["fever", "cough", "cold", "infection", "flu"]
  },
  {
    name: "Dr. Rohan Iyer",
    specialty: "Gastroenterology",
    nextSlot: "Tomorrow • 2:15 PM",
    symptoms: ["stomach", "digestion", "acidity", "gas", "pain"]
  },
  {
    name: "Dr. Kavya Menon",
    specialty: "Pediatrics",
    nextSlot: "Wed • 11:30 AM",
    symptoms: ["child", "kid", "vaccination", "pediatric", "baby"]
  },
  {
    name: "Dr. Sneh Verma",
    specialty: "Orthopedics",
    nextSlot: "Thu • 1:00 PM",
    symptoms: ["bone", "joint", "fracture", "back", "pain", "leg"]
  }
];

const quickActions = ["Book appointment", "View prescriptions", "Download reports", "Message clinic"];

function findDoctorRecommendation(question: string) {
  const normalized = question.toLowerCase();

  for (const doctor of doctorDirectory) {
    if (doctor.symptoms.some((keyword) => normalized.includes(keyword))) {
      return doctor;
    }
  }

  return doctorDirectory[1];
}

export default function PatientDashboardPage() {
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hi! Tell me your symptoms or concern, and I’ll suggest the best doctor and the right appointment slot."
    }
  ]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patientId, setPatientId] = useState("");
  const [form, setForm] = useState({
    patientName: "",
    doctor: doctorDirectory[1].name,
    specialty: doctorDirectory[1].specialty,
    date: "",
    time: "",
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const patientName = useMemo(() => {
    if (currentUser?.email) {
      const namePart = currentUser.email.split("@")[0];
      return namePart.replace(/[._-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return "Patient";
  }, [currentUser]);

  useEffect(() => {
    const user = readClinicSession();
    setCurrentUser(user);
    if (user) {
      const storageKey = `clinic-patient-id:${user.email.toLowerCase()}`;
      const storedPatientId = window.localStorage.getItem(storageKey) || generatePatientId();
      window.localStorage.setItem(storageKey, storedPatientId);
      setPatientId(storedPatientId);
      setForm((previous) => ({
        ...previous,
        patientName: previous.patientName || patientName
      }));
    }

    async function loadAppointments() {
      const clinicAppointments = await listClinicAppointments();
      const patientAppointments = clinicAppointments.filter((item) => {
        const record = item as Record<string, unknown>;
        return record.patientEmail === user?.email || record.patientEmail === currentUser?.email;
      });

      setAppointments(
        (patientAppointments as AppointmentRecord[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }

    void loadAppointments();
  }, [currentUser?.email, patientName]);

  async function handleAppointmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser?.email) {
      return;
    }

    setSubmitting(true);
    const appointmentId = `appointment-${Date.now()}`;
    const record: AppointmentRecord = {
      id: appointmentId,
      patientName: form.patientName || patientName,
      patientEmail: currentUser.email,
      doctor: form.doctor,
      specialty: form.specialty,
      date: form.date,
      time: form.time,
      reason: form.reason,
      status: "Pending review",
      createdAt: new Date().toISOString()
    };

    await saveClinicAppointment(record, appointmentId);

    setAppointments((previous) => [record, ...previous]);
    setChatMessages((previous) => [
      ...previous,
      {
        sender: "bot",
        text: `Your appointment request with ${record.doctor} for ${record.date} at ${record.time} has been shared with the clinic team.`
      }
    ]);
    setForm((previous) => ({ ...previous, date: "", time: "", reason: "" }));
    setSubmitting(false);
  }

  async function handleChatSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage) {
      return;
    }

    const recommendedDoctor = findDoctorRecommendation(trimmedMessage);
    const reply = `I recommend ${recommendedDoctor.name} (${recommendedDoctor.specialty}). The next available slot is ${recommendedDoctor.nextSlot}. You can book this doctor from the appointment form below.`;

    setChatMessages((previous) => [
      ...previous,
      { sender: "user", text: trimmedMessage },
      { sender: "bot", text: reply }
    ]);
    setForm((previous) => ({
      ...previous,
      doctor: recommendedDoctor.name,
      specialty: recommendedDoctor.specialty
    }));
    setChatInput("");
  }

  return (
    <main className="py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-tour="patient-home">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Patient dashboard</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">Welcome back, {patientName}</h1>
          </div>
          <div className="flex gap-3">
            {currentUser?.email ? <NoticeCenter email={currentUser.email} /> : null}
            <Link href="/patient/appointments" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-400">
              Appointments
            </Link>
            <Link href="/patient/login" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-400">
              Switch account
            </Link>
            <Link href="/" className="rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-700">
              Home
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {patientMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</p>
              <p className="mt-1 text-slate-600">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[6px] border border-brand-100 bg-brand-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Your clinic ID</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-wide text-ink-900">{patientId || "Loading..."}</p>
              <p className="mt-2 max-w-prose text-sm text-ink-700">The clinic may ask for this ID when you need help finding your record. Keep it private.</p>
            </div>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(patientId)}
              disabled={!patientId}
              className="min-h-11 rounded-[6px] border border-brand-700 bg-surface px-4 py-2 font-medium text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy ID
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">My appointments</h2>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Shared with clinic
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {appointments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                    No appointments yet. Use the chatbot and booking form to schedule one.
                  </p>
                ) : (
                  appointments.map((item) => (
                    <div key={item.id || `${item.doctor}-${item.date}-${item.time}`} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.doctor}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.specialty}</p>
                        </div>
                        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{item.date} at {item.time}</p>
                      <p className="mt-2 text-sm text-slate-500">{item.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-semibold text-slate-900">Clinic assistant</h2>
              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.sender}-${index}`}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.sender === "user"
                        ? "ml-auto bg-brand-600 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="mt-4 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Describe symptoms or ask about the right doctor..."
                />
                <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Ask
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-900">Book appointment</h2>
            <form onSubmit={handleAppointmentSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Patient name</label>
                <input
                  value={form.patientName}
                  onChange={(event) => setForm((previous) => ({ ...previous, patientName: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Recommended doctor</label>
                <select
                  value={form.doctor}
                  onChange={(event) => {
                    const selected = doctorDirectory.find((doctor) => doctor.name === event.target.value) || doctorDirectory[1];
                    setForm((previous) => ({
                      ...previous,
                      doctor: selected.name,
                      specialty: selected.specialty
                    }));
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  {doctorDirectory.map((doctor) => (
                    <option key={doctor.name} value={doctor.name}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((previous) => ({ ...previous, date: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm((previous) => ({ ...previous, time: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Reason for visit</label>
                <textarea
                  value={form.reason}
                  onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))}
                  className="mt-2 min-h-[96px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Describe symptoms and any relevant details"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="block w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Booking..." : "Confirm booking"}
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  type="button"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
