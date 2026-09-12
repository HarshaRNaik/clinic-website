import { appointmentSchema, type Appointment } from "@/lib/data/types";
import { listClinicAppointments, saveClinicAppointment } from "@/lib/clinic-db";

export async function createAppointment(input: Appointment) {
  const appointment = appointmentSchema.parse(input);
  await saveClinicAppointment(appointment, appointment.id || `appointment-${Date.now()}`);
  return appointment;
}

export async function listAppointments(): Promise<Appointment[]> {
  const records = await listClinicAppointments();
  return records.flatMap((record) => {
    const result = appointmentSchema.safeParse(record);
    return result.success ? [result.data] : [];
  });
}

export async function listAppointmentsForPatient(email: string) {
  const appointments = await listAppointments();
  return appointments.filter((appointment) => appointment.patientEmail === email);
}

export async function listAppointmentsForDoctor(doctor: string) {
  const appointments = await listAppointments();
  return appointments.filter((appointment) => appointment.doctor === doctor);
}
