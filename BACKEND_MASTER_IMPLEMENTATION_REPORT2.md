# BACKEND_MASTER_IMPLEMENTATION_REPORT

Date: 2026-04-04
Scope: Backend only (`src/EliteClinic.Api`, `src/EliteClinic.Application`, `src/EliteClinic.Domain`, `src/EliteClinic.Infrastructure`, `tests/EliteClinic.Tests`)
Rule: This file is the single source of truth for inspection, implementation, verification, and phase tracking.

---

## Phase 0 - Mandatory Current-State Scan (Completed Before Code Changes)

### 0.1 What Was Inspected

Inspected modules/files (real code):
- API controllers in `src/EliteClinic.Api/Controllers/*.cs`
- Core services in `src/EliteClinic.Application/Features/Clinic/Services/*.cs`
- Core DTOs in `src/EliteClinic.Application/Features/Clinic/DTOs/*.cs`
- Domain entities/enums in `src/EliteClinic.Domain/Entities/*.cs`, `src/EliteClinic.Domain/Enums/*.cs`
- EF model and tenant filters in `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs`
- Background operations in `src/EliteClinic.Infrastructure/Services/SessionClosureBackgroundService.cs`
- Existing backend test surface in `tests/EliteClinic.Tests/QueueWithPaymentCompatibilityTests.cs`

No code changes were made before this section.

---

## A) Current-State Architecture and Flow Scan

### A.1 Existing Modules (Actual)

Implemented backend modules:
- Tenancy/platform: tenants, subscriptions, feature flags
- Auth/identity
- Clinic settings + working hours
- Doctors + doctor services + doctor visit field config
- Staff/employees
- Patients + sub-profiles
- Queue sessions/tickets/board
- Visits/prescriptions/lab requests
- Invoices/payments/expenses/finance reports
- Workforce (attendance, compensation rules, salary payout expenses, daily closing snapshots)
- Booking module
- Public read endpoints (clinic/doctors/services/working-hours)
- Messaging/notifications/doctor notes
- Patient credits module (active)

Missing backend modules (not present in current code):
- Branch model / multi-branch model
- Inventory model
- Marketplace/public product order model
- Separate sales invoice model
- Partner/lab-radiology-pharmacy contract module
- Document-thread + RX revision workflow module

### A.2 Actual Endpoint Map (Current)

Core controllers/routes currently active:
- `api/clinic/visits` (includes `GET my/today`)
- `api/clinic/queue/board`, `api/clinic/queue/my-queue`, `api/clinic/queue/my-ticket`
- `api/clinic/queue/sessions/*`
- `api/clinic/queue/tickets/*`
- `api/clinic/bookings/*`
- `api/clinic/invoices/*`
- `api/clinic/finance/*`
- `api/clinic/workforce/*`
- `api/clinic/expenses/*`
- `api/clinic/patient-credits/*`
- `api/clinic/patient-app/*`
- `api/public/{slug}/*`

No dedicated `api/clinic/reports/*` controller currently exists.

### A.3 Actual Finance Flow

Primary flow currently:
- Invoice creation/update in `InvoiceService`
- Payment recording/refund in `InvoiceService`
- Report reads in `FinanceService`

Important current behavior:
- Invoice keeps `Amount`, `PaidAmount`, `RemainingAmount`, `Status`
- `MapToDto` and `FinanceService.ComputeFinancialSnapshot` can recompute paid/remaining from payment rows
- Credits still active in invoice model (`CreditAmount`, `CreditIssuedAt`) and credit service

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`
- `src/EliteClinic.Domain/Entities/Invoice.cs`

### A.4 Actual Queue Flow

Primary queue behavior:
- Open session auto-converts confirmed same-day bookings to tickets
- Close session marks waiting/called tickets `NoShow`
- No-show/session-closure paths currently preserve patient credit for paid unserved encounters
- `queue/board`, `queue/my-queue`, `queue/my-ticket` exist

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Infrastructure/Services/SessionClosureBackgroundService.cs`

### A.5 Actual Visit/Booking/Ticket Flow

- Ticket with payment can pre-create visit + invoice
- Start visit is idempotent and links ticket->visit
- Finish ticket completes linked visit/ticket
- Booking is direct-confirmed (no explicit clinic approval state machine)
- `GET /api/clinic/visits/my/today` is active and used as dedicated today endpoint

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs`
- `src/EliteClinic.Api/Controllers/VisitsController.cs`

### A.6 Actual Reports Flow

Current reports are finance-centric endpoints under `api/clinic/finance`:
- daily/by-doctor/monthly/yearly/profit

No unified report endpoints under `api/clinic/reports/*` currently.

Files:
- `src/EliteClinic.Api/Controllers/FinanceController.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`

### A.7 Actual Doctor Model

Doctor currently has:
- identity link (`UserId`), profile fields, urgent policy fields, avg visit duration
- no compensation fields directly on `Doctor`
- compensation handled by separate `DoctorCompensationRule`

Files:
- `src/EliteClinic.Domain/Entities/Doctor.cs`
- `src/EliteClinic.Domain/Entities/DoctorCompensationRule.cs`

### A.8 Actual Employee Model

Employee currently has:
- optional `UserId` (already nullable), profile/role/salary fields
- no explicit `workerMode` enum field

Files:
- `src/EliteClinic.Domain/Entities/Employee.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/StaffService.cs`

### A.9 Actual Branch Support

Current backend has no `Branch` entity and no `BranchId` fields on core entities.
Branch-aware filtering/pricing/scheduling is not implemented.

Evidence:
- no branch domain entity in `src/EliteClinic.Domain/Entities`
- no branch fields in queue/visit/booking/invoice domain models

### A.10 Actual Inventory Support

No inventory entities/services/controllers found.
No stock tracking model exists in current backend.

### A.11 Actual Partner/Contracts Support

No partner/contract entities/services/controllers found.
Only clinical lab request module exists; no partner contract or partner order model.

---

## B) Duplication / Near-Duplication Scan

### B.1 Doctor Compensation Logic Duplication

Current duplication pattern:
- Doctor compensation source is standalone `DoctorCompensationRule`
- Doctor profile CRUD (`DoctorServiceImpl`) does not own compensation
- Workforce owns compensation rule CRUD

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/DoctorService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs`

### B.2 Visit Source Logic Duplication / Gap

Current gap/duplication:
- No unified visit source enum exists
- Source inference is spread by flow (booking notes, queue note strings, ticket/payment creation path)
- Queue/visit/booking DTOs do not expose a unified `source`

Files:
- `src/EliteClinic.Application/Features/Clinic/DTOs/QueueDtos.cs`
- `src/EliteClinic.Application/Features/Clinic/DTOs/VisitDtos.cs`
- `src/EliteClinic.Application/Features/Clinic/DTOs/BookingDtos.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs`

### B.3 Reports Logic Duplication

Current duplication:
- reporting calculations repeated across daily/monthly/yearly/profit methods
- no consolidated report aggregation abstraction

File:
- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`

### B.4 Invoice Total/Paid/Remaining Calculation Duplication

Current duplication:
- recomputation exists in multiple invoice operations and DTO mapping
- payment snapshot logic duplicated in `InvoiceService.MapToDto` and `FinanceService.ComputeFinancialSnapshot`

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`

### B.5 Queue/Booking/Consultation Flow Duplication

Current duplication/gap:
- queue flow and booking flow separately enforce timing/activation rules
- no unified workflow source/state abstraction

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs`

### B.6 Inventory vs Line Items vs Clinic Services

Current state:
- No inventory model exists
- Invoice line items currently serve as ad-hoc extra charges
- Clinic service catalog + legacy doctor service both active (dual service model)

Files:
- `src/EliteClinic.Domain/Entities/ClinicService.cs`
- `src/EliteClinic.Domain/Entities/DoctorService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`

### B.7 Patient-App Endpoint Duplication

Current overlap:
- patient app reads profile/visits/summary/bookings/ticket via multiple dedicated endpoints
- no consolidated request/approval/self-service workflow endpoints exist

File:
- `src/EliteClinic.Api/Controllers/PatientAppController.cs`

---

## C) Broken / Risky Logic Scan

### C.1 Credits/Refunds

Current critical mismatch with approved business:
- No-show + unserved flows issue credits (not auto refunds)
- Session auto-closure background service still writes credit balances/transactions
- `patient-credits` endpoints active

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Infrastructure/Services/SessionClosureBackgroundService.cs`
- `src/EliteClinic.Api/Controllers/PatientCreditsController.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/PatientCreditService.cs`

### C.2 Compensation

Current mismatch:
- compensation business truth not on doctor model
- separated in compensation rules
- no compensation history tied to doctor profile updates

Files:
- `src/EliteClinic.Domain/Entities/Doctor.cs`
- `src/EliteClinic.Domain/Entities/DoctorCompensationRule.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs`

### C.3 Doctor Permissions

Current status:
- several ownership protections exist (doctor can only manage own queue/visits/invoice line items)
- but doctor financial reporting endpoint does not exist as dedicated own-report endpoint

Files:
- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`

### C.4 Expenses Permissions

Current mismatch with approved rule:
- receptionist can list expenses but cannot create/update
- approved rule requires receptionist can add expenses

File:
- `src/EliteClinic.Api/Controllers/ExpensesController.cs`

### C.5 Visit Source

Current mismatch:
- no unified source enum/field propagated across queue/ticket/visit/booking/reports/patient views

Files:
- queue/visit/booking DTO and services

### C.6 VisitType

Current status:
- `VisitType` has only `Exam` and `Consultation` in enum (acceptable baseline)
- but source/booking-mode split is not represented in visit data

File:
- `src/EliteClinic.Domain/Enums/VisitType.cs`

### C.7 Reports

Current mismatch:
- report endpoints are finance-shaped and do not provide unified clinic/services/doctors report surface under `api/clinic/reports/*`
- doctor own report isolation endpoint not implemented

Files:
- `src/EliteClinic.Api/Controllers/FinanceController.cs`
- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`

### C.8 Branch-Awareness

Current critical gap:
- no branch model support in bookings, schedules, queue visibility, reports, inventory, access

### C.9 Booking Approvals

Current gap:
- booking currently direct-confirmed, no approval state pipeline

File:
- `src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs`

### C.10 Self-Service Payment Approval

Current gap:
- no request/payment-proof/reupload/approval pipeline exists

### C.11 Inventory Billing

Current gap:
- no inventory usage/billable-in-visit stock model exists

### C.12 Partner Contract Commissions

Current gap:
- no partner contract model exists

---

## D) Legacy / Deprecation Scan

### D.1 Keep (Core)

Keep and adapt safely:
- tenancy/auth/query-filter isolation model
- queue session/ticket operational model
- visit + invoice + payment core model
- doctor ownership protections in queue/visit/invoice line items
- clinic service + doctor service link model

### D.2 Deprecate (Not Immediate Hard Delete)

Deprecate from active business usage:
- patient credit business module (`PatientCreditService`, `patient-credits` endpoints)
- credit fields as active operational semantics on invoice (`CreditAmount`, `CreditIssuedAt`)
- `GET /api/clinic/visits/my/today` in favor of filtered `GET /api/clinic/visits/my`
- compensation rules as primary business source (keep only compatibility/historical if needed)

### D.3 Remove (Operationally)

To be removed from active flow logic:
- credit issuance behavior in no-show/session-close/doctor-absent paid scenarios

### D.4 Adapt Instead of Delete

Adapt these modules incrementally:
- booking flow: add self-service approval pipeline without breaking existing direct booking until migration complete
- finance report layer: add unified reports endpoints while keeping existing finance endpoints for compatibility window
- doctor/staff models: additive worker mode + compensation history to avoid breaking current consumers

---

## E) Strict 4-Phase Execution Plan (Implementation Order Locked)

### Phase 1 - Business Core Stabilization

Implementation scope:
1. Remove credits/patient balance from active business logic
2. Implement auto-refund rules for paid no-show and doctor-absent scenarios
3. Introduce unified visit source enum and propagate to queue/ticket/visit/booking/report DTOs
4. Replace business use of `visits/my/today` with filtered `GET /api/clinic/visits/my`
5. Move doctor compensation primary model to `Doctor` entity
6. Add doctor compensation history tracking
7. Allow receptionist expense creation
8. Ensure queue endpoints return full context (source + visitType + booking/walk-in context)
9. Add reports foundation (services sold + doctor percentages + exam/consultation + booking/walk-in dimensions)
10. Add unified attendance/absence module foundation for doctors/workers
11. Add branch-aware doctor schedule foundation (additive schema + compatibility)

Phase 1 pre-implementation checklist:
- impacted modules listed
- risk list documented
- duplication list documented (above)

Phase 1 exit checklist:
- build passes
- tests pass
- no legacy flow break from this scope
- report updated with exact changed files/entities/dtos/endpoints

### Phase 2 - Patient Self-Service Flow

Implementation scope:
1. same-day self-service ticket requests
2. future self-service booking requests
3. payment settings and public payment methods
4. screenshot proof upload flow
5. approval/reject/reupload/adjust-paid workflow
6. conversion to real ticket/booking only after approval
7. request status pipeline
8. profile/dependent selection
9. request-level docs + medical details capture
10. reception/manager/owner approval role support

Exit checklist:
- request->approval->conversion works
- no ticket number before approval
- screenshot flow validated
- doctor/service/branch linkage validated

### Phase 3 - Inventory + Marketplace + Sales

Implementation scope:
1. inventory module
2. inventory usage in visit flow
3. stock deduction and usage records
4. billable vs non-billable behavior
5. public marketplace items exposure
6. order record + WhatsApp redirect behavior
7. separate sales invoice model
8. landing marketplace support contracts
9. branch-aware inventory support
10. keep separation between medical services and inventory sales

Exit checklist:
- inventory usage and stock correctness
- marketplace order statuses functional
- sales invoice isolated from medical invoice

### Phase 4 - Partners + Branch Expansion + Hardening

Implementation scope:
1. partner dashboard foundation
2. clinic contracts
3. doctor contracts
4. partner request/order model
5. lab/radiology/pharmacy support foundation
6. multi-branch access refinement
7. branch-aware staff/doctor access maps
8. doctor reply on uploads + document thread + RX revision
9. in-app notifications for thread/revision events
10. dead logic cleanup + duplication reduction + deprecation closure

Exit checklist:
- partner contract flow usable
- document thread + rx revisions usable
- branch stability validated
- duplication reduced and documented

---

## Phase 0 Risk Register (Before Phase 1 Coding)

- High: credit removal touches queue closure, background service, invoice/refund behavior, and patient API payloads
- High: introducing source enum requires coordinated DTO/service/controller updates to avoid response contract drift
- High: doctor compensation migration requires additive schema with fallback to prevent data loss
- High: branch foundation is currently absent; must be additive and non-breaking
- Medium: reports unification may overlap existing finance endpoints; compatibility layer required
- Medium: attendance expansion to absence records must preserve existing attendance API semantics

---

## Phase 1 Entry Checklist (Ready)

- [x] Current-state scan completed from real code
- [x] Duplication scan completed
- [x] Broken/risky scan completed
- [x] Legacy/deprecation scan completed
- [x] Strict 4-phase plan documented
- [x] No code changes were made before this Phase 0 report

---

## Phase 1 Execution Lock Addendum

### 1) Replacement Map

| Legacy endpoint/module/logic | Replacement path | Migration/cutover note |
|---|---|---|
| `api/clinic/patient-credits/*` + `PatientCreditService` as active operational flow | Direct refund flow through `Payment` rows (negative refund rows) + invoice refund state | Endpoints are hard-deprecated (HTTP 410). Credit tables/services remain for historical compatibility only until full retirement phase. |
| Credit issuance on no-show/session close (`QueueService`, `SessionClosureBackgroundService`) | Auto-refund for unserved paid encounters (`AutoRefundForUnservedTicketAsync` + background refund rows) | Active business logic has moved to refund path. No new active no-show/session-close flow may issue credits. |
| `GET /api/clinic/visits/my/today` | `GET /api/clinic/visits/my` with filters/paging | `my/today` business path removed; clients should migrate to filtered `my` endpoint. |
| `DoctorCompensationRule` as primary truth | `Doctor.CompensationMode`, `Doctor.CompensationValue`, `Doctor.CompensationEffectiveFrom` + `DoctorCompensationHistory` | Compatibility window keeps legacy rules readable as fallback only when no history exists. |
| Finance-only report endpoints under `api/clinic/finance/*` | Unified reports endpoints under `api/clinic/reports/*` (`overview`, `services`, `my-overview`) | Finance endpoints remain available in compatibility window; new development should target unified reports surface. |

### 2) Source Enum Backfill Rules

Source normalization target is `VisitSource` with active values:
- `WalkInTicket`
- `Booking`
- `ConsultationBooking`
- `PatientSelfServiceTicket`
- `PatientSelfServiceBooking`

Backfill and mapping rules (deterministic order):
1. If row already has explicit source set by new flow, preserve as-is.
2. If queue ticket/visit is structurally linked to booking flow, map to `Booking` unless explicitly marked consultation booking.
3. If request is consultation booking and source is explicitly set in request contracts, map to `ConsultationBooking`.
4. If row originates from approved self-service same-day ticket flow, map to `PatientSelfServiceTicket`.
5. If row originates from approved self-service future booking flow, map to `PatientSelfServiceBooking`.
6. If none of the above applies, map to `WalkInTicket`.

Explicit status by required source label:

| Source label | Mapping rule | Current implementation status |
|---|---|---|
| `WalkInTicket` | Default when no stronger structural source exists | Active |
| `Booking` | Structural booking linkage or explicit booking source in contracts | Active |
| `ConsultationBooking` | Explicit consultation booking source in contracts | Partially active (enum available, set when explicitly provided) |
| `PatientSelfServiceTicket` | Assigned only after approved Phase 2 same-day self-service conversion | Reserved for Phase 2 activation |
| `PatientSelfServiceBooking` | Assigned only after approved Phase 2 future self-service conversion | Reserved for Phase 2 activation |
| `PartnerReferral` | Reserved label only | Not implemented; no active enum member yet |

Important migration note:
- Existing historical rows added before source propagation may contain migration defaults; strict historical normalization requires targeted backfill scripts based on structural links, not free-text note inference.

### 3) Compensation Migration Rules

Cutover rules:
- Current truth (post-Phase 1): compensation must come from doctor entity fields (`Doctor.CompensationMode`, `Doctor.CompensationValue`, `Doctor.CompensationEffectiveFrom`).
- New truth storage: each compensation change must be recorded into `DoctorCompensationHistory`.
- Compatibility window behavior:
	- Writes: doctor create/update/patch and workforce compensation create path update doctor fields and append history.
	- Reads: workforce compensation list reads history first; if no history rows exist, legacy `DoctorCompensationRule` is used as fallback.

Backfill/copy rules:
- Additive migration created the new columns/tables without destructive delete.
- No automatic destructive drop of `DoctorCompensationRule` occurred in Phase 1.
- Legacy rule data remains available for fallback reads until explicit retirement/backfill completion.

Retirement rule:
- `DoctorCompensationRule` is fallback-only from Phase 1 onward.
- Full retirement is deferred until all active tenants are confirmed backfilled to doctor fields + history and compatibility window is closed.

### 4) Central Authorization Matrix

Matrix scope: role behavior for key operations. `SuperAdmin` remains administrative override outside this matrix.

| Action | ClinicOwner | ClinicManager | Receptionist | Doctor | Patient | PayrollOnly worker |
|---|---|---|---|---|---|---|
| Add expense | Allow | Allow | Allow | Deny | Deny | No login/API access |
| Refund invoice | Allow | Allow | Allow | Deny | Deny | No login/API access |
| Approve self-service payment | Planned (Phase 2) | Planned (Phase 2) | Planned (Phase 2) | Deny | Deny | No login/API access |
| Reject self-service request | Planned (Phase 2) | Planned (Phase 2) | Planned (Phase 2) | Deny | Deny | No login/API access |
| Request payment reupload | Planned (Phase 2) | Planned (Phase 2) | Planned (Phase 2) | Deny | Deny | No login/API access |
| Adjust paid amount (self-service) | Planned (Phase 2) | Planned (Phase 2) | Planned (Phase 2) | Deny | Deny | No login/API access |
| Add invoice line item | Allow | Allow | Allow | Allow (own encounter invoice only) | Deny | No login/API access |
| Use inventory in visit | Not implemented (Phase 3) | Not implemented (Phase 3) | Not implemented (Phase 3) | Not implemented (Phase 3) | Not implemented (Phase 3) | No login/API access |
| Create payroll-only worker | Allow | Allow | Deny | Deny | Deny | No login/API access |
| Create absence record | Allow | Allow | Allow | Deny | Deny | No login/API access |
| View doctor-own reports | Deny | Deny | Deny | Allow (`/api/clinic/reports/my-overview`) | Deny | No login/API access |
| View clinic-wide reports | Allow | Allow | Deny | Deny | Deny | No login/API access |

### 5) Branch Scope Boundaries (Phase 1)

Phase 1 branch support includes additive schema + context propagation foundation only.

Entities with `BranchId` introduced or extended:
- `QueueSession`
- `QueueTicket`
- `Visit`
- `Booking`
- `Invoice`
- `Expense`
- `AttendanceRecord`
- `AbsenceRecord`

Branch foundation entities added:
- `Branch`
- `DoctorBranchSchedule`

What is foundation-complete in Phase 1:
- Branch-aware schema exists with FK/index coverage.
- Branch context can be carried through queue/visit/booking and selected workforce/expense flows.

What is not yet branch-complete:
- Full branch-level access control matrix per role/user.
- Branch-aware pricing and full scheduling decision engine.
- Branch-aware self-service approval routing and workload balancing.
- Branch-aware inventory and marketplace behavior (Phase 3+).

### 6) Honest Test Status

- Build success:
	- Application/Infrastructure/API project builds succeeded.
- Migration success:
	- Additive migration `Phase13_Phase1CoreStabilizationReports` generated successfully and compiles.
- Automated tests status:
	- Initial Phase 1 validation had a solution-level blocker: missing `tests/EliteClinic.Tests/EliteClinic.Tests.csproj` (`MSB1009`).
	- Blocker resolved later (2026-04-04) by restoring test project and fixtures.
	- Current validation: `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` passes (`17/17`).
- Smoke validation status:
	- Compile and DI wiring validated.
	- End-to-end HTTP runtime smoke was not fully executed in this pass.

### 7) Cross-Cutting Invariants

Hard invariants locked for subsequent phases:
- No new active backend flow may issue patient credits.
- After source enum introduction, source must not be inferred from free-text notes for active writes.
- Doctor compensation truth must come from doctor entity fields after cutover.
- Doctor-scoped reporting must not expose clinic-wide data for other doctors.
- Inventory sales invoice must remain separate from medical encounter invoice flow.
- Public order flow (Phase 3+) must persist an order record before or with WhatsApp redirect.
- Where branch-aware flow is active, branch context must be explicit in persisted records and DTOs.

---

## Implementation Log (Will Be Updated Per Phase)

### Phase 1 - In Progress (Partial Completion Logged)
- Inspected paths:
	- `src/EliteClinic.Api/Controllers/*`
	- `src/EliteClinic.Application/Features/Clinic/Services/*`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/*`
	- `src/EliteClinic.Domain/Entities/*`, `src/EliteClinic.Domain/Enums/*`
	- `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs`
	- `src/EliteClinic.Infrastructure/Services/SessionClosureBackgroundService.cs`
- Files changed:
	- API controllers: `VisitsController.cs`, `StaffController.cs`, `WorkforceController.cs`, `ExpensesController.cs`, `PatientCreditsController.cs`, `ReportsController.cs`
	- Services/contracts: `QueueService.cs`, `VisitService.cs`, `BookingService.cs`, `DoctorService.cs`, `StaffService.cs`, `WorkforceService.cs`, `IVisitService.cs`, `IStaffService.cs`, `IWorkforceService.cs`, `IReportsService.cs`, `ReportsService.cs`
	- DTOs: `QueueDtos.cs`, `VisitDtos.cs`, `BookingDtos.cs`, `DoctorDtos.cs`, `StaffDtos.cs`, `WorkforceDtos.cs`, `ReportDtos.cs`
	- Domain: `Doctor.cs`, `Employee.cs`, `QueueSession.cs`, `QueueTicket.cs`, `Booking.cs`, `Visit.cs`, `Invoice.cs`, `Expense.cs`, `AttendanceRecord.cs`
	- Infrastructure: `EliteClinicDbContext.cs`, `SessionClosureBackgroundService.cs`
	- API wiring: `Program.cs`
	- Migrations: `20260404175657_Phase13_Phase1CoreStabilizationReports.cs`, `20260404175657_Phase13_Phase1CoreStabilizationReports.Designer.cs`, `EliteClinicDbContextModelSnapshot.cs`
	- New domain files: `VisitSource.cs`, `WorkerMode.cs`, `DoctorCompensationHistory.cs`, `AbsenceRecord.cs`, `Branch.cs`, `DoctorBranchSchedule.cs`
- Entities changed:
	- Added: `DoctorCompensationHistory`, `AbsenceRecord`, `Branch`, `DoctorBranchSchedule`
	- Extended with additive fields:
		- `Doctor`: compensation fields + history/schedule navs
		- `Employee`: `WorkerMode`
		- `QueueSession`: `BranchId`
		- `QueueTicket`: `BranchId`, `Source`
		- `Booking`: `BranchId`, `VisitType`, `Source`
		- `Visit`: `BranchId`, `Source`
		- `Invoice`: `BranchId`
		- `Expense`: `BranchId`
		- `AttendanceRecord`: `BranchId`, `EnteredByUserId`
- DTOs changed:
	- Queue/booking/visit DTOs now expose source/branch/visit-type context
	- Doctor DTOs now expose compensation fields and compensation history
	- Staff DTOs now expose `WorkerMode` and payroll-only create request
	- Workforce DTOs now expose attendance metadata and absence contracts
- Endpoints changed:
	- Added `POST /api/clinic/staff/payroll-only`
	- Replaced doctor self visits route with filtered endpoint: `GET /api/clinic/visits/my`
	- Added reports foundation endpoints:
		- `GET /api/clinic/reports/overview`
		- `GET /api/clinic/reports/services`
		- `GET /api/clinic/reports/my-overview`
	- Added workforce absence endpoints:
		- `POST /api/clinic/workforce/absence`
		- `GET /api/clinic/workforce/absence`
	- Updated authorization for expense creation to include receptionist:
		- `POST /api/clinic/expenses`
	- Deactivated patient credit API endpoints (return explicit deprecation response):
		- `GET /api/clinic/patient-credits/{patientId}/balance`
		- `GET /api/clinic/patient-credits/{patientId}/history`
- Behavior changed:
	- Queue/session no-show settlement switched from credit issuance to auto-refund rows + invoice refund state updates
	- Background auto-session-closure switched from credit issuance to auto-refund
	- Queue issuance/visit-start/booking-bridge now propagates source + branch context
	- Doctor self visits now support filters (`from/to/source/visitType/status` + paging) under one endpoint
	- Compensation primary write path now updates doctor compensation fields and writes compensation history
	- Workforce compensation list now reads doctor compensation history first, with legacy-rule fallback
	- Staff flow now supports payroll-only workers (no login) and null-safe operations for non-login employees
	- Reports service now provides clinic overview, service sales, and doctor-own overview with tenant-safe filtering
	- Patient credits endpoints are now hard-deprecated operationally (HTTP 410), preventing active credit API usage
- Deprecated logic:
	- Removed active usage of queue/service/background credit preservation for unserved paid encounters
	- `GET /api/clinic/visits/my/today` removed from business path in favor of `GET /api/clinic/visits/my`
	- Standalone compensation rules demoted to compatibility fallback for historical read
	- Patient credit endpoints moved to explicit deprecation responses to prevent new operational dependence
- Build result:
	- `dotnet build src/EliteClinic.Application/EliteClinic.Application.csproj` -> success (warnings only)
	- `dotnet build src/EliteClinic.Infrastructure/EliteClinic.Infrastructure.csproj` -> success
	- `dotnet build src/EliteClinic.Api/EliteClinic.Api.csproj` -> success
	- Post-migration validation build:
		- `dotnet build src/EliteClinic.Infrastructure/EliteClinic.Infrastructure.csproj` -> success
		- `dotnet build src/EliteClinic.Api/EliteClinic.Api.csproj` -> success
- Test result:
	- Initial Phase 1 validation: `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> failed due pre-existing missing project file (`MSB1009`)
	- Current rerun (2026-04-04): `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> success (`17/17` passed)
- Smoke checks:
	- Compile gate passed across API/Application/Infrastructure after cross-module refactor
	- Contract-level endpoint/service changes compile and DI resolves constructor graph
	- EF migration generated successfully for additive Phase 1 schema updates
- Unresolved risks:
	- Patient credit service/tables still exist for compatibility/historical data, so full module retirement is not yet complete
	- Automated test suite breadth is still limited (restored project currently contains a focused compatibility set), so broader regression coverage remains needed
	- Full branch-aware access/pricing/scheduling behavior is only foundational at schema/service level
- Next phase entry checklist:
	- [x] Complete remaining Phase 1 report foundations and doctor-own revenue endpoint hardening
	- [x] Add and validate EF migration for additive schema
	- [x] Complete credit module deactivation plan (endpoint and service retirement path)
	- [x] Re-run build + best-available tests after remaining Phase 1 changes

- Implemented and verified:
	- Reports foundation endpoints compile and are DI-wired
	- Queue/background no-show behavior uses refund flow, not active credit issuance
	- Doctor self visits unified to filtered `GET /api/clinic/visits/my`
	- Payroll-only worker creation and absence foundations compile and validate at contract level
	- Additive Phase 1 migration generated and build-validated

- Implemented but pending broader smoke validation:
	- Full runtime HTTP scenario sweep for all modified endpoints in a seeded environment
	- Tenant-by-tenant historical source normalization/backfill quality checks
	- Full compensation legacy-to-history transition validation under production-like data volumes

- Planned next / not yet implemented:
	- Phase 3 inventory/marketplace/sales separation
	- Phase 4 partner flows, branch hardening completion, and deep cleanup

### Phase 2 - Completed (Backend Core Implemented; Automated Tests Unblocked)
- Inspected paths:
	- `src/EliteClinic.Api/Controllers/PatientAppController.cs`
	- `src/EliteClinic.Api/Controllers/SelfServiceRequestsController.cs`
	- `src/EliteClinic.Api/Controllers/ClinicSettingsController.cs`
	- `src/EliteClinic.Api/Controllers/PublicController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PatientSelfServiceRequestService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/ClinicSettingsService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PublicService.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/SelfServiceRequestDtos.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/ClinicSettingsDtos.cs`
	- `src/EliteClinic.Domain/Entities/PatientSelfServiceRequest.cs`
	- `src/EliteClinic.Domain/Entities/ClinicPaymentMethod.cs`
	- `src/EliteClinic.Domain/Entities/ClinicSettings.cs`
	- `src/EliteClinic.Domain/Enums/PatientSelfServiceRequestType.cs`
	- `src/EliteClinic.Domain/Enums/PatientSelfServiceRequestStatus.cs`
	- `src/EliteClinic.Domain/Enums/PatientSelfServicePaymentPolicy.cs`
	- `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs`
	- `src/EliteClinic.Infrastructure/Migrations/20260404183649_Phase14_Phase2SelfServiceRequestFlow.cs`
- Files changed:
	- API controllers:
		- `PatientAppController.cs`
		- `SelfServiceRequestsController.cs`
		- `ClinicSettingsController.cs`
		- `PublicController.cs`
	- Services/contracts:
		- `IPatientSelfServiceRequestService.cs`
		- `PatientSelfServiceRequestService.cs`
		- `IClinicSettingsService.cs`
		- `ClinicSettingsService.cs`
		- `IPublicService.cs`
		- `PublicService.cs`
	- DTOs:
		- `SelfServiceRequestDtos.cs`
		- `ClinicSettingsDtos.cs`
	- Domain:
		- `ClinicSettings.cs`
		- `ClinicPaymentMethod.cs`
		- `PatientSelfServiceRequest.cs` (and nested request-document entity)
		- `PatientSelfServiceRequestType.cs`
		- `PatientSelfServiceRequestStatus.cs`
		- `PatientSelfServicePaymentPolicy.cs`
	- Infrastructure/API wiring:
		- `EliteClinicDbContext.cs`
		- `Program.cs`
		- `EliteClinicDbContextModelSnapshot.cs`
	- Migration:
		- `20260404183649_Phase14_Phase2SelfServiceRequestFlow.cs`
		- `20260404183649_Phase14_Phase2SelfServiceRequestFlow.Designer.cs`
	- Tests infrastructure restoration:
		- `tests/EliteClinic.Tests/EliteClinic.Tests.csproj`
		- `tests/EliteClinic.Tests/DbContextFactory.cs`
		- `tests/EliteClinic.Tests/FakeMessageService.cs`
		- `tests/EliteClinic.Tests/QueueWithPaymentCompatibilityTests.cs` (QueueService constructor helper alignment)
		- `tests/EliteClinic.Tests/Phase2SelfServiceWorkflowTests.cs` (dedicated Phase 2 workflow + permission coverage)
- Entities changed:
	- Added:
		- `ClinicPaymentMethod`
		- `PatientSelfServiceRequest`
		- `PatientSelfServiceRequestDocument`
	- Extended:
		- `ClinicSettings`:
			- `SelfServicePaymentPolicy`
			- `SelfServiceRequestExpiryHours`
			- payment methods navigation
- DTOs changed:
	- New request pipeline DTOs for patient + clinic reviewers:
		- create request, list/detail, approve/reject/reupload/adjust contracts
	- Clinic settings/payment DTOs extended:
		- payment policy + expiry fields
		- payment methods upsert/list/options contracts
- Endpoints changed:
	- Patient app endpoints:
		- `GET /api/clinic/patient-app/payment-options`
		- `POST /api/clinic/patient-app/requests`
		- `GET /api/clinic/patient-app/requests`
		- `GET /api/clinic/patient-app/requests/{requestId}`
		- `POST /api/clinic/patient-app/requests/{requestId}/payment-proof`
	- Clinic review endpoints:
		- `GET /api/clinic/self-service-requests`
		- `GET /api/clinic/self-service-requests/{requestId}`
		- `POST /api/clinic/self-service-requests/{requestId}/approve`
		- `POST /api/clinic/self-service-requests/{requestId}/reject`
		- `POST /api/clinic/self-service-requests/{requestId}/request-reupload`
		- `POST /api/clinic/self-service-requests/{requestId}/adjust-paid-amount`
	- Clinic settings/payment endpoints:
		- `GET /api/clinic/settings/payment-options`
		- `PUT /api/clinic/settings/payment-methods`
	- Public endpoint:
		- `GET /api/public/{slug}/payment-options`
- Behavior changed:
	- Added patient self-service request pipeline for:
		- same-day ticket request
		- future booking request
	- Added strict request status machine:
		- `PendingPaymentReview` -> `PaymentApproved` -> (`ConvertedToQueueTicket` or `ConvertedToBooking`)
		- rejection/reupload/expiry branches
	- Added payment proof workflow:
		- proof image required on create
		- reupload flow available only after clinic reupload request
	- Added payment policy enforcement:
		- full-only and partial-allowed modes from clinic settings
	- Added availability snapshot capture at submission time:
		- clinic working-hours fit
		- doctor branch schedule fit
		- active doctor shift flag
	- Added ownership enforcement for patient/dependent profile hierarchy before request operations
	- Added conversion gate:
		- no queue ticket/booking conversion before approval
		- conversion writes back converted ticket/booking IDs and timestamps
- Deprecated logic:
	- No Phase 2 deprecations applied in this pass.
- Build result:
	- `dotnet build EliteClinic.sln` -> success
	- `dotnet build src/EliteClinic.Api/EliteClinic.Api.csproj` -> success
	- Post-hardening verification: `dotnet build EliteClinic.sln` -> success
- Test result:
	- `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> success (`25/25` passed)
	- Missing test-project blocker resolved by restoring test project + helper fixtures
- Phase 2 automated coverage hardening (new dedicated scenarios):
	- request creation (pending status + persisted snapshot data)
	- payment proof reupload flow after clinic reupload request
	- approve flow for same-day self-service requests
	- reject flow with reason persistence
	- reupload requested state transition
	- adjusted paid amount persistence
	- conversion to queue ticket on approval
	- conversion to future booking on approval
	- no ticket artifact before approval (ticket number not created pre-approval)
	- role attribute coverage for `Receptionist`, `ClinicManager`, `ClinicOwner` on review endpoints
- Bug fixed during test hardening:
	- No production behavior bug was found.
	- One test assertion was corrected to use substring path matching for deleted proof files; backend behavior remained unchanged.
- Smoke checks:
	- EF migration `Phase14_Phase2SelfServiceRequestFlow` generated successfully and compiles
	- API project compiles after Phase 2 wiring and migration updates
	- Tenant-aware request endpoints and service contracts pass compile-time integration checks
- Unresolved risks:
	- Service-level Phase 2 workflow coverage is now present, but full HTTP-level authorization enforcement (middleware/policy integration) is still not covered by integration tests
	- Runtime HTTP smoke scenarios for full approval/reupload/conversion path are still pending in seeded environment
	- File upload behavior is compile-validated but not fully exercised end-to-end in this pass
- Next phase entry checklist:
	- [x] Implement and compile Phase 2 self-service request/payment approval flow
	- [x] Add and validate Phase 2 EF migration
	- [x] Record concrete build/test outcomes and resolve test-project blocker
	- [ ] Begin Phase 3 inventory/marketplace/sales separation design and additive schema plan

### Phase 3 - Locked (Pre-Implementation Scan Complete)
- Inspected paths/modules (real code read before implementation):
	- `src/EliteClinic.Api/Controllers/PublicController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PublicService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/IPublicService.cs`
	- `src/EliteClinic.Api/Controllers/ClinicSettingsController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/ClinicSettingsService.cs`
	- `src/EliteClinic.Api/Controllers/InvoicesController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`
	- `src/EliteClinic.Api/Controllers/VisitsController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/IVisitService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/DoctorService.cs`
	- `src/EliteClinic.Api/Controllers/ReportsController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/ReportsService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs`
	- `src/EliteClinic.Api/Controllers/PatientAppController.cs`
	- `src/EliteClinic.Api/Controllers/SelfServiceRequestsController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PatientSelfServiceRequestService.cs`
	- `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs`
	- `src/EliteClinic.Domain/Entities/Invoice.cs`
	- `src/EliteClinic.Domain/Entities/Visit.cs`
	- `src/EliteClinic.Domain/Entities/Booking.cs`
	- `src/EliteClinic.Domain/Entities/Branch.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/PublicDtos.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/InvoiceDtos.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/VisitDtos.cs`
	- `src/EliteClinic.Application/Features/Clinic/DTOs/QueueDtos.cs`
	- `tests/EliteClinic.Tests/DbContextFactory.cs`
	- `tests/EliteClinic.Tests/FakeMessageService.cs`
	- `tests/EliteClinic.Tests/QueueWithPaymentCompatibilityTests.cs`
	- `tests/EliteClinic.Tests/Phase2SelfServiceWorkflowTests.cs`
- Exact current gaps for Phase 3:
	- No inventory entity/module exists (no item master, no stock quantity, no low-stock threshold, no public-product flagging).
	- No visit inventory usage entity exists (doctor usage in visit is not persisted separately).
	- No marketplace order entity/module exists (no public order record, no WhatsApp redirect timestamp/state).
	- No separate sales invoice model exists (current `Invoice` is medical-visit bound via required `VisitId`).
	- Public endpoints expose clinic/doctors/services/working-hours/payment options only; no public product listing/detail/order contracts.
	- Reports currently aggregate medical invoices/line-items and expenses only; no sales invoice aggregation surface exists yet.
- Phase 3 duplication risks (must be avoided in implementation):
	- Reusing medical `Invoice` for marketplace sales would mix clinical and retail accounting.
	- Duplicating invoice line-item calculation logic outside `InvoiceService.AddLineItemAsync` can drift totals/status rules.
	- Duplicating doctor-ownership checks in ad-hoc controller code instead of a single service guard can create authorization drift.
	- Duplicating branch validation logic across multiple handlers can cause inconsistent branch scoping.
	- Creating many narrow marketplace endpoints would fragment filtering/status-update logic; compact filtered endpoints are preferred.
- Phase 3 risk list (pre-implementation):
	- High: stock race conditions during concurrent usage/order confirmation can underflow quantity.
	- High: doctor visit-inventory usage must remain limited to doctor's own visit only.
	- High: public order creation must persist order before/with redirect marker without creating medical invoices.
	- Medium: branch-aware persistence must be consistent across inventory item, usage record, marketplace order, and sales invoice.
	- Medium: landing/public payload extensions must remain additive and non-breaking for existing consumers.
	- Medium: reception/manager/owner clinic-side management roles must remain explicit and consistent.
- Locked Phase 3 scope for this pass:
	- Add branch-aware inventory item model with create/update/list/detail/activation flow.
	- Add doctor-owned visit inventory usage flow that decrements stock and conditionally adds medical invoice line item when billable.
	- Add public marketplace item listing/detail and order creation with WhatsApp redirect state tracking.
	- Add clinic-side marketplace order listing/detail/status transition flow with confirmation/cancel path.
	- Add separate branch-aware sales invoice model generated from confirmed marketplace orders only.
	- Add minimal public landing enrichment for featured products/branches/contact/payment/doctors-available-now as additive contracts.
	- Keep reports compatibility only (shape data for future Phase 4 reporting); no full Phase 4 reporting implementation in this pass.
- Planned endpoints to add/update (locked before coding):
	- Add `GET /api/public/{slug}/landing` (enriched public landing payload, additive contract).
	- Add `GET /api/public/{slug}/marketplace/items` (public filtered marketplace listing).
	- Add `GET /api/public/{slug}/marketplace/items/{itemId}` (public item detail).
	- Add `POST /api/public/{slug}/marketplace/orders` (public order create + redirect state persistence).
	- Add `GET /api/clinic/inventory/items` (clinic filtered inventory listing).
	- Add `GET /api/clinic/inventory/items/{itemId}` (inventory detail).
	- Add `POST /api/clinic/inventory/items` (owner/manager create).
	- Add `PUT /api/clinic/inventory/items/{itemId}` (owner/manager update).
	- Add `POST /api/clinic/inventory/items/{itemId}/activation` (owner/manager activate/deactivate).
	- Add `POST /api/clinic/visits/{visitId}/inventory-usage` (doctor own-visit usage record + optional invoice impact).
	- Add `GET /api/clinic/marketplace/orders` (clinic-side filtered list).
	- Add `GET /api/clinic/marketplace/orders/{orderId}` (clinic-side detail).
	- Add `POST /api/clinic/marketplace/orders/{orderId}/status` (confirm/cancel/redirected transitions).
- Planned entities/DTOs to add/update (locked before coding):
	- Add entities:
		- `InventoryItem`
		- `InventoryItemImage`
		- `VisitInventoryUsage`
		- `MarketplaceOrder`
		- `MarketplaceOrderItem`
		- `SalesInvoice`
		- `SalesInvoiceLineItem`
	- Add enums:
		- `InventoryItemType`
		- `MarketplaceOrderStatus`
	- Add DTOs/contracts:
		- inventory create/update/list/detail/query/request/activation DTOs
		- visit inventory usage request/response DTOs
		- marketplace public item/order DTOs
		- clinic-side marketplace order list/detail/status DTOs
		- sales invoice summary/detail DTOs
		- additive public landing enrichment DTOs
	- Update public service/controller contracts additively to expose landing + marketplace data without breaking existing endpoints.
- Explicit lock:
	- Phase 4 is NOT started in this pass.
- Files changed:
	- API controllers:
		- `src/EliteClinic.Api/Controllers/PublicController.cs`
		- `src/EliteClinic.Api/Controllers/VisitsController.cs`
		- `src/EliteClinic.Api/Controllers/InventoryController.cs` (new)
		- `src/EliteClinic.Api/Controllers/MarketplaceOrdersController.cs` (new)
	- Application services/contracts:
		- `src/EliteClinic.Application/Features/Clinic/Services/IInventoryService.cs` (new)
		- `src/EliteClinic.Application/Features/Clinic/Services/IMarketplaceService.cs` (new)
		- `src/EliteClinic.Application/Features/Clinic/Services/InventoryService.cs` (new)
		- `src/EliteClinic.Application/Features/Clinic/Services/MarketplaceService.cs` (new)
		- `src/EliteClinic.Application/Features/Clinic/Services/IInvoiceService.cs` (extended)
		- `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs` (extended)
		- `src/EliteClinic.Application/Features/Clinic/Services/IPublicService.cs` (extended)
		- `src/EliteClinic.Application/Features/Clinic/Services/PublicService.cs` (extended)
	- DTOs:
		- `src/EliteClinic.Application/Features/Clinic/DTOs/InventoryDtos.cs` (new)
		- `src/EliteClinic.Application/Features/Clinic/DTOs/MarketplaceDtos.cs` (new)
	- Domain:
		- `src/EliteClinic.Domain/Entities/InventoryItem.cs` (new)
		- `src/EliteClinic.Domain/Entities/InventoryItemImage.cs` (new)
		- `src/EliteClinic.Domain/Entities/VisitInventoryUsage.cs` (new)
		- `src/EliteClinic.Domain/Entities/MarketplaceOrder.cs` (new)
		- `src/EliteClinic.Domain/Entities/MarketplaceOrderItem.cs` (new)
		- `src/EliteClinic.Domain/Entities/SalesInvoice.cs` (new)
		- `src/EliteClinic.Domain/Entities/SalesInvoiceLineItem.cs` (new)
		- `src/EliteClinic.Domain/Enums/InventoryItemType.cs` (new)
		- `src/EliteClinic.Domain/Enums/MarketplaceOrderStatus.cs` (new)
		- `src/EliteClinic.Domain/Enums/SalesInvoiceStatus.cs` (new)
	- Infrastructure/wiring:
		- `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs` (DbSets/config/query filters)
		- `src/EliteClinic.Infrastructure/Migrations/20260404192914_Phase15_Phase3InventoryMarketplaceSales.cs` (new)
		- `src/EliteClinic.Infrastructure/Migrations/20260404192914_Phase15_Phase3InventoryMarketplaceSales.Designer.cs` (new)
		- `src/EliteClinic.Infrastructure/Migrations/EliteClinicDbContextModelSnapshot.cs` (updated)
		- `src/EliteClinic.Api/Program.cs` (DI registration)
	- Tests:
		- `tests/EliteClinic.Tests/Phase3InventoryMarketplaceTests.cs` (new focused Phase 3 coverage)
- Entities changed:
	- Added and wired to tenant filters/migrations:
		- `InventoryItem`, `InventoryItemImage`, `VisitInventoryUsage`, `MarketplaceOrder`, `MarketplaceOrderItem`, `SalesInvoice`, `SalesInvoiceLineItem`
	- Sales and medical invoice domains remain separated (`SalesInvoice*` for marketplace retail; `Invoice*` for clinical encounter billing).
- DTOs changed:
	- Added inventory contracts:
		- create/update/list/detail/activation DTOs and visit usage request/response DTOs.
	- Added marketplace contracts:
		- public item list/detail query contracts, public order create contracts, clinic order list/detail/status update contracts, sales invoice summary/detail fields.
	- Public landing payload enriched additively with featured products + branches + payment methods + available doctors.
- Endpoints changed:
	- Added public marketplace + landing endpoints:
		- `GET /api/public/{slug}/landing`
		- `GET /api/public/{slug}/marketplace/items`
		- `GET /api/public/{slug}/marketplace/items/{itemId}`
		- `POST /api/public/{slug}/marketplace/orders`
	- Added clinic inventory endpoints:
		- `GET /api/clinic/inventory/items`
		- `GET /api/clinic/inventory/items/{itemId}`
		- `POST /api/clinic/inventory/items`
		- `PUT /api/clinic/inventory/items/{itemId}`
		- `POST /api/clinic/inventory/items/{itemId}/activation`
	- Added visit inventory usage endpoint:
		- `POST /api/clinic/visits/{id}/inventory-usage`
	- Added clinic marketplace order endpoints:
		- `GET /api/clinic/marketplace/orders`
		- `GET /api/clinic/marketplace/orders/{orderId}`
		- `POST /api/clinic/marketplace/orders/{orderId}/status`
- Behavior changed:
	- Inventory business rules enforced:
		- `internalOnly=true` auto-normalizes to non-public + non-billable + hidden-from-landing.
		- branch validation on item create/update and visit usage.
		- stock decrement on visit usage and marketplace confirmation path.
	- Visit usage rules enforced:
		- doctors can record usage only on their own visits.
		- billable usage path ensures medical invoice existence via `EnsureInvoiceForVisitAsync` and adds line item.
	- Marketplace rules enforced:
		- public order creation persists `MarketplaceOrder` and sets `WhatsAppRedirected` state/timestamp.
		- confirming marketplace order generates separate `SalesInvoice` and links it back to order.
		- no medical encounter invoice is created for public marketplace flow.
	- Branch propagation:
		- branch id persists across inventory item, usage record, marketplace order, and sales invoice.
	- Stability hardening:
		- inventory item update path changed to set-based DB update + deterministic image replacement to avoid stale tracked graph concurrency in shared-context test scenarios.
- Deprecated logic:
	- No additional deprecations in Phase 3.
	- Prior Phase 1/2 deprecations remain unchanged.
- Build result:
	- `dotnet build EliteClinic.sln` -> success.
	- `dotnet ef migrations add Phase15_Phase3InventoryMarketplaceSales --project src/EliteClinic.Infrastructure --startup-project src/EliteClinic.Api` -> success.
	- Post-migration and post-fix solution builds -> success.
- Test result:
	- Initial run after Phase 3 implementation: 1 failing test (`Phase3InventoryMarketplaceTests.Inventory_CreateListUpdate_ShouldWork`) with `DbUpdateConcurrencyException` in inventory update image replacement path.
	- Applied fix in `InventoryService.UpdateItemAsync` (set-based update + fresh read + deterministic image replacement).
	- Final verification: `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> success (`36/36` passed).
- Smoke checks:
	- Migration compiles and snapshot updated.
	- API/Application/Infrastructure compile cleanly after Phase 3 additions.
	- Focused Phase 3 test suite scenarios validated through xUnit coverage file.
- Unresolved risks:
	- Full HTTP end-to-end runtime smoke for all new marketplace/inventory endpoints was not executed in this pass.
	- Stock race conditions under high concurrent writes still rely on current transaction/update semantics (no explicit pessimistic lock layer yet).
	- Comprehensive reporting integration of sales invoice analytics is intentionally deferred to later phase work.
- Next phase entry checklist:
	- [x] Additive Phase 3 schema + migration completed
	- [x] Inventory + visit usage + marketplace + separate sales invoice backend implemented
	- [x] Build/test validation completed with failing-test fix and green suite
	- [x] Phase 4 partner/branch hardening started only after explicit authorization
	- [x] Phase 3 pass ended before Phase 4; Phase 4 completed in subsequent pass

### Phase 4 - Locked (Pre-Implementation Scan Complete)
- Inspected paths/modules (real code read before implementation):
	- `src/EliteClinic.Api/Program.cs`
	- `src/EliteClinic.Api/Controllers/PublicController.cs`
	- `src/EliteClinic.Api/Controllers/DoctorsController.cs`
	- `src/EliteClinic.Api/Controllers/ReportsController.cs`
	- `src/EliteClinic.Api/Controllers/VisitsController.cs`
	- `src/EliteClinic.Api/Controllers/PatientAppController.cs`
	- `src/EliteClinic.Api/Controllers/PatientMedicalController.cs`
	- `src/EliteClinic.Api/Controllers/PrescriptionsController.cs`
	- `src/EliteClinic.Api/Controllers/LabRequestsController.cs`
	- `src/EliteClinic.Api/Controllers/NotificationsController.cs`
	- `src/EliteClinic.Api/Controllers/MessagesController.cs`
	- `src/EliteClinic.Api/Controllers/QueueBoardController.cs`
	- `src/EliteClinic.Api/Controllers/QueueSessionsController.cs`
	- `src/EliteClinic.Api/Controllers/QueueTicketsController.cs`
	- `src/EliteClinic.Api/Controllers/BookingsController.cs`
	- `src/EliteClinic.Api/Controllers/SelfServiceRequestsController.cs`
	- `src/EliteClinic.Api/Controllers/InventoryController.cs`
	- `src/EliteClinic.Api/Controllers/MarketplaceOrdersController.cs`
	- `src/EliteClinic.Api/Controllers/StaffController.cs`
	- `src/EliteClinic.Api/Controllers/WorkforceController.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PublicService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/DoctorService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/ReportsService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PatientMedicalService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PrescriptionService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/LabRequestService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/NotificationService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/MessageService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PatientSelfServiceRequestService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/InventoryService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/MarketplaceService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/StaffService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs`
	- `src/EliteClinic.Domain/Entities/Branch.cs`
	- `src/EliteClinic.Domain/Entities/DoctorBranchSchedule.cs`
	- `src/EliteClinic.Domain/Entities/PatientMedicalDocument.cs`
	- `src/EliteClinic.Domain/Entities/Prescription.cs`
	- `src/EliteClinic.Domain/Entities/LabRequest.cs`
	- `src/EliteClinic.Domain/Entities/NotificationSubscription.cs`
	- `src/EliteClinic.Domain/Entities/MessageLog.cs`
	- `src/EliteClinic.Domain/Entities/DoctorNote.cs`
	- `src/EliteClinic.Domain/Enums/DocumentCategory.cs`
	- `src/EliteClinic.Domain/Enums/LabRequestType.cs`
	- `src/EliteClinic.Domain/Enums/VisitSource.cs`
	- `src/EliteClinic.Domain/Enums/MessageScenario.cs`
	- `src/EliteClinic.Infrastructure/Data/EliteClinicDbContext.cs`
	- `tests/EliteClinic.Tests/DbContextFactory.cs`
	- `tests/EliteClinic.Tests/FakeMessageService.cs`
	- `tests/EliteClinic.Tests/Phase2SelfServiceWorkflowTests.cs`
	- `tests/EliteClinic.Tests/Phase3InventoryMarketplaceTests.cs`
	- `tests/EliteClinic.Tests/QueueWithPaymentCompatibilityTests.cs`
- Exact current Phase 4 gaps (confirmed by inspection):
	- No partner master model exists (no `Partner` entity for lab/radiology/pharmacy providers).
	- No contract model exists (no partner rate/commission/terms table linked by tenant/branch/service scope).
	- No partner-order workflow exists:
		- `LabRequest` has no partner assignment, no ordered/sent/completed state machine, no partner financial fields.
		- `Prescription` has no pharmacy handoff/order tracking fields.
	- No medical document discussion workflow exists:
		- `PatientMedicalDocument` supports upload/list/download only.
		- No thread/reply/status model for doctor-patient-team document follow-up.
	- No prescription revision trail exists:
		- updates overwrite rows in-place.
		- no revision metadata/history/reason captured.
	- No in-app notification feed exists:
		- current module stores subscriptions and logs send attempts (`MessageLog`) but has no tenant-user notification inbox/read state endpoints.
	- Multi-branch is present structurally but access policy is not centrally enforced:
		- branch IDs are stored on many entities.
		- self-service validates doctor branch schedule.
		- no reusable branch-scope guard for non-owner roles across partner/medical/operational views.
- Phase 4 duplication risks (must be avoided):
	- Duplicating partner-order state logic separately in lab and prescription services instead of one shared partner-order service.
	- Duplicating doctor ownership checks in controllers rather than preserving service-layer guard patterns used by `VisitService`/`QueueService`.
	- Duplicating branch filtering snippets across endpoints instead of one branch-access utility abstraction.
	- Duplicating notification persistence in both message logs and ad-hoc tables without clear channel intent.
	- Duplicating service/catalog pricing resolution already used in self-service and invoice flows.
- Phase 4 risk list (pre-implementation):
	- High: cross-tenant or cross-branch data leakage if partner and thread queries miss tenant/branch constraints.
	- High: unauthorized doctor/staff updates to another doctor's partner orders or document threads if ownership guards are incomplete.
	- High: migration regressions if new required partner fields are added to existing clinical tables without nullable/additive strategy.
	- Medium: inconsistent order/revision state transitions if enums and service checks diverge.
	- Medium: notification storms if each change emits duplicate in-app + message events without de-duplication policy.
	- Medium: report integrity drift if partner-order financials are mixed into existing report totals unexpectedly.
- Locked Phase 4 scope for this pass:
	- Add partner and contract modules (tenant-scoped, branch-aware where applicable):
		- partner registry for lab/radiology/pharmacy types.
		- partner contract terms including effective dates and pricing/commission metadata.
	- Add partner order workflows:
		- lab/radiology partner order lifecycle linked to existing `LabRequest`.
		- pharmacy partner order lifecycle linked to existing `Prescription`.
		- status transitions + timestamps + optional notes.
	- Add patient medical document threads:
		- thread header linked to patient medical document.
		- replies/messages with actor metadata and timestamps.
		- basic open/closed thread state.
	- Add prescription revision tracking:
		- immutable revision snapshots on update/delete paths.
		- revision reason + actor + timestamp.
	- Add in-app notification inbox:
		- persist tenant-user notification items.
		- list/read/mark-all-read endpoints.
		- emit notifications from partner-order state changes, thread replies, and prescription revisions.
	- Add multi-branch access refinement:
		- reusable branch scope utility for role-aware filtering.
		- apply to new Phase 4 endpoints and branch-filterable existing read paths touched in this phase.
		- maintain clinic-owner/manager full access while restricting scoped roles by explicit branch filter policy.
- Planned endpoints to add/update (locked before coding):
	- Partners / contracts:
		- `GET /api/clinic/partners`
		- `POST /api/clinic/partners`
		- `PUT /api/clinic/partners/{partnerId}`
		- `POST /api/clinic/partners/{partnerId}/activation`
		- `GET /api/clinic/partners/contracts`
		- `POST /api/clinic/partners/contracts`
		- `PUT /api/clinic/partners/contracts/{contractId}`
	- Partner orders:
		- `POST /api/clinic/visits/{visitId}/labs/{labRequestId}/partner-order`
		- `POST /api/clinic/visits/{visitId}/prescriptions/{prescriptionId}/partner-order`
		- `GET /api/clinic/partner-orders`
		- `GET /api/clinic/partner-orders/{orderId}`
		- `POST /api/clinic/partner-orders/{orderId}/status`
	- Medical document threads:
		- `GET /api/clinic/patients/{patientId}/medical-documents/{documentId}/threads`
		- `POST /api/clinic/patients/{patientId}/medical-documents/{documentId}/threads`
		- `POST /api/clinic/patients/{patientId}/medical-documents/{documentId}/threads/{threadId}/replies`
		- `POST /api/clinic/patients/{patientId}/medical-documents/{documentId}/threads/{threadId}/close`
	- Prescription revisions:
		- `GET /api/clinic/visits/{visitId}/prescriptions/{id}/revisions`
	- In-app notifications:
		- `GET /api/clinic/notifications/in-app`
		- `POST /api/clinic/notifications/in-app/{id}/read`
		- `POST /api/clinic/notifications/in-app/mark-all-read`
- Planned entities/DTOs to add/update (locked before coding):
	- Add entities:
		- `Partner`
		- `PartnerContract`
		- `PartnerOrder`
		- `PartnerOrderStatusHistory`
		- `PatientMedicalDocumentThread`
		- `PatientMedicalDocumentThreadReply`
		- `PrescriptionRevision`
		- `InAppNotification`
	- Extend existing entities additively:
		- `LabRequest` (optional partner-order linkage fields)
		- `Prescription` (optional partner-order linkage + revision pointers)
	- Add/update enums:
		- `PartnerType`
		- `PartnerOrderStatus`
		- `MedicalDocumentThreadStatus`
		- `InAppNotificationType`
	- Add/update DTOs:
		- partner/contract CRUD request+response DTOs.
		- partner order create/list/detail/status DTOs.
		- document thread/reply DTOs.
		- prescription revision DTOs.
		- in-app notification list/read DTOs.
- Explicit deferred out-of-scope items for this pass:
	- No frontend/UI changes.
	- No external vendor API integration for lab/radiology/pharmacy dispatch.
	- No websocket/push transport implementation beyond persisted in-app feed and existing messaging infrastructure.
	- No full historical backfill/migration of pre-existing prescriptions/lab requests into partner orders/revision records.
	- No broad rewrite of existing non-Phase-4 controllers/services outside targeted additive touch points.
- Files changed:
	- `BACKEND_MASTER_IMPLEMENTATION_REPORT.md` (Phase 4 lock entry only; no backend code changed yet)
- Build result:
	- not run in lock step (no backend code changes yet)
- Test result:
	- not run in lock step (no backend code changes yet)
- Smoke checks:
	- inspection-only pass complete; implementation starts after this lock section
- Unresolved risks:
	- final branch-scope policy details for scoped roles will be validated during implementation tests
	- event volume control for in-app notifications to be verified in test pass
- Final closure checklist:
	- [x] Real-code Phase 4 inspection completed
	- [x] Phase 4 lock written before implementation
	- [x] Phase 4 backend implementation completed
	- [x] Phase 4 migration generated and validated
	- [x] Phase 4 tests added and passing
	- [x] Build and full test suite passing after Phase 4

### Phase 4 - Completed (Backend Implemented + Validated)
- Implemented files and modules:
	- `src/EliteClinic.Application/Features/Clinic/Services/PartnerService.cs` (full partner/contract/order lifecycle + order status history + in-app notifications)
	- `src/EliteClinic.Application/Features/Clinic/Services/INotificationService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/NotificationService.cs` (in-app list/read/mark-all-read)
	- `src/EliteClinic.Application/Features/Clinic/Services/IPatientMedicalService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PatientMedicalService.cs` (document thread list/create/reply/close + patient internal-note filtering + notification emission)
	- `src/EliteClinic.Application/Features/Clinic/Services/IPrescriptionService.cs`
	- `src/EliteClinic.Application/Features/Clinic/Services/PrescriptionService.cs` (revision snapshots on create/update/delete + revision retrieval + notification emission)
	- `src/EliteClinic.Application/Features/Clinic/DTOs/PrescriptionDtos.cs` (added `RevisionReason`)
	- `src/EliteClinic.Api/Controllers/PartnersController.cs` (new)
	- `src/EliteClinic.Api/Controllers/PartnerOrdersController.cs` (new)
	- `src/EliteClinic.Api/Controllers/LabRequestsController.cs` (added create partner-order endpoint)
	- `src/EliteClinic.Api/Controllers/PrescriptionsController.cs` (added create partner-order + revisions endpoint)
	- `src/EliteClinic.Api/Controllers/PatientMedicalController.cs` (added thread endpoints)
	- `src/EliteClinic.Api/Controllers/NotificationsController.cs` (added in-app endpoints)
	- `src/EliteClinic.Api/Program.cs` (DI registrations for `IBranchAccessService`, `IPartnerService`)
- Migration generated and validated:
	- `src/EliteClinic.Infrastructure/Migrations/20260404202657_Phase16_Phase4PartnersThreadsNotifications.cs`
	- `src/EliteClinic.Infrastructure/Migrations/20260404202657_Phase16_Phase4PartnersThreadsNotifications.Designer.cs`
	- Migration add command succeeded during Phase 4 implementation pass.
- Focused Phase 4 tests added:
	- `tests/EliteClinic.Tests/Phase4PartnersThreadsNotificationsTests.cs`
	- Coverage includes:
		- partner lab-order create + status transition + history + in-app notification fan-out
		- prescription revisions (create/update) + revision retrieval + in-app notification emission
		- medical document thread create/reply/close + patient internal-note visibility filtering
		- in-app notification read flow (`mark one` + `mark all`)
		- authorization-role guards on new/extended Phase 4 endpoints
- Build/Test verification after Phase 4 completion:
	- `dotnet build EliteClinic.sln` -> success
	- `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> success (`48/48` passed)
- Smoke checks:
	- targeted domain/service/controller paths compile and tests pass
	- additive migration files present and tracked
- Unresolved risks (deferred intentionally):
	- full runtime HTTP smoke for every Phase 4 endpoint in seeded integration environment not executed in this pass (targeted subset executed)
	- external vendor dispatch integrations remain out of scope

### Post-Phase-4 System-Wide Validation and Frontend Contract Sync (2026-04-04)
- Additional system-wide test hardening added:
	- `tests/EliteClinic.Tests/SystemWideApiContractTests.cs`
	- Coverage focus:
		- all expected controllers are present in API assembly
		- every public controller action is route-decorated with `Http*` attributes
		- protected modules enforce authorization attributes
		- route+verb uniqueness validation across the full API surface
		- role coverage across all business roles (`SuperAdmin`, `ClinicOwner`, `ClinicManager`, `Receptionist`, `Doctor`, `Nurse`, `Patient`)
		- critical Phase 4 endpoint-route presence assertions
- Frontend contract sync artifacts added:
	- `docs/spec-kit/FRONTEND_CONTRACT.md` (full system contract v6.1)
	- `docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md` (generated 215 action-level contracts)
	- `scripts/Generate-EndpointInventorySimple.ps1` (inventory regeneration script)
- End-to-end validation results (latest):
	- `dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj` -> success (`48/48` passed)
	- `dotnet build EliteClinic.sln` -> success
	- `corepack pnpm -C Frontend exec tsc --noEmit` -> success (0 diagnostics)
- Targeted runtime HTTP smoke evidence added:
	- `docs/spec-kit/PHASE4_SMOKE_EVIDENCE_2026-04-04.md`
	- Verified live responses (all HTTP 200):
		- `GET /api/health`
		- `POST /api/auth/login` (owner login on `demo-clinic`)
		- `GET /api/clinic/partners`
		- `GET /api/clinic/partners/contracts`
		- `GET /api/clinic/partner-orders`
		- `GET /api/clinic/notifications/in-app`
		- `POST /api/clinic/notifications/in-app/mark-all-read`
- Remaining deferred item:
	- authenticated runtime HTTP smoke capture (request/response transcripts) for all 215 endpoints is not executed in this pass
