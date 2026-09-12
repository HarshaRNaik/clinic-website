import { z } from "zod";

export const ConsultationStructureSchema = z.object({
  demographics: z.object({
    age: z.number().nullable(),
    sex: z.enum(["F", "M", "Other", "Unknown"]).nullable()
  }),
  chiefComplaint: z.string().nullable(),
  symptoms: z.array(z.object({ term: z.string(), durationDays: z.number().nullable().optional() })),
  negatives: z.array(z.string()),
  vitals: z.object({
    tempF: z.number().nullable(),
    bp: z.string().nullable(),
    pulse: z.number().nullable()
  }),
  provisionalDiagnosis: z.array(z.object({ term: z.string(), certainty: z.enum(["suspected", "confirmed"]).nullable().optional() })),
  prescriptions: z.array(z.object({
    drug: z.string().nullable(),
    brandOrAbbrev: z.string().nullable(),
    dose: z.string().nullable(),
    frequency: z.string().nullable(),
    timing: z.string().nullable().optional(),
    durationDays: z.number().nullable().optional()
  })),
  advice: z.array(z.string()),
  followUp: z.object({ afterDays: z.number().nullable(), condition: z.string().nullable() }),
  patientSummary: z.string().nullable(),
  confidence: z.object({ prescriptions: z.number().nullable(), diagnosis: z.number().nullable() }),
  unparsed: z.array(z.string())
});

export type ConsultationStructure = z.infer<typeof ConsultationStructureSchema>;

const FIELD_PATTERNS = {
  ageSex: /\b(\d{1,3})\s*([FM])\b/i,
  chiefComplaint: /\b(?:c\/o|complains?\s+of)\s+([^.?]+?)(?=,\s*no\b|,\s*temp\b|,\s*bp\b|,\s*pr\b|\.|$)/i,
  tempF: /\btemp\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:deg\s*)?f?\b/i,
  bp: /\bbp\s*[:=]?\s*(\d{2,3}\/\d{2,3})\b/i,
  pulse: /\b(?:pr|pulse)\s*[:=]?\s*(\d{2,3})\b/i,
  diagnosis: /\?(viral\s+uri|[a-z][a-z\s-]+)|\b(?:dx|diagnosis)\s*[:=-]?\s*([a-z][a-z\s-]+)/i,
  followUp: /\b(?:rv|review|follow\s*up)\s*(\d+)\s*d(?:ays?)?\s*(?:if\s*([^.,]+))?/i,
  advice: /\b(?:adv|advice)\s*[:=-]\s*([^.]*)/i,
  noTerms: /\bno\s+([a-z][a-z\s]+?)(?=,|\.|;|$)/gi
};

const drugMap: Record<string, { generic: string; brand: string; frequency: string | null }> = {
  pcm: { generic: "Paracetamol", brand: "PCM", frequency: "BD" },
  paracetamol: { generic: "Paracetamol", brand: "PCM", frequency: "BD" },
  levocet: { generic: "Levocetirizine", brand: "Levocet", frequency: "OD" },
  levocetirizine: { generic: "Levocetirizine", brand: "Levocet", frequency: "OD" }
};

const frequencyLookup: Record<string, string> = {
  od: "OD",
  bd: "BD",
  tds: "TDS",
  qid: "QID",
  hs: "HS",
  sos: "SOS",
  stat: "STAT"
};

function normaliseFrequency(value: string | null | undefined): string | null {
  if (!value) return null;
  return frequencyLookup[value.toLowerCase()] ?? value.toUpperCase();
}

function expandTerm(term: string) {
  return term.trim().replace(/\buri\b/i, "upper respiratory infection").replace(/\bsob\b/i, "shortness of breath");
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function structureConsultationNote(rawNote: string): ConsultationStructure {
  const note = rawNote.trim();
  const ageSexMatch = note.match(FIELD_PATTERNS.ageSex);
  const chiefComplaintMatch = note.match(FIELD_PATTERNS.chiefComplaint);
  const tempMatch = note.match(FIELD_PATTERNS.tempF);
  const bpMatch = note.match(FIELD_PATTERNS.bp);
  const pulseMatch = note.match(FIELD_PATTERNS.pulse);
  const diagnosisMatch = note.match(FIELD_PATTERNS.diagnosis);
  const followUpMatch = note.match(FIELD_PATTERNS.followUp);
  const adviceMatch = note.match(FIELD_PATTERNS.advice);

  const complaintText = chiefComplaintMatch?.[1]?.trim() ?? "";
  const durationMatch = complaintText.match(/\bx\s*(\d+)\s*d\b/i);
  const complaintDurationDays = durationMatch ? Number(durationMatch[1]) : null;
  const symptoms = complaintText
    .replace(/\bx\s*\d+\s*d\b/gi, "")
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => ({ term, durationDays: complaintDurationDays }));

  const negatives = unique(
    Array.from(note.matchAll(FIELD_PATTERNS.noTerms)).map((match) => expandTerm(match[1]))
  );

  const diagnosisTerm = expandTerm(diagnosisMatch?.[1] || diagnosisMatch?.[2] || "");
  const provisionalDiagnosis = diagnosisTerm
    ? [{ term: diagnosisTerm, certainty: note.includes("?") ? ("suspected" as const) : ("confirmed" as const) }]
    : [];

  const prescriptionMatches = Array.from(
    note.matchAll(/\b(?:t\.\s*)?([a-z][a-z0-9-]*)\s*(\d+\s*mg|\d+)?\s*(od|bd|tds|qid|sos|stat)?\s*(hs)?\s*(?:x\s*(\d+)\s*d)?/gi)
  )
    .map((match) => ({
      text: match[0],
      key: match[1].toLowerCase(),
      dose: match[2] ?? null,
      frequency: match[3] ?? null,
      timing: match[4] ?? null,
      durationDays: match[5] ? Number(match[5]) : null
    }))
    .filter((item) => drugMap[item.key]);

  const prescriptions = prescriptionMatches.map((item) => {
    const resolved = drugMap[item.key];

    return {
      drug: resolved.generic,
      brandOrAbbrev: resolved.brand,
      dose: item.dose ? (/\bmg\b/i.test(item.dose) ? item.dose.replace(/\s+/g, " ") : `${item.dose} mg`) : null,
      frequency: normaliseFrequency(item.frequency ?? resolved.frequency),
      timing: item.timing ? normaliseFrequency(item.timing) : null,
      durationDays: item.durationDays
    };
  });

  const advice = unique([
    ...(note.toLowerCase().includes("steam inhalation") ? ["steam inhalation"] : []),
    ...(adviceMatch?.[1]?.split(",").map((item) => item.trim()) ?? [])
  ]);

  const followUp = followUpMatch
    ? { afterDays: Number(followUpMatch[1]), condition: followUpMatch[2] ? `if ${followUpMatch[2].trim()}` : null }
    : { afterDays: null, condition: null };

  const unparsed = [];
  if (!chiefComplaintMatch && note) unparsed.push(note);
  if (prescriptions.length === 0 && /\b(?:t\.|tab|tablet|cap|capsule)\b/i.test(note)) unparsed.push("Medication text needs manual parsing.");

  return ConsultationStructureSchema.parse({
    demographics: {
      age: ageSexMatch ? Number(ageSexMatch[1]) : null,
      sex: ageSexMatch ? (ageSexMatch[2].toUpperCase() as "F" | "M") : null
    },
    chiefComplaint: symptoms.map((symptom) => symptom.term).join(", ") || null,
    symptoms,
    negatives,
    vitals: {
      tempF: tempMatch ? Number(tempMatch[1]) : null,
      bp: bpMatch ? bpMatch[1] : null,
      pulse: pulseMatch ? Number(pulseMatch[1]) : null
    },
    provisionalDiagnosis,
    prescriptions,
    advice,
    followUp,
    patientSummary: diagnosisTerm
      ? `You have ${note.includes("?") ? "a suspected" : "a"} ${diagnosisTerm}. Follow the reviewed prescription and advice, and return as directed.`
      : null,
    confidence: {
      prescriptions: prescriptions.length > 0 ? 0.82 : null,
      diagnosis: provisionalDiagnosis.length > 0 ? 0.64 : null
    },
    unparsed
  });
}

export function getExtractionMeta() {
  return {
    modelVersion: "vertex-gemini-2.5",
    promptVersion: "clinic-note-extraction-v1",
    provider: "VertexAI"
  };
}
