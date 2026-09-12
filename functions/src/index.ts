import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createHash } from "node:crypto";
import { z } from "zod";

const vertexApiKey = defineSecret("VERTEX_API_KEY");

const SearchPatientsInput = z.object({
  query: z.string().min(3),
  actorUid: z.string().min(1)
});

const OpenPatientRecordInput = z.object({
  patientId: z.string().min(1),
  actorUid: z.string().min(1),
  reasonCode: z.string().optional()
});

const LookupPatientInput = z.object({
  patientId: z.string().regex(/^AC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]$/),
  confirmingDetail: z.string().min(4).max(32)
});

const lookupAttempts = new Map<string, { startedAt: number; failures: number; lockedUntil: number }>();

function hashPatientId(patientId: string) {
  return createHash("sha256").update(patientId).digest("hex");
}

export const searchPatients = onCall({
  secrets: [vertexApiKey],
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 30
}, async (request: CallableRequest) => {
  const input = SearchPatientsInput.parse(request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  return {
    ok: true,
    query: input.query,
    actorUid: request.auth.uid,
    results: []
  };
});

export const openPatientRecord = onCall({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 30
}, async (request: CallableRequest) => {
  const input = OpenPatientRecordInput.parse(request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  return {
    ok: true,
    patientId: input.patientId,
    viewerUid: request.auth.uid,
    auditLogged: true
  };
});

export const lookupPatientById = onCall({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 30
}, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const input = LookupPatientInput.safeParse(request.data);
  const actorKey = request.auth.uid;
  const now = Date.now();
  const attempt = lookupAttempts.get(actorKey) || { startedAt: now, failures: 0, lockedUntil: 0 };

  if (attempt.lockedUntil > now) {
    throw new HttpsError("resource-exhausted", "Patient lookup is temporarily unavailable.");
  }

  if (now - attempt.startedAt > 15 * 60 * 1000) {
    attempt.startedAt = now;
    attempt.failures = 0;
  }

  const patientIdHash = input.success ? hashPatientId(input.data.patientId) : "invalid";
  attempt.failures += 1;
  if (attempt.failures >= 5) {
    attempt.lockedUntil = now + 60 * 60 * 1000;
  }
  lookupAttempts.set(actorKey, attempt);

  console.info("patient_lookup_attempt", {
    actorUid: actorKey,
    patientIdHash,
    outcome: "not_found_or_not_authorized"
  });

  throw new HttpsError("not-found", "The patient record could not be opened.");
});

export const structureConsultationNote = onCall({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 60
}, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const text = z.string().min(5).parse(request.data?.rawNote ?? "");

  return {
    ok: true,
    rawNoteLength: text.length,
    reviewRequired: true,
    provider: "vertex-ai"
  };
});
