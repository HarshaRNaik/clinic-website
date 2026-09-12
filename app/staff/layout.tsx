import { StaffShell } from "@/components/portal/StaffShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
