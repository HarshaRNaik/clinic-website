import { listAppointments } from "@/lib/data/appointments";

export async function getOperationalAnalytics() {
  const appointments = await listAppointments();
  const byDoctor = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const appointment of appointments) {
    byDoctor.set(appointment.doctor, (byDoctor.get(appointment.doctor) || 0) + 1);
    byStatus.set(appointment.status, (byStatus.get(appointment.status) || 0) + 1);
  }

  return {
    totalAppointments: appointments.length,
    byDoctor: [...byDoctor.entries()].map(([doctor, count]) => ({ doctor, count })),
    byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count }))
  };
}
