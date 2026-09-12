import { patientSchema, type Patient } from "@/lib/data/types";
import { readClinicData, saveClinicProfile } from "@/lib/clinic-db";

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const record = await readClinicData<unknown>("profiles", email.toLowerCase());
  const result = patientSchema.safeParse(record);
  return result.success ? result.data : null;
}

export async function savePatient(patient: Patient) {
  const validated = patientSchema.parse(patient);
  await saveClinicProfile(validated, validated.email);
  return validated;
}
