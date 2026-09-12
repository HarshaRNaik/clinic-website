# NLP methodology

## Problem framing

This project treats consultation-note structuring as an information-extraction and summarisation task rather than a general-purpose medical chatbot. The goal is to convert shorthand clinical notes into structured, reviewable fields that doctors can verify before saving. This is a good fit for the business problem because the clinic has real, high-volume free-text notes and needs searchable, auditable fields without forcing the doctor to re-enter everything in a rigid form.

## Tooling and model

The implementation is designed around a Vertex AI Gemini backend in the project region, behind a provider abstraction. That keeps the architecture adaptable while defaulting to a region-local, enterprise path for health data. In this repo, the provider boundary is represented as a simple interface pattern for future server-side implementation.

## De-identification method

Before a model call, the system strips direct identifiers such as patient names, phone numbers, email addresses, and record IDs and replaces them with placeholder tokens. A second pass is reserved for Cloud DLP safeguards so that outbound payloads do not contain leaked identifiers. This is required because the model input should never contain patient identity data.

## Evaluation approach

The project includes a synthetic evaluation harness under the `scripts/nlp-eval/` path, using labelled notes that cover abbreviations, code-mixed text, missing fields, ambiguous dosages, and negation-heavy examples. The evaluation is designed to surface failure modes explicitly, especially where a note says "no shortness of breath" and the model incorrectly records the symptom as present.

## Key risk areas

The expected failure classes are:

- invented diagnoses not actually present in the note
- dosage or frequency misreads
- confusion between similar drug names or shorthand
- negation missed in symptoms and adverse history
- duration attached to the wrong medication
- low-confidence extractions that should be shown to the doctor for manual review

## Limitations

This system is intended to assist a doctor, not replace clinical judgment. The model is never allowed to auto-save extracted data without a doctor review step. The raw note remains the authoritative record, and the structured output is only a support layer. This limits automation risk while still making the note searchable and auditable.
