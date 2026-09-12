export const prototypeMode = process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

export const DEMO_PATIENT_EMAIL = "patient@clinic.com";
export const DEMO_DOCTOR_EMAIL = "doctor@clinic.com";
export const DEMO_DOCTOR_NAME = "Dr. Arjun Mehta";
export const DEMO_PATIENT_ID = "AC-2026-RYA0-0007-5";

export type DemoTourRole = "patient" | "doctor";

export function startDemoTour(role: DemoTourRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("arogya-demo-tour-role", role);
  window.localStorage.setItem("arogya-demo-tour-step", "0");
}

export function stopDemoTour() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("arogya-demo-tour-role");
  window.localStorage.removeItem("arogya-demo-tour-step");
}
