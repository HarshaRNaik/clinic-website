export type Appointment = {
  id: string;
  title: string;
  doctor: string;
  time: string;
  status: "Confirmed" | "Pending" | "Checked in";
  type: "Follow-up" | "Consultation" | "Lab review";
};

export type StaffTask = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};

export const patientAppointments: Appointment[] = [
  { id: "apt-1", title: "Cardiology follow-up", doctor: "Dr. Mehta", time: "Tue, 10:30 AM", status: "Confirmed", type: "Follow-up" },
  { id: "apt-2", title: "Lab review", doctor: "Dr. Sethi", time: "Thu, 2:00 PM", status: "Pending", type: "Lab review" },
  { id: "apt-3", title: "General checkup", doctor: "Dr. Kapoor", time: "Mon, 9:15 AM", status: "Checked in", type: "Consultation" }
];

export const staffTasks: StaffTask[] = [
  { id: "task-1", title: "Review follow-up notes", detail: "3 notes need clinician sign-off before noon.", priority: "High" },
  { id: "task-2", title: "Patient reminders", detail: "7 appointment reminders scheduled for today.", priority: "Medium" },
  { id: "task-3", title: "Insurance verification", detail: "3 cases still pending documentation.", priority: "Low" }
];

export const patientMetrics = [
  { label: "Next visit", value: "Tue", detail: "10:30 AM · Cardiology" },
  { label: "Pending tests", value: "2", detail: "Blood work and ECG" },
  { label: "Care summary", value: "Stable", detail: "Follow-up plan active" }
];

export const clinicMetrics = [
  { label: "Appointments", value: "18" },
  { label: "Checked in", value: "7" },
  { label: "Pending review", value: "3" }
];

export const staffAlerts = [
  "2 patients require medication follow-up",
  "1 lab report pending sign-off",
  "Insurance verification for 3 cases"
];
