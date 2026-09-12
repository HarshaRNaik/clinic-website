export type Portal = "patient" | "staff";
export type Role = "patient" | "doctor" | "receptionist" | "admin";

export function canAccessPortal(role: Role | null | undefined, portal: Portal): boolean {
  if (!role) return false;
  if (portal === "patient") return role === "patient";
  return ["doctor", "receptionist", "admin"].includes(role);
}

export function getGenericAuthError(): string {
  return "Invalid credentials";
}

export function assertPortalAccess(role: Role | null | undefined, portal: Portal): void {
  if (!canAccessPortal(role, portal)) {
    throw new Error(getGenericAuthError());
  }
}

export function buildPortalMismatchHint(portal: Portal): string {
  return `The ${portal} portal requires the matching account role only.`;
}
