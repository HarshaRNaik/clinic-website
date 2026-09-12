"use client";

import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  inMemoryPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  ensureClinicAccountSeed,
  findClinicAccount,
  findClinicAccountByIdentifier,
  getDefaultClinicCredentials,
  saveClinicAccount
} from "@/lib/clinic-backend";
import { DEMO_DOCTOR_EMAIL, DEMO_PATIENT_EMAIL, prototypeMode } from "@/lib/prototype-mode";

export type ClinicRole = "patient" | "staff" | "admin";

export type ClinicUser = {
  uid: string;
  email: string;
  role: ClinicRole;
};

const PATIENT_STORAGE_KEY = "clinic-patient-session";
const STAFF_STORAGE_KEY = "clinic-staff-session";

function isFirebaseReady() {
  return Boolean(
    auth &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export function readClinicSession(): ClinicUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PATIENT_STORAGE_KEY) || window.sessionStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClinicUser;
    return parsed && parsed.email && parsed.role ? parsed : null;
  } catch {
    return null;
  }
}

export function writeClinicSession(user: ClinicUser) {
  if (typeof window === "undefined") return;

  const serializedUser = JSON.stringify(user);
  if (user.role === "patient") {
    window.localStorage.setItem(PATIENT_STORAGE_KEY, serializedUser);
    window.sessionStorage.removeItem(STAFF_STORAGE_KEY);
  } else {
    window.sessionStorage.setItem(STAFF_STORAGE_KEY, serializedUser);
    window.localStorage.removeItem(PATIENT_STORAGE_KEY);
  }
}

export function clearClinicSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PATIENT_STORAGE_KEY);
  window.sessionStorage.removeItem(STAFF_STORAGE_KEY);
}

export async function signInClinic({ email, password, role }: { email: string; password: string; role: ClinicRole }) {
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    return { ok: false, message: "Invalid email or password" };
  }

  if (prototypeMode && typeof window !== "undefined") {
    ensureClinicAccountSeed();
    const seededAccount = findClinicAccountByIdentifier(trimmedEmail, role);
    const fallbackEmail = role === "staff" ? DEMO_DOCTOR_EMAIL : DEMO_PATIENT_EMAIL;
    const accountEmail = seededAccount?.email || (trimmedEmail.includes("@") ? trimmedEmail : fallbackEmail);
    const user: ClinicUser = {
      uid: seededAccount?.uid || `${role}-prototype-user`,
      email: accountEmail,
      role: role === "admin" ? "admin" : role
    };
    writeClinicSession(user);
    return { ok: true, user };
  }

  if (trimmedPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  if (typeof window !== "undefined") {
    ensureClinicAccountSeed();
    const seededAccount = findClinicAccountByIdentifier(trimmedEmail, role);
    if (seededAccount && seededAccount.password === trimmedPassword) {
      const user: ClinicUser = {
        uid: seededAccount.uid,
        email: seededAccount.email,
        role: seededAccount.role
      };
      writeClinicSession(user);
      return { ok: true, user };
    }
  }

  if (!isFirebaseReady()) {
    return {
      ok: false,
      message: "Invalid email or password"
    };
  }

  try {
    if (!auth) {
      return {
        ok: false,
        message: "Authentication service is not available right now."
      };
    }

    await setPersistence(auth, role === "patient" ? browserLocalPersistence : inMemoryPersistence);
    const result = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    const user: ClinicUser = {
      uid: result.user.uid,
      email: result.user.email || trimmedEmail,
      role
    };

    writeClinicSession(user);
    return { ok: true, user };
  } catch {
    return { ok: false, message: "Invalid email or password" };
  }
}

export async function registerClinic({
  email,
  password,
  role,
  phone
}: {
  email: string;
  password: string;
  role: ClinicRole;
  phone?: string;
}) {
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (prototypeMode && typeof window !== "undefined") {
    if (!trimmedPassword) {
      return { ok: false, message: "Password is required." };
    }
    const accountEmail = trimmedEmail || `${role}-prototype-${Date.now()}@clinic.local`;
    const user: ClinicUser = {
      uid: `${role}-${accountEmail}`,
      email: accountEmail,
      role
    };
    saveClinicAccount({
      uid: user.uid,
      email: accountEmail,
      password: trimmedPassword,
      role,
      fullName: accountEmail.split("@")[0],
      phone,
      createdAt: new Date().toISOString()
    });
    writeClinicSession(user);
    return { ok: true, user };
  }

  if (!trimmedEmail || !trimmedPassword) {
    return { ok: false, message: "Email and password are required." };
  }

  if (trimmedPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  if (typeof window !== "undefined") {
    ensureClinicAccountSeed();
    const existingAccount = findClinicAccount(trimmedEmail);
    if (existingAccount) {
      return {
        ok: false,
        message: "This account already exists. Please use a different email or sign in."
      };
    }

    const fallbackUser: ClinicUser = {
      uid: `${role}-${trimmedEmail}`,
      email: trimmedEmail,
      role
    };

    saveClinicAccount({
      uid: fallbackUser.uid,
      email: trimmedEmail,
      password: trimmedPassword,
      role,
      fullName: trimmedEmail.split("@")[0],
      phone,
      createdAt: new Date().toISOString()
    });

    writeClinicSession(fallbackUser);
    return { ok: true, user: fallbackUser };
  }

  if (!isFirebaseReady()) {
    return {
      ok: false,
      message: "Registration is available only when Firebase is configured."
    };
  }

  try {
    if (!auth) {
      return {
        ok: false,
        message: "Authentication service is not available right now."
      };
    }

    const result = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    const user: ClinicUser = {
      uid: result.user.uid,
      email: result.user.email || trimmedEmail,
      role
    };

    writeClinicSession(user);
    return { ok: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return { ok: false, message };
  }
}

export async function signOutClinic() {
  if (typeof window === "undefined") {
    return;
  }

  if (auth && isFirebaseReady()) {
    await firebaseSignOut(auth);
  }

  clearClinicSession();
}

export async function requestClinicPasswordReset(email: string) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { ok: false, message: "Enter your email to reset your password." };
  }

  if (!isFirebaseReady() || !auth) {
    return { ok: true, message: "If an account exists for that email, reset instructions are available from the clinic." };
  }

  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
    return { ok: true, message: "If an account exists for that email, reset instructions have been sent." };
  } catch {
    return { ok: true, message: "If an account exists for that email, reset instructions have been sent." };
  }
}

export function getSeededClinicCredentials() {
  return getDefaultClinicCredentials();
}
