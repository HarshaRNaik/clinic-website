import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const rowSchema = z.object({
  fullName: z.string().min(1),
  specialisation: z.string().min(1),
  qualifications: z.string().min(1),
  registrationNumber: z.string().min(1),
  consultationFee: z.coerce.number().nonnegative(),
  slotDurationMinutes: z.coerce.number().positive(),
  workingDays: z.string().regex(/^(Mon|Tue|Wed|Thu|Fri|Sat)(\\|(Mon|Tue|Wed|Thu|Fri|Sat))*$/),
  startTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),
  endTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),
  breakStart: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),
  breakEnd: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),
  languages: z.string().min(1),
  active: z.coerce.boolean()
});

function parseCsvLine(line: string) {
  return line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((value) => value.replace(/^\"|\"$/g, ""));
}

const inputPath = process.argv[2] || resolve(process.cwd(), "scripts/seed/doctors.example.csv");
if (process.env.NODE_ENV === "production" || process.env.ALLOW_DOCTOR_SEED !== "true") {
  throw new Error("Doctor seed refused. Set ALLOW_DOCTOR_SEED=true in a non-production environment.");
}

const [headerLine, ...lines] = readFileSync(inputPath, "utf8").trim().split(/\r?\n/);
const headers = parseCsvLine(headerLine);
const rows = lines.filter(Boolean).map((line) => Object.fromEntries(parseCsvLine(line).map((value, index) => [headers[index], value])));
const validated = rows.map((row, index) => {
  const result = rowSchema.safeParse(row);
  if (!result.success) throw new Error(`Invalid doctor row ${index + 2}: ${result.error.message}`);
  return result.data;
});

for (const [index, doctor] of validated.entries()) {
  console.log(JSON.stringify({
    id: `doctor-${String(index + 1).padStart(3, "0")}`,
    ...doctor,
    qualifications: doctor.qualifications.split("|"),
    workingDays: doctor.workingDays.split("|"),
    languages: doctor.languages.split("|")
  }));
}
console.log(`Validated ${validated.length} doctors. Import into Firestore with the doctors repository in a non-production environment.`);
