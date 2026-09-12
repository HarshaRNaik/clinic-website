"use client";

import { useEffect, useState } from "react";
import { readClinicSession } from "@/lib/clinic-auth";
import { saveClinicData } from "@/lib/clinic-db";
import { findScheduleConflicts, readDoctorSchedule, saveDoctorSchedule, type ClinicSchedule } from "@/lib/data/schedules";

const doctorId = "doctor-demo-user";
const doctorName = "Dr. Arjun Mehta";
const defaultSchedule: ClinicSchedule = {
  doctorId,
  doctorName,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  recurring: {
    Mon: { enabled: true, start: "09:00", end: "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 },
    Tue: { enabled: true, start: "09:00", end: "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 },
    Wed: { enabled: true, start: "09:00", end: "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 },
    Thu: { enabled: true, start: "09:00", end: "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 },
    Fri: { enabled: true, start: "09:00", end: "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 },
    Sat: { enabled: false, start: "09:00", end: "13:00", breakStart: "11:00", breakEnd: "11:30", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 }
  },
  overrides: [],
  status: "draft",
  updatedAt: new Date().toISOString()
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [conflicts, setConflicts] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = readClinicSession();
    if (session?.role !== "staff") return;
    void readDoctorSchedule(doctorId).then((stored) => { if (stored) setSchedule(stored); });
  }, []);

  function updateDay(day: string, field: string, value: string | boolean) {
    setSchedule((current) => ({ ...current, status: "draft", recurring: { ...current.recurring, [day]: { ...current.recurring[day], [field]: field === "slotDuration" || field === "bufferMinutes" || field === "maxBookings" ? Number(value) : value } } }));
  }

  async function publish() {
    const affected = await findScheduleConflicts(schedule);
    if (affected.length > 0) {
      setConflicts(affected);
      setMessage("Booked appointments are affected. Choose a resolution for each before publishing.");
      return;
    }
    const published = await saveDoctorSchedule({ ...schedule, status: "published", updatedAt: new Date().toISOString() });
    const noticeId = `schedule-${Date.now()}`;
    await saveClinicData("notices", noticeId, {
      id: noticeId,
      type: "schedule-change",
      title: "Doctor schedule updated",
      text: `${doctorName}'s available clinic hours have been updated. Review your appointment details in the patient portal.`,
      doctor: doctorName,
      requiresAck: false,
      acknowledged: false,
      publishAt: new Date().toISOString()
    });
    setSchedule(published);
    setMessage("Published schedule changes are now available to patients.");
  }

  function blockTodayForDemo() {
    const date = new Date().toISOString().slice(0, 10);
    setSchedule((current) => ({
      ...current,
      status: "draft",
      overrides: [
        ...current.overrides.filter((item) => item.date !== date),
        { date, kind: "leave", reason: "Prototype day block" }
      ]
    }));
    setMessage("Today is blocked in the draft. Publish to check booked-patient conflicts.");
  }

  return (
    <main className="py-8">
      <section className="rounded-[12px] border border-border bg-surface p-6 shadow-[0_8px_24px_rgba(11,46,43,0.08)] md:p-8" data-tour="schedule-conflict">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-clinic-800">Doctor schedule</p><h1 className="mt-2 font-serif text-4xl font-semibold text-ink-900">{doctorName}</h1><p className="mt-2 text-ink-700">Draft changes stay private until you publish them. All times use Asia/Kolkata.</p></div><span className="rounded-full bg-clinic-100 px-3 py-1 text-sm font-semibold text-clinic-800">{schedule.status === "published" ? "Published" : "Draft"}</span></div>
        <div className="mt-6 max-w-xs">
          <label htmlFor="scheduleEffectiveFrom" className="block text-ink-700">Effective from</label>
          <input id="scheduleEffectiveFrom" type="date" value={schedule.effectiveFrom} onChange={(event) => setSchedule((current) => ({ ...current, effectiveFrom: event.target.value, status: "draft" }))} className="mt-1 w-full rounded-[6px] border border-border bg-surface-warm px-3 text-ink-900" />
        </div>
        <div className="mt-6 overflow-x-auto rounded-[6px] border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-warm text-ink-700"><tr><th className="p-3">Day</th><th className="p-3">Open</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Break</th><th className="p-3">Slot</th><th className="p-3">Buffer</th><th className="p-3">Max</th></tr></thead><tbody className="divide-y divide-border">{Object.entries(schedule.recurring).map(([day, values]) => <tr key={day}><th className="p-3 font-semibold text-ink-900">{day}</th><td className="p-3"><input type="checkbox" checked={values.enabled} onChange={(event) => updateDay(day, "enabled", event.target.checked)} aria-label={`Open on ${day}`} /></td>{(["start", "end", "breakStart", "breakEnd"] as const).map((field) => <td key={field} className="p-3"><input type="time" value={values[field]} onChange={(event) => updateDay(day, field, event.target.value)} className="min-h-11 rounded-[6px] border border-border bg-surface px-2 text-ink-900" /></td>)}{(["slotDuration", "bufferMinutes", "maxBookings"] as const).map((field) => <td key={field} className="p-3"><input type="number" min="1" value={values[field]} onChange={(event) => updateDay(day, field, event.target.value)} className="min-h-11 w-20 rounded-[6px] border border-border bg-surface px-2 text-ink-900" /></td>)}</tr>)}</tbody></table></div>
        {message ? <p className="mt-5 rounded-[6px] border border-marigold-600 bg-marigold-100 p-3 text-sm text-ink-900" role="status">{message}</p> : null}
        {conflicts.length > 0 ? <div className="mt-4 rounded-[6px] border border-danger bg-red-50 p-4" data-tour="schedule-conflict-list"><p className="font-semibold text-danger">Resolve affected appointments before publishing</p>{conflicts.map((item, index) => <div key={`${String(item.patientEmail)}-${index}`} className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-700"><span>{String(item.patientName)} • {String(item.date)} at {String(item.time)}</span><span className="font-medium text-danger">Choose offer reschedule or cancel with reason</span></div>)}</div> : <div className="mt-4 rounded-[6px] border border-border bg-surface-warm p-4 text-sm text-ink-700" data-tour="schedule-conflict-list">No booked-patient conflicts in the current draft.</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={blockTodayForDemo} className="min-h-11 rounded-[6px] border border-clinic-800 px-5 py-2 font-semibold text-clinic-800">Block today</button><button type="button" onClick={() => void publish()} className="min-h-11 rounded-[6px] bg-clinic-800 px-5 py-2 font-semibold text-white transition hover:bg-clinic-600">Publish schedule</button></div>
      </section>
    </main>
  );
}
