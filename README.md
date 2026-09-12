# Clinic Portal

This repository is the security-first clinic management and appointment system described in the project brief. The implementation is intentionally staged so each phase can be reviewed before the next one is built.

## Phase 1 delivered

- Next.js + TypeScript + Tailwind base app
- Firebase project and emulator configuration
- Separate patient and staff portal entry screens
- Default security headers and production-oriented app config
- Environment template and repo documentation stub

## Important security notes

- The system requires a separate patient portal and staff portal with role-based auth and strict cross-checking before any data is accessible.
- Shared clinic workstations should not use shared staff logins because audit trails become unreliable.
- App Check, Cloud Armor, KMS-encrypted clinical fields, and independent security review are required before real patient data goes live.

## Local development

1. Copy `.env.example` to `.env.local` and fill in Firebase values.
2. Start the Firebase emulators:
   `firebase emulators:start --only auth,firestore,storage,functions`
3. Run the app:
   `npm run dev`

## Build and test commands

- `npm run lint`
- `npm run build`
- `npm run test`

## Deployment

- Use the three Firebase projects `clinic-dev`, `clinic-staging`, and `clinic-prod`.
- Production is strictly separated from development and staging and must never be used for developer testing.

## Security review requirement

This build needs an independent security review and a penetration test before real patient data is loaded. That requirement is part of the project acceptance bar.
