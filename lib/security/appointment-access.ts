import type { Appointment } from "@/lib/data/types";

export function canOpenAppointmentRecord(appointment: Appointment, doctorName: string, referenceDate = new Date()) {
  if (appointment.doctor !== doctorName) return false;
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  const days = Math.abs(appointmentDate.getTime() - referenceDate.getTime()) / 86_400_000;
  return days <= 1;
}

export function filterDoctorSchedule(appointments: Appointment[], doctorName: string, referenceDate = new Date()) {
  return appointments.filter((appointment) => canOpenAppointmentRecord(appointment, doctorName, referenceDate));
}
