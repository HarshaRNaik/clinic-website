"use client";

import { saveClinicData, saveClinicProfile } from "@/lib/clinic-db";
import { saveClinicAccount } from "@/lib/clinic-backend";
import {
  DEMO_DOCTOR_EMAIL,
  DEMO_DOCTOR_NAME,
  DEMO_PATIENT_EMAIL,
  DEMO_PATIENT_ID,
  prototypeMode,
  stopDemoTour
} from "@/lib/prototype-mode";

const SEED_KEY = "arogya-prototype-seed-v3";

const today = new Date().toISOString().slice(0, 10);

const doctors: Array<[string, string, string, number, string]> = [
  ["doctor-demo-user", DEMO_DOCTOR_NAME, "General Medicine", 500, "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80"],
  ["doctor-cardio", "Dr. Nisha Rao", "Cardiology", 900, "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80"],
  ["doctor-derm", "Dr. Meera Nair", "Dermatology", 700, "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80"],
  ["doctor-gastro", "Dr. Rohan Iyer", "Gastroenterology", 800, "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80"],
  ["doctor-peds", "Dr. Kavya Menon", "Pediatrics", 650, "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=300&q=80"],
  ["doctor-ortho", "Dr. Sneh Verma", "Orthopedics", 750, "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80"]
];

const patients: Array<[string, string, string, string, string, string[]]> = [
  ["patient-demo-user", DEMO_PATIENT_EMAIL, "Riya Sharma", "+91 98765 43210", DEMO_PATIENT_ID, ["Penicillin allergy"]],
  ["patient-2", "anika.rao@example.com", "Anika Rao", "+91 98111 22220", "AC-2026-ANIK-2", []],
  ["patient-3", "kiran.shah@example.com", "Kiran Shah", "+91 98111 22221", "AC-2026-KIRN-3", []],
  ["patient-4", "maya.iyer@example.com", "Maya Iyer", "+91 98111 22222", "AC-2026-MAYA-4", []],
  ["patient-5", "farah.khan@example.com", "Farah Khan", "+91 98111 22223", "AC-2026-FARH-5", []],
  ["patient-6", "dev.patel@example.com", "Dev Patel", "+91 98111 22224", "AC-2026-DEVP-6", []],
  ["patient-7", "tara.sen@example.com", "Tara Sen", "+91 98111 22225", "AC-2026-TARA-8", []],
  ["patient-8", "neel.das@example.com", "Neel Das", "+91 98111 22226", "AC-2026-NEEL-9", []],
  ["patient-9", "pooja.nair@example.com", "Pooja Nair", "+91 98111 22227", "AC-2026-POOJ-1", []],
  ["patient-10", "arav.menon@example.com", "Arav Menon", "+91 98111 22228", "AC-2026-ARAV-0", []],
  ["patient-11", "isha.reddy@example.com", "Isha Reddy", "+91 98111 22229", "AC-2026-ISHA-6", []],
  ["patient-12", "omar.ali@example.com", "Omar Ali", "+91 98111 22230", "AC-2026-OMAR-4", []]
];

const notes = [
  "Fever settled after hydration and paracetamol. No breathing difficulty.",
  "Blood pressure reviewed. Lifestyle advice reinforced and medication continued.",
  "Acidity improved. Trigger foods discussed in plain language.",
  "Rash resolving. Moisturizer and antihistamine reviewed.",
  "Knee pain improving with exercises. No red flag symptoms.",
  "Lab values stable. Follow-up planned only if symptoms return."
];

export async function seedPrototypeData({ resetTour = false, force = false } = {}) {
  if ((!prototypeMode && !force) || typeof window === "undefined") return;
  if (resetTour) {
    stopDemoTour();
    window.localStorage.removeItem(SEED_KEY);
  }
  if (window.localStorage.getItem(SEED_KEY) === "done") return;

  saveClinicAccount({
    uid: "patient-demo-user",
    email: DEMO_PATIENT_EMAIL,
    password: "Patient@123",
    role: "patient",
    fullName: "Riya Sharma",
    phone: "+91 98765 43210",
    createdAt: "2026-09-12T00:00:00.000Z"
  });
  saveClinicAccount({
    uid: "doctor-demo-user",
    email: DEMO_DOCTOR_EMAIL,
    password: "Doctor@123",
    role: "staff",
    fullName: DEMO_DOCTOR_NAME,
    phone: "+91 91234 56789",
    createdAt: "2026-09-12T00:00:00.000Z"
  });
  window.localStorage.setItem(`clinic-patient-id:${DEMO_PATIENT_EMAIL}`, DEMO_PATIENT_ID);

  for (const [id, fullName, specialisation, fee, photoUrl] of doctors) {
    await saveClinicData("doctors", id, {
      id,
      fullName,
      specialisation,
      photoUrl,
      qualifications: ["MBBS", specialisation === "General Medicine" ? "MD Medicine" : `MD ${specialisation}`],
      registrationNumber: `KMC-${String(id).slice(-4).toUpperCase()}-2026`,
      consultationFee: fee,
      slotDurationMinutes: 30,
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      startTime: "09:00",
      endTime: "17:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      languages: ["English", "Hindi", "Kannada"],
      active: true
    });
    await saveClinicData("schedules", id, {
      doctorId: id,
      doctorName: fullName,
      effectiveFrom: today,
      recurring: Object.fromEntries(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => [
        day,
        { enabled: true, start: day === "Sat" ? "09:00" : "09:00", end: day === "Sat" ? "13:00" : "17:00", breakStart: "13:00", breakEnd: "14:00", slotDuration: 30, bufferMinutes: 5, maxBookings: 1 }
      ])),
      overrides: [],
      status: "published",
      updatedAt: new Date().toISOString()
    });
  }

  for (const [index, raw] of patients.entries()) {
    const [uid, email, fullName, phone, id, allergies] = raw;
    saveClinicAccount({ uid, email, password: "demo", role: "patient", fullName, phone, createdAt: "2026-08-01T09:00:00.000Z" });
    const visits = Array.from({ length: 2 + (index % 5) }, (_, visitIndex) => ({
      id: `${id}-visit-${visitIndex + 1}`,
      date: `2026-0${Math.max(4, 8 - visitIndex)}-${String(10 + index).padStart(2, "0")}`,
      doctor: doctors[(index + visitIndex) % doctors.length][1],
      summary: notes[(index + visitIndex) % notes.length],
      prescription: visitIndex % 2 === 0 ? "Paracetamol 650 mg as needed, fluids, rest" : "Continue current medicine and review in 2 weeks",
      vitals: { bp: `${112 + index}/${72 + visitIndex}`, pulse: 76 + index + visitIndex, tempF: 98.2 + (visitIndex % 3) * 0.4 }
    }));
    await saveClinicProfile({
      id,
      email,
      fullName,
      phone,
      dateOfBirth: `19${80 + (index % 18)}-0${(index % 9) + 1}-15`,
      createdAt: "2026-08-01T09:00:00.000Z",
      allergies,
      openedBy: index === 0 ? DEMO_DOCTOR_NAME : undefined,
      visits
    }, email);
  }

  const todayAppointments = [
    ["demo-appt-1", "Riya Sharma", DEMO_PATIENT_EMAIL, DEMO_PATIENT_ID, DEMO_DOCTOR_NAME, "General Medicine", "09:30", "Follow-up for fever and cough", "Confirmed"],
    ["demo-appt-2", "Anika Rao", "anika.rao@example.com", "AC-2026-ANIK-2", DEMO_DOCTOR_NAME, "General Medicine", "10:00", "Blood pressure review", "Confirmed"],
    ["demo-appt-3", "Kiran Shah", "kiran.shah@example.com", "AC-2026-KIRN-3", DEMO_DOCTOR_NAME, "General Medicine", "10:30", "Acidity follow-up", "Pending review"],
    ["demo-appt-4", "Maya Iyer", "maya.iyer@example.com", "AC-2026-MAYA-4", "Dr. Nisha Rao", "Cardiology", "11:00", "Chest discomfort review", "Confirmed"]
  ];
  for (const [id, patientName, patientEmail, patientId, doctor, specialty, time, reason, status] of todayAppointments) {
    await saveClinicData("appointments", id, { id, patientName, patientEmail, patientId, doctor, specialty, date: today, time, reason, status, createdAt: `${today}T08:00:00.000Z` });
  }
  await saveClinicData("appointments", "demo-past-1", { id: "demo-past-1", patientName: "Riya Sharma", patientEmail: DEMO_PATIENT_EMAIL, patientId: DEMO_PATIENT_ID, doctor: DEMO_DOCTOR_NAME, specialty: "General Medicine", date: "2026-08-24", time: "10:30", reason: "Viral fever review", status: "Completed", createdAt: "2026-08-20T09:00:00.000Z" });
  await saveClinicData("appointments", "demo-past-2", { id: "demo-past-2", patientName: "Riya Sharma", patientEmail: DEMO_PATIENT_EMAIL, patientId: DEMO_PATIENT_ID, doctor: "Dr. Meera Nair", specialty: "Dermatology", date: "2026-07-18", time: "16:00", reason: "Skin allergy", status: "Completed", createdAt: "2026-07-15T09:00:00.000Z" });

  await saveClinicData("notices", "notice-demo-1", { id: "notice-demo-1", type: "reminder", title: "Carry previous reports", text: "Bring your recent CBC report for today's follow-up.", patientEmail: DEMO_PATIENT_EMAIL, requiresAck: true, acknowledged: false, publishAt: "2026-09-12T00:00:00.000Z" });
  await saveClinicData("notices", "notice-demo-2", { id: "notice-demo-2", type: "broadcast", title: "Flu clinic open", text: "Evening vaccination slots are available this week.", requiresAck: false, acknowledged: false, publishAt: "2026-09-12T00:00:00.000Z" });
  await saveClinicData("notices", "notice-demo-3", { id: "notice-demo-3", type: "appointment-confirmed", title: "Appointment confirmed", text: "Your General Medicine follow-up is confirmed for today.", patientEmail: DEMO_PATIENT_EMAIL, requiresAck: false, acknowledged: false, publishAt: "2026-09-12T00:00:00.000Z" });

  window.localStorage.setItem(SEED_KEY, "done");
}
