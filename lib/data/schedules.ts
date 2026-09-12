import { z } from "zod";
import { listClinicAppointments, readClinicData, saveClinicData } from "@/lib/clinic-db";

export const scheduleSchema = z.object({
  doctorId: z.string(),
  doctorName: z.string(),
  effectiveFrom: z.string(),
  recurring: z.record(z.string(), z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    breakStart: z.string(),
    breakEnd: z.string(),
    slotDuration: z.number().int().positive(),
    bufferMinutes: z.number().int().nonnegative(),
    maxBookings: z.number().int().positive()
  })),
  overrides: z.array(z.object({ date: z.string(), kind: z.enum(["leave", "holiday", "extra", "changed"]), start: z.string().optional(), end: z.string().optional(), reason: z.string() })),
  status: z.enum(["draft", "published"]),
  updatedAt: z.string()
});

export type ClinicSchedule = z.infer<typeof scheduleSchema>;

export async function readDoctorSchedule(doctorId: string) {
  const schedule = await readClinicData<unknown>("schedules", doctorId);
  const parsed = scheduleSchema.safeParse(schedule);
  return parsed.success ? parsed.data : null;
}

export async function saveDoctorSchedule(schedule: ClinicSchedule) {
  const parsed = scheduleSchema.parse(schedule);
  await saveClinicData("schedules", parsed.doctorId, parsed);
  return parsed;
}

export async function findScheduleConflicts(schedule: ClinicSchedule) {
  const appointments = await listClinicAppointments();
  return appointments.filter((appointment) => {
    const record = appointment as Record<string, string>;
    if (record.doctor !== schedule.doctorName || !record.date) return false;
    const override = schedule.overrides.find((item) => item.date === record.date);
    return override?.kind === "leave" || override?.kind === "holiday";
  });
}
