"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestClinicPasswordReset, signInClinic } from "@/lib/clinic-auth";
import { DEMO_PATIENT_EMAIL, prototypeMode, startDemoTour } from "@/lib/prototype-mode";
import { seedPrototypeData } from "@/lib/prototype-seed";

export default function PatientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("patient@clinic.com");
  const [password, setPassword] = useState("Patient@123");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<"email" | "password", boolean>>({ email: false, password: false });
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function handleReset() {
    const response = await requestClinicPasswordReset(email);
    setResetMessage(response.message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAttempted(true);
    if (!email.trim() || !password.trim()) {
      setError(!email.trim() ? "Email is required." : "Password is required.");
      return;
    }
    setPending(true);

    const response = await signInClinic({ email, password, role: "patient" });

    if (!response.ok) {
      setError(response.message || "Unable to sign in.");
      setPending(false);
      return;
    }

    window.localStorage.setItem("arogya-patient-onboarded", "true");
    router.push("/patient");
  }

  async function enterDemo() {
    await seedPrototypeData({ resetTour: true });
    startDemoTour("patient");
    const response = await signInClinic({ email: DEMO_PATIENT_EMAIL, password: "demo", role: "patient" });
    if (response.ok) {
      window.localStorage.setItem("arogya-patient-onboarded", "true");
      router.push("/patient");
    }
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="auth-shell grid w-full max-w-6xl overflow-hidden rounded-[10px] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="auth-brand--patient p-8 md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Patient access</p>
            <h1 className="mt-4 max-w-md text-4xl font-black tracking-tight md:text-5xl">Your care, in one secure portal.</h1>
            <p className="mt-4 max-w-md text-base text-brand-100">
              Review appointments, manage follow-ups, and stay connected with your care team without friction.
            </p>

            <div className="mt-8 space-y-3 text-sm text-brand-100">
              <div className="rounded-[6px] border border-white/20 bg-brand-800 p-4">
                <p className="font-semibold text-white">Demo account</p>
                <p className="mt-1">patient@clinic.com</p>
                <p className="mt-1">Patient@123</p>
              </div>
              <div className="rounded-[6px] border border-white/20 bg-brand-800 p-4">
                <p className="font-semibold text-white">Built for</p>
                <p className="mt-1">Appointments, reports, and care tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-surface p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Patient login</h2>
            </div>
            <Link href="/" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">
              Home
            </Link>
          </div>

          <p className="mt-4 text-slate-700">Sign in to manage visits, prescriptions, and follow-ups. Patient sessions stay signed in for convenience.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {prototypeMode ? <button type="button" onClick={() => void enterDemo()} className="min-h-11 w-full rounded-[6px] bg-care-700 px-4 py-3 font-semibold text-white">Enter as demo patient</button> : null}
            <div>
              <label htmlFor="patientEmail" className="block text-slate-700">Email</label>
              <input
                id="patientEmail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                autoComplete="email"
                placeholder="you@example.com"
              />
              {!email.trim() && (attempted || touched.email) ? <p className="mt-1 text-sm text-red-700" role="alert">Email is required.</p> : null}
            </div>
            <div>
              <label htmlFor="patientPassword" className="block text-slate-700">Password</label>
              <input
                id="patientPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                autoComplete="current-password"
              />
              {!password.trim() && (attempted || touched.password) ? <p className="mt-1 text-sm text-red-700" role="alert">Password is required.</p> : null}
            </div>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="block min-h-11 w-full rounded-[6px] bg-brand-700 px-4 py-3.5 text-center font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button type="button" onClick={() => void handleReset()} className="mt-3 text-sm font-semibold text-brand-700 underline underline-offset-4">Forgot password?</button>
          {resetMessage ? <p className="mt-2 text-sm text-slate-600" role="status">{resetMessage}</p> : null}

          <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
            <Link href="/patient/register" className="font-medium text-brand-700 transition hover:text-brand-900">
              Create account
            </Link>
            <Link href="/staff/login" className="font-medium text-slate-700 transition hover:text-slate-900">
              Doctor login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
