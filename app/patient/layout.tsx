import { PatientShell } from "@/components/portal/PatientShell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
