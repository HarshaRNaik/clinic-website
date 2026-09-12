import { doctorSchema, type Doctor } from "@/lib/data/types";
import { listClinicData, saveClinicData } from "@/lib/clinic-db";

export async function listDoctors(): Promise<Doctor[]> {
  const records = await listClinicData<unknown>("doctors");
  return records.flatMap((record) => {
    const result = doctorSchema.safeParse(record);
    return result.success && result.data.active ? [result.data] : [];
  });
}

export async function saveDoctor(doctor: Doctor) {
  const validated = doctorSchema.parse(doctor);
  await saveClinicData("doctors", validated.id, validated);
  return validated;
}
