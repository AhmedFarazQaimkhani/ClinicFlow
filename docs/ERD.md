# ClinicFlow ERD

Clinic isolation: every clinical and financial table has `clinic_id`. API queries always use the authenticated user's clinic, never a client-supplied clinic id.

```
Clinic 1──* User
Clinic 1──* Doctor ──1 User
Clinic 1──* Patient
Clinic 1──1 ClinicSettings
Clinic 1──1 ClinicSequence

Patient 1──* Token ──1 Doctor
Token 1──1 Visit ──1 Patient
Visit 1──1 Prescription ──* PrescriptionItem ──1 Medicine
Prescription 1──* Dispensing
Dispensing.type = NEW_PRESCRIPTION | REPEAT
Dispensing 1──* DispensingItem
Dispensing 1──* Payment
Visit 1──* Payment   (consultation fee; nullable on repeat payments)

RepeatRequest (only if clinic requires doctor approval)
```

## Core rule

- **Visit** = an actual doctor consultation, always created with a **Token**.
- **Repeat dispensing** links to an existing Prescription. `visit_id` on that payment is null. No new Token. No new Visit.
