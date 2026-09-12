"use client";

import { useState } from "react";
import {
  getExtractionMeta,
  structureConsultationNote,
  type ConsultationStructure
} from "@/lib/nlp/consultation-structure";
import { saveClinicData } from "@/lib/clinic-db";

const rawNote = `38F c/o fever x3d, dry cough, no SOB. Temp 100.4, BP 118/76, PR 92. ?viral URI. T. PCM 650 BD x5d, Levocet OD HS, steam inhalation. RV 5d if no better. Adv: hydration, rest.`;

type FieldChange = keyof ConsultationStructure | `demographics.${"age" | "sex"}` | `vitals.${"tempF" | "bp" | "pulse"}` | `followUp.${"afterDays" | "condition"}` | `confidence.${"prescriptions" | "diagnosis"}`;

const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const joinLines = (items: string[]) => items.join("\n");
const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block font-semibold text-ink-900">{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-[6px] border border-border px-3 font-normal text-ink-900" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 3 }: { label: string; value: string; rows?: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block font-semibold text-ink-900">{label}</label>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-[6px] border border-border px-3 py-2 font-normal text-ink-900" />
    </div>
  );
}

export function DoctorReviewPanel() {
  const [note, setNote] = useState(rawNote);
  const [extraction, setExtraction] = useState<ConsultationStructure>(() => structureConsultationNote(rawNote));
  const [editedFields, setEditedFields] = useState<FieldChange[]>([]);
  const [saved, setSaved] = useState(false);
  const meta = getExtractionMeta();

  function markEdited(field: FieldChange) {
    setEditedFields((current) => current.includes(field) ? current : [...current, field]);
    setSaved(false);
  }

  function structure() {
    setExtraction(structureConsultationNote(note));
    setEditedFields([]);
    setSaved(false);
  }

  async function approve() {
    await saveClinicData("demo-consultations", `demo-${Date.now()}`, {
      rawNote: note,
      structuredOutput: extraction,
      reviewedBy: "demo-doctor",
      editedFields,
      modelVersion: meta.modelVersion,
      approvedAt: new Date().toISOString()
    });
    setSaved(true);
  }

  function update(field: FieldChange, updater: (current: ConsultationStructure) => ConsultationStructure) {
    setExtraction(updater);
    markEdited(field);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[8px] border border-border bg-surface p-6">
        <h2 className="font-serif text-xl font-semibold text-ink-900">Original consultation note</h2>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 min-h-64 w-full rounded-[6px] border border-border bg-surface-warm p-3 text-ink-900" />
        <button type="button" onClick={structure} data-tour="structure-note" className="mt-4 min-h-11 rounded-[6px] bg-clinic-800 px-4 py-2 font-semibold text-white">Structure note</button>
      </div>

      <div className="rounded-[8px] border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink-900">Review every extracted field</h2>
            <p className="mt-1 text-sm text-ink-500">Nothing is saved until the doctor approves it.</p>
          </div>
          <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">Review required</span>
        </div>

        <div className="mt-5 space-y-5 text-sm text-ink-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Age" value={extraction.demographics.age?.toString() ?? ""} onChange={(value) => update("demographics.age", (current) => ({ ...current, demographics: { ...current.demographics, age: numberOrNull(value) } }))} />
            <div>
              <label className="block font-semibold text-ink-900">Sex</label>
              <select value={extraction.demographics.sex ?? "Unknown"} onChange={(event) => update("demographics.sex", (current) => ({ ...current, demographics: { ...current.demographics, sex: event.target.value as ConsultationStructure["demographics"]["sex"] } }))} className="mt-1 min-h-11 w-full rounded-[6px] border border-border px-3 font-normal text-ink-900">
                <option>F</option>
                <option>M</option>
                <option>Other</option>
                <option>Unknown</option>
              </select>
            </div>
          </div>

          <TextField label="Chief complaint" value={extraction.chiefComplaint ?? ""} onChange={(value) => update("chiefComplaint", (current) => ({ ...current, chiefComplaint: value || null }))} />
          <TextAreaField label="Symptoms, one per line" value={joinLines(extraction.symptoms.map((item) => `${item.term}${item.durationDays ? ` | ${item.durationDays} days` : ""}`))} onChange={(value) => update("symptoms", (current) => ({ ...current, symptoms: splitLines(value).map((line) => {
            const [term, duration] = line.split("|").map((item) => item.trim());
            return { term, durationDays: duration ? Number(duration.replace(/\D/g, "")) : null };
          }) }))} />
          <TextAreaField label="Negatives, one per line" value={joinLines(extraction.negatives)} onChange={(value) => update("negatives", (current) => ({ ...current, negatives: splitLines(value) }))} />

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Temperature F" value={extraction.vitals.tempF?.toString() ?? ""} onChange={(value) => update("vitals.tempF", (current) => ({ ...current, vitals: { ...current.vitals, tempF: numberOrNull(value) } }))} />
            <TextField label="BP" value={extraction.vitals.bp ?? ""} onChange={(value) => update("vitals.bp", (current) => ({ ...current, vitals: { ...current.vitals, bp: value || null } }))} />
            <TextField label="Pulse" value={extraction.vitals.pulse?.toString() ?? ""} onChange={(value) => update("vitals.pulse", (current) => ({ ...current, vitals: { ...current.vitals, pulse: numberOrNull(value) } }))} />
          </div>

          <TextAreaField label="Diagnosis, one per line as term | suspected or confirmed" value={joinLines(extraction.provisionalDiagnosis.map((item) => `${item.term} | ${item.certainty ?? ""}`))} onChange={(value) => update("provisionalDiagnosis", (current) => ({ ...current, provisionalDiagnosis: splitLines(value).map((line) => {
            const [term, certainty] = line.split("|").map((item) => item.trim());
            return { term, certainty: certainty === "confirmed" ? "confirmed" : "suspected" };
          }) }))} />

          <div data-tour="low-confidence-field"><TextAreaField label="Prescriptions, one per line as drug | brand | dose | frequency | timing | days" rows={4} value={joinLines(extraction.prescriptions.map((item) => [item.drug, item.brandOrAbbrev, item.dose, item.frequency, item.timing, item.durationDays].map((part) => part ?? "").join(" | ")))} onChange={(value) => update("prescriptions", (current) => ({ ...current, prescriptions: splitLines(value).map((line) => {
            const [drug, brandOrAbbrev, dose, frequency, timing, days] = line.split("|").map((item) => item.trim());
            return { drug: drug || null, brandOrAbbrev: brandOrAbbrev || null, dose: dose || null, frequency: frequency || null, timing: timing || null, durationDays: days ? Number(days) : null };
          }) }))} /></div>

          <TextAreaField label="Advice, one per line" value={joinLines(extraction.advice)} onChange={(value) => update("advice", (current) => ({ ...current, advice: splitLines(value) }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Follow-up after days" value={extraction.followUp.afterDays?.toString() ?? ""} onChange={(value) => update("followUp.afterDays", (current) => ({ ...current, followUp: { ...current.followUp, afterDays: numberOrNull(value) } }))} />
            <TextField label="Follow-up condition" value={extraction.followUp.condition ?? ""} onChange={(value) => update("followUp.condition", (current) => ({ ...current, followUp: { ...current.followUp, condition: value || null } }))} />
          </div>
          <TextAreaField label="Patient summary" value={extraction.patientSummary ?? ""} onChange={(value) => update("patientSummary", (current) => ({ ...current, patientSummary: value || null }))} />

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Diagnosis confidence" value={extraction.confidence.diagnosis?.toString() ?? ""} onChange={(value) => update("confidence.diagnosis", (current) => ({ ...current, confidence: { ...current.confidence, diagnosis: numberOrNull(value) } }))} />
            <TextField label="Prescription confidence" value={extraction.confidence.prescriptions?.toString() ?? ""} onChange={(value) => update("confidence.prescriptions", (current) => ({ ...current, confidence: { ...current.confidence, prescriptions: numberOrNull(value) } }))} />
          </div>
          <TextAreaField label="Unparsed fragments, one per line" value={joinLines(extraction.unparsed)} onChange={(value) => update("unparsed", (current) => ({ ...current, unparsed: splitLines(value) }))} />

          <div className="rounded-[6px] border border-warning bg-marigold-100 p-3 text-warning">
            <p className="font-semibold">Extraction metadata</p>
            <p>{meta.provider} / {meta.modelVersion} / {meta.promptVersion}</p>
          </div>
        </div>

        <button type="button" onClick={() => void approve()} data-tour="sign-save" className="mt-6 min-h-11 rounded-[6px] bg-care-700 px-4 py-2 font-semibold text-white">Sign & Save</button>
        {saved ? <p className="mt-3 text-sm font-semibold text-success" role="status">Approved extraction saved to the demo collection.</p> : null}
      </div>
    </section>
  );
}
