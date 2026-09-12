"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestClinicPasswordReset, signInClinic } from "@/lib/clinic-auth";
import { DEMO_DOCTOR_EMAIL, prototypeMode, startDemoTour } from "@/lib/prototype-mode";
import { seedPrototypeData } from "@/lib/prototype-seed";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("doctor@clinic.com");
  const [password, setPassword] = useState("Doctor@123");
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
      setError(!email.trim() ? "Work email is required." : "Password is required.");
      return;
    }

    setPending(true);
    const response = await signInClinic({ email, password, role: "staff" });

    if (!response.ok) {
      setError(response.message || "Unable to sign in.");
      setPending(false);
      return;
    }

    router.push("/staff");
  }

  async function enterDemo() {
    await seedPrototypeData({ resetTour: true });
    startDemoTour("doctor");
    const response = await signInClinic({ email: DEMO_DOCTOR_EMAIL, password: "demo", role: "staff" });
    if (response.ok) router.push("/staff");
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="auth-shell grid w-full max-w-6xl overflow-hidden rounded-[10px] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="auth-brand--doctor p-8 md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Doctor portal</p>
            <h1 className="mt-4 max-w-md text-4xl font-black tracking-tight md:text-5xl">Clinical operations, protected.</h1>
            <p className="mt-4 max-w-md text-base text-slate-200">
              Manage schedules, review follow-ups, and monitor care tasks with secure staff-only access.
            </p>

            <div className="mt-8 space-y-3 text-sm text-slate-200">
              <div className="rounded-[6px] border border-white/10 bg-slate-700 p-4">
                <p className="font-semibold text-white">Demo doctor account</p>
                <p className="mt-1">doctor@clinic.com</p>
                <p className="mt-1">Doctor@123</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-surface p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Secure access</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Doctor login</h2>
            </div>
            <Link href="/" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">
              Home
            </Link>
          </div>

          <p className="mt-4 text-slate-700">Use your work credentials. Staff sessions are not saved because clinic computers are shared. Contact clinic admin for access.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {prototypeMode ? <button type="button" onClick={() => void enterDemo()} className="min-h-11 w-full rounded-[6px] bg-clinic-800 px-4 py-3 font-semibold text-white">Enter as demo doctor</button> : null}
            <div>
              <label htmlFor="staffEmail" className="block text-slate-700">Work email</label>
              <input
                id="staffEmail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                autoComplete="email"
                placeholder="doctor@clinic.com"
              />
              {!email.trim() && (attempted || touched.email) ? <p className="mt-1 text-sm text-red-700" role="alert">Work email is required.</p> : null}
            </div>
            <div>
              <label htmlFor="staffPassword" className="block text-slate-700">Password</label>
              <input
                id="staffPassword"
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
              className="block min-h-11 w-full rounded-[6px] bg-staff-chrome px-4 py-3.5 text-center font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button type="button" onClick={() => void handleReset()} className="mt-3 text-sm font-semibold text-brand-700 underline underline-offset-4">Forgot password?</button>
          {resetMessage ? <p className="mt-2 text-sm text-slate-600" role="status">{resetMessage}</p> : null}

          <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
            <Link href="/patient/login" className="font-medium text-brand-700 transition hover:text-brand-900">
              Patient login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
