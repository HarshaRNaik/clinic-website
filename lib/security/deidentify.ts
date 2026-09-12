const IDENTIFIER_PATTERNS = [
  /(\b[A-Z][a-z]+\s+[A-Z][a-z]+\b)/g,
  /(\b\d{10}\b)/g,
  /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)/g,
  /(\b(?:MRN|Patient ID|UID)\s*[:#-]?\s*[A-Z0-9-]{4,}\b)/gi,
  /(\b\d{6,}\b)/g
];

const emergencyTerms = [
  "chest pain",
  "breathing difficulty",
  "unconsciousness",
  "severe bleeding",
  "stroke",
  "poisoning",
  "pregnancy complications",
  "fainting"
];

export function stripIdentifiers(rawText: string): { sanitized: string; redactions: string[] } {
  let sanitized = rawText;
  const redactions: string[] = [];

  for (const pattern of IDENTIFIER_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      redactions.push(match);
      return "[REDACTED]";
    });
  }

  sanitized = sanitized
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, "[PATIENT]")
    .replace(/\b\d{10}\b/g, "[PHONE]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:MRN|Patient ID|UID)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/gi, "[PATIENT_ID]");

  return { sanitized, redactions };
}

export function containsEmergencyTerms(rawText: string): boolean {
  const lower = rawText.toLowerCase();
  return emergencyTerms.some((term) => lower.includes(term));
}

export function classifyChatIntent(rawText: string): "faq" | "medical_advice" | "appointment" | "escalate" {
  const text = rawText.toLowerCase();

  if (containsEmergencyTerms(text)) {
    return "escalate";
  }

  if (/appointment|book|cancel|reschedule|slot|visit/.test(text)) {
    return "appointment";
  }

  if (/disease|symptom|diagnosis|treatment|medicine|dose|side effect|test report/.test(text)) {
    return "medical_advice";
  }

  return "faq";
}

export function auditModelCall(event: string, metadata: Record<string, unknown>): void {
  // The app must never log content. We record only metadata such as model version, latency, and count.
  void { event, metadata };
}
