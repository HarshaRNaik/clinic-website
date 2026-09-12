export function sanitizeUntrustedInput(message: string): string {
  const blockedPatterns = [
    /ignore previous instructions/i,
    /reveal your prompt/i,
    /act as admin/i,
    /system prompt/i,
    /stack trace/i,
    /internal id/i,
    /another patient's/i
  ];

  let sanitized = message;
  for (const pattern of blockedPatterns) {
    sanitized = sanitized.replace(pattern, "[redacted]");
  }

  return sanitized.trim();
}

export function isPromptInjectionAttempt(message: string): boolean {
  return /ignore previous instructions|reveal your prompt|act as admin|system prompt|developer mode/i.test(message);
}
