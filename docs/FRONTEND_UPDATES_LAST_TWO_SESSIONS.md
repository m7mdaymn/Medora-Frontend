# Frontend Integration Updates (Last Two Sessions)

This document summarizes backend changes that impact frontend behavior, API usage, and UI expectations across the last two implementation sessions.

## 1) Authentication and Tenant Boundaries

### Patient-only login
- Endpoint: `POST /api/auth/patient/login`
- Behavior update:
  - If authenticated account is not a patient role, response is now `403`.
  - Response message: `Only patient users can authenticate using patient login`.
- Frontend action:
  - Handle `403` distinctly from invalid credentials (`401`).
  - Show role-specific guidance (e.g., "Use staff login").

### X-Tenant enforcement on tenant users
- Endpoint: `GET /api/auth/me`
- Behavior update:
  - Non-super-admin users must provide `X-Tenant`.
  - Missing tenant header now returns `400`.
- Frontend action:
  - Ensure tenant header is always attached for tenant-scoped user sessions.

### Rate limiting added
- Auth endpoints (`/api/auth/login`, `/api/auth/patient/login`, `/api/auth/refresh`) are now throttled.
- Frontend action:
  - Handle `429 Too Many Requests` with retry messaging/countdown.

## 2) Doctor Self-Scope APIs

New APIs (doctor-focused UX):
- `GET /api/clinic/doctors/me`
- `GET /api/clinic/doctors/me/visit-fields`
- `PUT /api/clinic/doctors/me/visit-fields`
- `GET /api/clinic/doctors/me/patients`
- `GET /api/clinic/doctors/me/patients/{patientId}/history`
- `GET /api/clinic/visits/my/today`
- `GET /api/clinic/visits/my/patients`

Behavior:
- Doctor access is ownership-scoped; cross-doctor access returns logical denial.

Frontend action:
- Doctor dashboards should shift to `me/*` APIs rather than global IDs where possible.

## 3) Queue Workflow Changes

### Skip now reorders queue
- Endpoint: `POST /api/clinic/queue-tickets/{id}/skip`
- Behavior update:
  - Ticket is moved to queue tail (`Waiting`), not terminal skipped state.
- Frontend action:
  - Update queue board ordering logic after skip.
  - Do not treat skip as completed/terminal.

### Session close operational update
- Endpoint: `POST /api/clinic/queue-sessions/{id}/close?force=true|false`
- Behavior update:
  - `force=true` available for explicit operational closure.
  - Unserved paid tickets preserve credit semantics.
- Frontend action:
  - Add force-close toggle for authorized users.
  - Surface warnings before force-close action.

### Receptionist scope expanded
- Receptionist can operate more queue actions and sessions.
- Frontend action:
  - Enable queue controls in receptionist role-based views.

## 4) Booking + Queue Linkage

### Live booking auto-attach
- Endpoint: `POST /api/clinic/bookings`
- Behavior update:
  - Bookings in current operational window can auto-join active queue session.
- Frontend action:
  - After booking success, refresh queue indicators/ticket data if returned/linked.

### Cancellation policy split by actor
- Endpoints:
  - `POST /api/clinic/bookings/{id}/cancel`
  - `POST /api/clinic/bookings/{id}/reschedule`
- Behavior update:
  - Patient actions enforce cancellation window.
  - Admin/clinic-side actions can bypass patient window.
- Frontend action:
  - UI should reflect role-based policy differences.

## 5) Invoice and Finance Updates

### Business invoice number and search
- Endpoint: `GET /api/clinic/invoices?invoiceNumber=...`
- Behavior update:
  - Invoice number is first-class business field.
  - Search by invoice number is supported.

### Snapshot behavior
- Invoice DTO now includes snapshot fallbacks:
  - `patientName`
  - `patientPhone`
- Frontend impact:
  - Invoice history remains displayable even when patient profile changes/deletes.

### New invoice DTO fields
- `invoiceNumber`
- `isServiceRendered`
- `creditAmount`
- `creditIssuedAt`

Frontend action:
- Update invoice table/detail cards to render new fields.
- Add filter input for invoice number.

## 6) Retained Credit Foundation

### Normalized credit model introduced
New internal entities:
- `PatientCreditBalance`
- `PatientCreditTransaction`

New APIs:
- `GET /api/clinic/patient-credits/{patientId}/balance`
- `GET /api/clinic/patient-credits/{patientId}/history`

Frontend action:
- Add patient credit balance widget in patient profile/finance tabs.
- Add transaction timeline (reason, amount, balanceAfter, context IDs).

## 7) Media Upload (New)

### Managed upload endpoints
- `POST /api/clinic/media/clinic-logo` (multipart/form-data)
- `POST /api/clinic/media/doctors/{doctorId}/photo` (multipart/form-data)

Validation:
- Allowed image types: png, jpeg, webp
- File size limit enforced server-side

Storage and URL:
- Files are served via `/media/...` static route.
- Clinic/doctor responses expose managed URL values.

Frontend action:
- Use multipart upload forms.
- Handle validation errors (`400`) and show file requirements.
- Refresh clinic/doctor models after successful upload.

## 8) Public API Updates

### Available-now doctors
- Endpoint: `GET /api/public/{slug}/doctors/available-now`
- Behavior:
  - Returns doctors with active queue sessions.

### Public endpoint throttling
- Public API now rate-limited.
- Frontend action:
  - Handle `429` in public pages with retry/backoff UX.

## 9) Messaging Pipeline Foundation Upgrade

### Outbox lifecycle introduced
Message flow now supports:
- queued (`Pending`)
- dispatch attempt (`Sending`)
- success (`Sent` / `Delivered`)
- retry (`Retrying`)
- failure (`Failed`)

New message log fields exposed:
- `nextAttemptAt`
- `providerMessageId`
- `lastProviderStatus`
- `renderedBody`

Frontend action:
- Update message center/status badges for richer lifecycle states.
- Show retry timing and provider statuses where relevant.

## 10) CORS and Swagger in Production

- CORS remains open (`AllowAnyOrigin/Method/Header`) as requested.
- Swagger UI is available in production runtime as requested.

Frontend action:
- Cross-origin frontend apps can call API directly without browser CORS restrictions.

## 11) New/Updated Endpoint Quick Index

### New
- `POST /api/clinic/media/clinic-logo`
- `POST /api/clinic/media/doctors/{doctorId}/photo`
- `GET /api/clinic/patient-credits/{patientId}/balance`
- `GET /api/clinic/patient-credits/{patientId}/history`
- `GET /api/public/{slug}/doctors/available-now`
- `GET /api/clinic/doctors/me`
- `GET /api/clinic/doctors/me/visit-fields`
- `PUT /api/clinic/doctors/me/visit-fields`
- `GET /api/clinic/doctors/me/patients`
- `GET /api/clinic/doctors/me/patients/{patientId}/history`
- `GET /api/clinic/visits/my/today`
- `GET /api/clinic/visits/my/patients`

### Updated behavior
- `POST /api/auth/patient/login`
- `GET /api/auth/me`
- `POST /api/clinic/queue-sessions/{id}/close?force=true|false`
- `POST /api/clinic/queue-tickets/{id}/skip`
- `GET /api/clinic/invoices?invoiceNumber=...`
- `POST /api/clinic/bookings/{id}/cancel`
- `POST /api/clinic/bookings/{id}/reschedule`

## 12) Frontend Rollout Checklist

1. Add invoice number filter and display column.
2. Add force-close UI parameter in queue session management.
3. Update skip behavior assumptions in queue board UX.
4. Add media upload forms and preview refresh for clinic logo/doctor photo.
5. Add patient credit balance/history views.
6. Handle `403` non-patient login and `429` throttling consistently.
7. Update doctor portals to use new `me/*` APIs where applicable.
8. Add message status mapping for `Pending/Sending/Retrying/Failed/Delivered`.

## 13) Known Deferred Items (Backend Ready, Full Product Later)

- Real external WhatsApp provider adapter is intentionally not finalized (architecture is ready).
- Full credit consumption workflows in billing UX are foundational but not fully productized.
- Expanded end-to-end API integration suite is started and should be extended in a dedicated harness.
