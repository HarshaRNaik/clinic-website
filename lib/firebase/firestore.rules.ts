export const firestoreRuleComments = {
  root: "Root deny-all default; all collection access is opened explicitly by a server-only function layer.",
  patients: "Protects patient identity and profile data. Direct client reads are denied.",
  visits: "Clinical notes are immutable once signed and never deletable by any client.",
  auditLogs: "Append-only audit history; clients cannot write or read other users' audit records.",
  chatSessions: "Patient chat transcripts are scoped to their own record and escalation flows only."
};

export const defaultDenyRootRule = "allow read, write: if false;";
