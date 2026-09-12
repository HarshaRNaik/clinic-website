"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerClinic } from "@/lib/clinic-auth";
import { saveClinicProfile } from "@/lib/clinic-db";
import { checkPasswordSafety } from "@/lib/security/password";
import { prototypeMode } from "@/lib/prototype-mode";

type FieldName = "fullName" | "email" | "phone" | "password";

export default function PatientRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);

  function validate() {
    const next: Partial<Record<FieldName, string>> = {};
    if (!fullName.trim()) next.fullName = "Full name is required.";
    if (!password.trim()) next.password = "Password is required.";
    if (!prototypeMode) {
      if (!email.trim()) next.email = "Email is required.";
      if (!phone.trim()) next.phone = "Phone is required.";
    }
    return next;
  }

  function blur(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
    const next = validate();
    setErrors((current) => ({ ...current, [field]: next[field] }));
  }

  const visibleError = (field: FieldName) => attempted || touched[field];
  const fieldError = (field: FieldName) =>
    errors[field] && visibleError(field) ? <p className="mt-1 text-sm text-red-700" role="alert">{errors[field]}</p> : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!prototypeMode) {
      const passwordCheck = await checkPasswordSafety(password);
      if (!passwordCheck.ok) {
        setErrors({ password: passwordCheck.message || "Choose a different password." });
        return;
      }
    }

    setPending(true);
    const accountEmail = email.trim() || `patient-${Date.now()}@patient.local`;
    const response = await registerClinic({ email: accountEmail, password, role: "patient", phone });

    if (!response.ok) {
      setErrors({ email: response.message || "Unable to create account." });
      setPending(false);
      return;
    }

    await saveClinicProfile(
      {
        fullName,
        phone,
        email: accountEmail,
        role: "patient",
        createdAt: new Date().toISOString()
      },
      accountEmail
    );

    window.localStorage.setItem("arogya-patient-onboarded", "true");
    router.push("/patient");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Register</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Create patient account</h1>
          </div>
          <Link href="/patient/login" className="text-sm font-medium text-brand-700 hover:text-brand-900">
            Log in
          </Link>
        </div>

        <p className="mt-3 text-slate-600">{prototypeMode ? "For this prototype, only name and password are required." : "Email and phone verification are required before access."}</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label htmlFor="registerName" className="block text-slate-700">Full name</label>
            <input
              id="registerName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              onBlur={() => blur("fullName")}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoComplete="name"
            />
            {fieldError("fullName")}
          </div>
          <div>
            <label htmlFor="registerEmail" className="block text-slate-700">Email</label>
            <input
              id="registerEmail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => blur("email")}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoComplete="email"
            />
            {fieldError("email")}
          </div>
          <div>
            <label htmlFor="registerPhone" className="block text-slate-700">Phone</label>
            <input
              id="registerPhone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onBlur={() => blur("phone")}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoComplete="tel"
            />
            {fieldError("phone")}
          </div>
          <div>
            <label htmlFor="registerPassword" className="block text-slate-700">Password</label>
            <input
              id="registerPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => blur("password")}
              minLength={prototypeMode ? 1 : 6}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoComplete="new-password"
            />
            {fieldError("password")}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="md:col-span-2 w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
