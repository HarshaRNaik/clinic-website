# Incident response runbook

## 1. Revoke all sessions
- Disable the affected account in Firebase Authentication.
- Revoke all sessions through the admin-support function.
- Force a token refresh and clear client caches.

## 2. Lock a user account
- Disable the Firebase user account.
- Block the role via custom claim update.
- Reset the password and require MFA reset if needed.

## 3. Pull the audit trail for one patient
- Query auditLogs by targetId or patientId.
- Export the relevant timeline and timestamp range.
- Confirm the incident period with the clinic owner.

## 4. Notification path
- Notify the clinic owner and security contact immediately.
- Notify the data protection officer if patient data has been exposed.

## 5. DPDP breach timeline
- Internal assessment within 24 hours.
- Regulator notification according to applicable DPDP obligations and clinic legal counsel instructions.
