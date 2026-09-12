import { z } from "zod";

export const appointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().optional(),
  patientName: z.string().min(1),
  patientEmail: z.string().email(),
  doctorId: z.string().optional(),
  doctor: z.string().min(1),
  specialty: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  reason: z.string().min(1),
  status: z.enum(["Pending review", "Confirmed", "Cancelled", "Completed", "No-show"]).default("Pending review"),
  createdAt: z.string().datetime()
});

export const patientSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  createdAt: z.string().datetime()
});

export const doctorSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  specialisation: z.string().min(1),
  qualifications: z.array(z.string()),
  registrationNumber: z.string().min(1),
  consultationFee: z.number().nonnegative(),
  slotDurationMinutes: z.number().positive(),
  workingDays: z.array(z.string()),
  startTime: z.string(),
  endTime: z.string(),
  breakStart: z.string(),
  breakEnd: z.string(),
  languages: z.array(z.string()),
  active: z.boolean()
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type Patient = z.infer<typeof patientSchema>;
export type Doctor = z.infer<typeof doctorSchema>;
