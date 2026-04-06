# Full Backend + Frontend Review And New Items (2026-04-06)

## Scope
- Reviewed current backend and frontend implementation state, including newly added phase modules.
- Focused on runtime behavior, contract consistency, branch/role safety, and business-rule alignment.
- Included both what is working and what still blocks enterprise-grade completion.

## Validation Summary
- Backend build: PASS (`dotnet build EliteClinic.sln`)
- Backend tests: PASS (51/51)
- Frontend lint: PASS
- Frontend production build: PASS
- Endpoint parity tooling: PASS (219 wired endpoints, 0 partial, 0 UI-missing)

Important: endpoint parity and green builds do not guarantee business-rule correctness. Findings below are based on direct code-path inspection.

## What Is Newly Present (Inventory)

### Backend
- Controllers count: 35
- Top-level clinic service files: 60
- Domain modules present in API + application services:
  - Inventory and visit-consumption flow
  - Marketplace and public landing sales flow
  - Partner integrations and partner orders timeline
  - Self-service requests and patient app profile endpoints
  - Workforce (attendance, absence, compensation, salary payout, daily closing)
  - Reports endpoints and finance summaries
  - Queue/visit/invoice advanced workflow

### Frontend
- Action files count: 89
- App route/page files count: 46 (`page.tsx` and `route.ts`)
- New action domains present:
  - inventory, marketplace, partner, workforce, reports, self-service, patient-app, patient-medical, queue, finance, billing, notifications, messages

### Runtime/Operations
- Backend and frontend both start and respond locally.
- Seeded role coverage now includes Receptionist, Nurse, and Contractor test users in startup seeding.

## Findings (Ordered By Severity)

### Critical

1. Patient profile still calls deprecated credit endpoints with patient token
- Evidence:
  - `Frontend/actions/patient-app/profile.ts:92` calls `/api/clinic/patient-credits/{patientId}/balance`
  - `Frontend/actions/patient-app/profile.ts:108` calls `/api/clinic/patient-credits/{patientId}/history`
  - `Frontend/app/[tenantSlug]/patient/(main)/profile/page.tsx:8` imports and uses credit balance action for patient wallet UI
  - `src/EliteClinic.Api/Controllers/PatientCreditsController.cs:16` and `src/EliteClinic.Api/Controllers/PatientCreditsController.cs:27` only authorize staff roles
  - `src/EliteClinic.Api/Controllers/PatientCreditsController.cs:21` and `src/EliteClinic.Api/Controllers/PatientCreditsController.cs:34` return HTTP 410 (deprecated)
- Impact:
  - Patient profile wallet section is contract-broken by design (401/403 and/or 410 path), creating visible runtime failure or empty misleading UI.
- Required fix:
  - Remove wallet-credit dependency from patient app profile, or replace with a supported patient-facing balance model endpoint.

### High

2. Refund flow still mutates legacy credit fields despite direct-refund deprecation intent
- Evidence:
  - `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs:468` increments `invoice.CreditAmount` on partial refund
  - `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs:469` sets `invoice.CreditIssuedAt`
  - `src/EliteClinic.Application/Features/Clinic/Services/ClinicSettingsService.cs:59` and `src/EliteClinic.Application/Features/Clinic/Services/ClinicSettingsService.cs:127` still manage `RetainCreditOnNoShow`
  - `src/EliteClinic.Api/Program.cs:144` still registers `IPatientCreditService`
- Impact:
  - Financial model is mixed (direct refund + legacy credit semantics), which can produce ambiguous reporting and policy behavior.
- Required fix:
  - Complete migration to direct-refund model and retire active credit-state mutation in invoice and settings paths.

3. Booking-source classification is inconsistent with expanded `VisitSource` enum
- Evidence:
  - `src/EliteClinic.Domain/Enums/VisitSource.cs:7` includes `ConsultationBooking` and `PatientSelfServiceBooking`
  - `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs:1035` and `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs:1131` set `IsFromBooking` only when `Source == Booking`
  - `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs:357` filters booking view with only `Source == Booking`
- Impact:
  - Booking analytics, queue tags, and doctor-side filtering undercount booking-origin visits.
- Required fix:
  - Normalize booking-source predicate to include all booking-type sources (at minimum `Booking`, `ConsultationBooking`, `PatientSelfServiceBooking`).

4. Branch scoping enforcement is partial and not applied consistently outside partner module
- Evidence:
  - `src/EliteClinic.Application/Features/Clinic/Services/BranchAccessService.cs` exists with scope methods
  - `src/EliteClinic.Application/Features/Clinic/Services/PartnerService.cs` uses branch scope checks
  - `src/EliteClinic.Application/Features/Clinic/Services/InventoryService.cs:187` list query starts tenant-wide and only narrows by optional `query.BranchId`
  - `src/EliteClinic.Api/Controllers/InventoryController.cs:19` allows Receptionist/Doctor list access without branch-scope enforcement
  - `src/EliteClinic.Domain/Entities/Employee.cs` has no branch assignment field
  - `src/EliteClinic.Application/Features/Clinic/Services/StaffService.cs:111` lists staff tenant-wide
- Impact:
  - Non-owner users can read broad tenant data in flows where branch-level access should be explicit.
- Required fix:
  - Apply branch scope service consistently across inventory, staff/workforce, and queue/report list paths, with explicit behavior per role.

### Medium

5. Absence recording is present but no verified automatic absence-driven refund path
- Evidence:
  - `src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs:133` creates absence records
  - `src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs:185` lists absence records
  - No direct absence-triggered refund integration found in reviewed refund paths.
- Impact:
  - If policy expects automatic financial action for no-show/absence categories, current behavior is incomplete.
- Required fix:
  - Add explicit orchestration from validated absence/no-show events into refund workflow (or document that policy is manual only).

### Low

6. Quality hygiene gaps
- Observed:
  - Test analyzer warning still appears (xUnit2031).
  - Working tree commonly includes generated build artifacts (`bin/`, `obj/`, frontend generated file changes) during local runs.
- Impact:
  - Adds noise to review/PR process and can hide meaningful diffs.
- Required fix:
  - Keep generated files out of review commits and address analyzer warning backlog.

## Verified Good Areas
- Local runtime health for frontend and backend is stable after API base URL resolver correction.
- Core compile/lint/test checks pass.
- Module surface for requested phases exists in both backend and frontend.
- Endpoint wiring coverage is currently complete by parity script output.

## Highest-Risk Testing Gaps
- No integration test proving patient profile does not call deprecated credits endpoints.
- No test asserting booking-source predicate correctness across all booking enum values.
- No branch-isolation test suite for receptionist/doctor list endpoints across modules.
- No financial regression tests enforcing direct-refund-only semantics.

## Priority Remediation Order
1. Remove/replace patient credit calls in patient app profile to eliminate immediate production break.
2. Unify refund model (direct refund only) and remove active credit mutation/settings dependence.
3. Fix booking-source classification predicates in queue and visit services.
4. Expand branch-scope enforcement to non-partner modules.
5. Add integration/regression tests for the above behaviors.

## Exit Criteria For "Enterprise Complete"
- Patient profile has zero dependency on deprecated credits endpoints.
- Refund/accounting flow has one authoritative model with no legacy side effects.
- Booking-origin analytics and filters are source-complete.
- Branch access policy is consistently enforced for all role-sensitive list/query endpoints.
- Automated tests cover these policy contracts.

