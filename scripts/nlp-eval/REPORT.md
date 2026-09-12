# NLP evaluation report

This report is intentionally placeholder output for the initial scaffolding phase. The full evaluation harness will be completed after the structured extraction service is implemented and connected to the synthetic dataset.

## Summary

- Dataset: synthetic notes only
- Scope: extraction, negation handling, shorthand parsing, and dosage parsing
- Current status: harness scaffolded, not yet connected to the production pipeline

## Risk areas tracked

- invented diagnoses
- missed negation
- drug-name confusions
- wrong dosage frequency parsing
- duration attached to the wrong medication

## Guardrails

- no real patient data in the dataset
- no phone or email patterns in the synthetic examples
- outputs must be human-reviewed before any save
