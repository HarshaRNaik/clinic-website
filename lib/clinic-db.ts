import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

const LOCAL_STORAGE_PREFIX = "clinic-db:";

export function isClinicDatabaseReady() {
  return Boolean(db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export async function saveClinicData<T>(collectionName: string, id: string, data: T) {
  if (isClinicDatabaseReady() && db) {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${collectionName}:${id}`, JSON.stringify(data));
  }
}

export async function readClinicData<T>(collectionName: string, id: string): Promise<T | null> {
  if (isClinicDatabaseReady() && db) {
    const snapshot = await getDoc(doc(db, collectionName, id));
    return snapshot.exists() ? (snapshot.data() as T) : null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${collectionName}:${id}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveClinicProfile(profile: Record<string, unknown>, email: string) {
  await saveClinicData("profiles", email.toLowerCase(), profile);
}

export async function saveClinicAppointment(appointment: Record<string, unknown>, appointmentId: string) {
  await saveClinicData("appointments", appointmentId, appointment);
}

export async function listClinicData<T>(collectionName: string): Promise<T[]> {
  if (isClinicDatabaseReady() && db) {
    const snapshots = await getDocs(collection(db, collectionName));
    return snapshots.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }) as T);
  }

  if (typeof window === "undefined") {
    return [];
  }

  const items: T[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(`${LOCAL_STORAGE_PREFIX}${collectionName}:`)) {
      continue;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as T;
      items.push(parsed);
    } catch {
      continue;
    }
  }

  return items;
}

export async function listClinicAppointments() {
  return listClinicData<Record<string, unknown>>("appointments");
}
