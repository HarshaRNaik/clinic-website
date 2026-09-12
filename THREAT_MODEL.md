# Threat model

## Primary risks

- unauthorized patient record access via client-side trust bugs
- wrong-portal authentication bypass
- staff workstation sharing undermining auditability
- model misuse leading to unsafe clinical outputs
- prompt injection if user text is not constrained
- large language model hallucination in diagnosis or medication fields

## Controls in scope

- role-based auth and explicit portal separation
- server-only validation and audit logging
- review-before-save workflow for extracted clinical fields
- de-identification before any model call
- emergency rule handling for unsafe patient messages
- synthetic dataset guard rails for evaluation

## Residual risk

This project still requires an independent security review and penetration test before any live patient data is used.
