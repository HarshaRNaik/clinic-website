"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { seedPrototypeData } from "@/lib/prototype-seed";
import { stopDemoTour, type DemoTourRole } from "@/lib/prototype-mode";

type TourStep = {
  title: string;
  text: string;
  href: string;
  target: string;
};

const patientSteps: TourStep[] = [
  { title: "Home", text: "Your next appointment and clinic ID are visible right away.", href: "/patient", target: "patient-home" },
  { title: "Book", text: "Pick a doctor, see the next available slot, and leave the screen whenever you like.", href: "/patient/book", target: "doctor-list" },
  { title: "Pick a slot", text: "Taken slots remain visible but disabled, so capacity is transparent.", href: "/patient/book?tourSlot=1", target: "slot-picker" },
  { title: "Confirm", text: "Confirming uses the real booking action and then appears in appointments.", href: "/patient/book?tourConfirm=1", target: "confirm-booking" },
  { title: "Records", text: "Visit history is written in patient-friendly language.", href: "/patient/records", target: "patient-records" },
  { title: "Reschedule or cancel", text: "Changes are explicit; bookings are never silently cancelled.", href: "/patient/appointments", target: "appointment-actions" },
  { title: "Profile", text: "See access history and download your data.", href: "/patient/profile", target: "patient-profile" }
];

const doctorSteps: TourStep[] = [
  { title: "Today", text: "Start with today's schedule and check a patient in.", href: "/staff", target: "today-schedule" },
  { title: "Open patient", text: "A scheduled appointment gives one-click access to the record.", href: "/staff", target: "open-scheduled-patient" },
  { title: "Patient ID rule", text: "For someone outside the schedule, paste this ID: AC-2026-RYA0-0007-5.", href: "/staff/patients", target: "patient-id-lookup" },
  { title: "The record", text: "Allergy banner, timeline, and vitals trend stay prominent.", href: "/staff/patients?record=riya", target: "clinical-record" },
  { title: "Consultation", text: "Type a note, hit Structure note, and review the fields.", href: "/staff/patients?record=riya", target: "structure-note" },
  { title: "Sign and save", text: "Edit low-confidence fields before the doctor approves the note.", href: "/staff/patients?record=riya", target: "low-confidence-field" },
  { title: "Schedule", text: "Block a day and see conflict warnings for booked patients.", href: "/staff/schedule", target: "schedule-conflict-list" }
];

export function PrototypeTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<DemoTourRole | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const storedRole = window.localStorage.getItem("arogya-demo-tour-role") as DemoTourRole | null;
    const storedStep = Number(window.localStorage.getItem("arogya-demo-tour-step") || "0");
    setRole(storedRole === "patient" || storedRole === "doctor" ? storedRole : null);
    setIndex(Number.isFinite(storedStep) ? storedStep : 0);
  }, [pathname]);

  const steps = useMemo(() => role === "doctor" ? doctorSteps : patientSteps, [role]);
  const step = steps[index];

  useEffect(() => {
    if (!role || !step) return;
    if (!step.href.startsWith(pathname)) router.replace(step.href);
    const timer = window.setTimeout(() => {
      document.querySelectorAll("[data-tour-active='true']").forEach((node) => node.removeAttribute("data-tour-active"));
      const target = document.querySelector(`[data-tour='${step.target}']`) as HTMLElement | null;
      if (target) {
        target.setAttribute("data-tour-active", "true");
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [index, pathname, role, router, step]);

  if (!role || !step) return null;

  function go(nextIndex: number) {
    const bounded = Math.max(0, Math.min(steps.length - 1, nextIndex));
    window.localStorage.setItem("arogya-demo-tour-step", String(bounded));
    setIndex(bounded);
    router.replace(steps[bounded].href);
  }

  function exit() {
    void seedPrototypeData({ resetTour: true }).then(() => {
      stopDemoTour();
      setRole(null);
      document.querySelectorAll("[data-tour-active='true']").forEach((node) => node.removeAttribute("data-tour-active"));
    });
  }

  return (
    <aside className="prototype-tour-panel" aria-label="Guided demo">
      <div className="prototype-tour-dots" aria-hidden="true">
        {steps.map((item, dotIndex) => <span key={item.title} data-current={dotIndex === index} />)}
      </div>
      <p className="prototype-tour-kicker">{role === "doctor" ? "Doctor tour" : "Patient tour"} · {index + 1} of {steps.length}</p>
      <h2>{step.title}</h2>
      <p>{step.text}</p>
      <div className="prototype-tour-actions">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>Back</button>
        <button type="button" onClick={exit}>Exit</button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === steps.length - 1}>Next</button>
      </div>
    </aside>
  );
}
