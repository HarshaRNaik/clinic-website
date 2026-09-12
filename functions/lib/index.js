"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structureConsultationNote = exports.lookupPatientById = exports.openPatientRecord = exports.searchPatients = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const vertexApiKey = (0, params_1.defineSecret)("VERTEX_API_KEY");
const SearchPatientsInput = zod_1.z.object({
    query: zod_1.z.string().min(3),
    actorUid: zod_1.z.string().min(1)
});
const OpenPatientRecordInput = zod_1.z.object({
    patientId: zod_1.z.string().min(1),
    actorUid: zod_1.z.string().min(1),
    reasonCode: zod_1.z.string().optional()
});
const LookupPatientInput = zod_1.z.object({
    patientId: zod_1.z.string().regex(/^AC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]$/),
    confirmingDetail: zod_1.z.string().min(4).max(32)
});
const lookupAttempts = new Map();
function hashPatientId(patientId) {
    return (0, node_crypto_1.createHash)("sha256").update(patientId).digest("hex");
}
exports.searchPatients = (0, https_1.onCall)({
    secrets: [vertexApiKey],
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 30
}, async (request) => {
    const input = SearchPatientsInput.parse(request.data);
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    return {
        ok: true,
        query: input.query,
        actorUid: request.auth.uid,
        results: []
    };
});
exports.openPatientRecord = (0, https_1.onCall)({
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 30
}, async (request) => {
    const input = OpenPatientRecordInput.parse(request.data);
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    return {
        ok: true,
        patientId: input.patientId,
        viewerUid: request.auth.uid,
        auditLogged: true
    };
});
exports.lookupPatientById = (0, https_1.onCall)({
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 30
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    const input = LookupPatientInput.safeParse(request.data);
    const actorKey = request.auth.uid;
    const now = Date.now();
    const attempt = lookupAttempts.get(actorKey) || { startedAt: now, failures: 0, lockedUntil: 0 };
    if (attempt.lockedUntil > now) {
        throw new https_1.HttpsError("resource-exhausted", "Patient lookup is temporarily unavailable.");
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
    throw new https_1.HttpsError("not-found", "The patient record could not be opened.");
});
exports.structureConsultationNote = (0, https_1.onCall)({
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 60
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    const text = zod_1.z.string().min(5).parse(request.data?.rawNote ?? "");
    return {
        ok: true,
        rawNoteLength: text.length,
        reviewRequired: true,
        provider: "vertex-ai"
    };
});
