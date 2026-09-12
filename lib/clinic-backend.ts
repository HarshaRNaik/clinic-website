import type { ClinicRole } from "@/lib/clinic-auth";

export type ClinicAccountRecord = {
  uid: string;
  email: string;
  password: string;
  role: ClinicRole;
  fullName: string;
  phone?: string;
  createdAt: string;
};

const ACCOUNT_STORE_KEY = "clinic-accounts-v1";

const DEFAULT_ACCOUNTS: ClinicAccountRecord[] = [
  {
    uid: "patient-demo-user",
    email: "patient@clinic.com",
    password: "Patient@123",
    role: "patient",
    fullName: "Riya Sharma",
    phone: "+91 98765 43210",
    createdAt: "2026-09-12T00:00:00.000Z"
  },
  {
    uid: "doctor-demo-user",
    email: "doctor@clinic.com",
    password: "Doctor@123",
    role: "staff",
    fullName: "Dr. Arjun Mehta",
    phone: "+91 91234 56789",
    createdAt: "2026-09-12T00:00:00.000Z"
  },
  {
    uid: "admin-demo-user",
    email: "admin@clinic.com",
    password: "Admin@123",
    role: "admin",
    fullName: "Clinic Administrator",
    phone: "+91 90000 00000",
    createdAt: "2026-09-12T00:00:00.000Z"
  }
];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getClinicAccountStore(): Record<string, ClinicAccountRecord> {
  if (typeof window === "undefined") {
    return Object.fromEntries(DEFAULT_ACCOUNTS.map((account) => [normalizeEmail(account.email), account]));
  }

  const raw = window.localStorage.getItem(ACCOUNT_STORE_KEY);

  if (!raw) {
    const seeded = Object.fromEntries(DEFAULT_ACCOUNTS.map((account) => [normalizeEmail(account.email), account]));
    window.localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, ClinicAccountRecord>;
    if (!parsed || Object.keys(parsed).length === 0) {
      const seeded = Object.fromEntries(DEFAULT_ACCOUNTS.map((account) => [normalizeEmail(account.email), account]));
      window.localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = Object.fromEntries(DEFAULT_ACCOUNTS.map((account) => [normalizeEmail(account.email), account]));
    window.localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function ensureClinicAccountSeed() {
  if (typeof window === "undefined") return;

  const store = getClinicAccountStore();
  for (const account of DEFAULT_ACCOUNTS) {
    const key = normalizeEmail(account.email);
    if (!store[key]) {
      store[key] = account;
    }
  }

  window.localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(store));
}

export function findClinicAccount(email: string, role?: ClinicRole) {
  const store = getClinicAccountStore();
  const normalized = normalizeEmail(email);
  const account = store[normalized];

  if (!account) {
    return null;
  }

  if (role && account.role !== role) {
    return null;
  }

  return account;
}

export function findClinicAccountByIdentifier(identifier: string, role?: ClinicRole) {
  const normalized = identifier.trim().toLowerCase();
  const store = getClinicAccountStore();
  const account = Object.values(store).find((candidate) => {
    const matchesIdentifier = candidate.email.toLowerCase() === normalized || candidate.phone?.replace(/\s+/g, "") === normalized.replace(/\s+/g, "");
    const matchesRole = !role || candidate.role === role || (role === "staff" && candidate.role === "admin");
    return matchesIdentifier && matchesRole;
  });

  return account || null;
}

export function saveClinicAccount(account: ClinicAccountRecord) {
  if (typeof window === "undefined") {
    return;
  }

  const store = getClinicAccountStore();
  store[normalizeEmail(account.email)] = account;
  window.localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(store));
}

export function getDefaultClinicCredentials() {
  return DEFAULT_ACCOUNTS.map(({ email, password, role, fullName }) => ({ email, password, role, fullName }));
}
