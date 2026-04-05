# FRONTEND END-TO-END AUDIT + EXECUTION PLAN

Generated: 2026-04-05
Scope: Full Frontend folder audit + backend integration alignment plan

## 0) Implementation Update (Post-Audit Baseline)

- Contractor + partner workflow frontend integration has been delivered end-to-end for the requested phase.
- Added partner workflow action layer: list orders, accept, schedule, mark arrived, upload result, list services, create service, create partner user, and partner listing.
- Added new pages: /{tenantSlug}/dashboard/contractor/orders, /{tenantSlug}/dashboard/contractor/services, /{tenantSlug}/dashboard/doctor/contracts (fallback redirect), /{tenantSlug}/dashboard/doctor/reports (fallback redirect).
- Upgraded /{tenantSlug}/dashboard/contracts to operational partner-service + contractor-account management UI.
- Patient history now consumes and renders partner-order timeline data.
- Validation status after this update: corepack pnpm -C Frontend exec tsc --noEmit PASS; dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj -v minimal PASS (51/51).

## 1) Audit Method (What Was Read)

- Full scan of frontend source files (.ts/.tsx/.js/.jsx) under Frontend: 338 files.
- Full scan of app routes: 35 page route files.
- Full scan of action files: 73 files, 112 exported server actions.
- Full scan of model/type files (types + validation): 37 files, 136 exported contracts.
- API coverage comparison performed against generated backend endpoint inventory (219 endpoints).

## 2) Current Frontend Architecture Snapshot

### Top-Level Frontend Folder Counts

| Folder | Total Files | Source Files |
|---|---:|---:|
| app | 122 | 120 |
| actions | 74 | 74 |
| components | 88 | 88 |
| lib | 4 | 4 |
| hooks | 2 | 2 |
| store | 3 | 3 |
| types | 20 | 20 |
| validation | 17 | 17 |

### Action Coverage by Module Folder

| Action Module | Files | Exported Functions |
|---|---:|---:|
| doctor | 13 | 14 |
| patient | 10 | 9 |
| platform | 6 | 13 |
| auth | 6 | 6 |
| visit | 4 | 2 |
| patient-app | 4 | 11 |
| staff | 4 | 4 |
| queue | 4 | 11 |
| finance | 4 | 16 |
| booking | 4 | 4 |
| settings | 3 | 3 |
| prescription | 3 | 0 |
| billing | 2 | 0 |
| labs | 2 | 0 |
| service | 2 | 7 |
| notes | 1 | 3 |
| partner | 1 | 9 |

## 3) Integration Findings (Backend vs Frontend)

- Unique normalized frontend API paths: 98
- Matched frontend API paths: 93
- Unmatched frontend API paths: 5
- Backend endpoints not referenced by frontend: 78

### 3.1 Hard Mismatches and Defects Found

- /api/auth/refresh-token is called from frontend auth/proxy flow, while backend contract route is /api/auth/refresh.
- /api/clinic/partner-orders{*} and /api/clinic/partners{*} appear as unmatched normalized paths due query-string interpolation shape and should be normalized to canonical route literals.
- /api/clinic/visits/my/today is called from doctor action, while backend contract exposes /api/clinic/visits/my.
- Frontend/actions/patient/getPatient.ts is an empty file (zero bytes), leaving one patient retrieval flow incomplete.
- /api/platform/subscriptions${query} appears as a normalized unmatched pattern in static analysis; runtime resolves with querystring, but should be normalized in tooling and validated by contract tests.

### 3.2 Major Backend Feature Areas Missing in Frontend Coverage

#### /api/clinic/inventory (missing coverage: 5)
- GET /api/clinic/inventory/items
- POST /api/clinic/inventory/items
- GET /api/clinic/inventory/items/{itemId:guid}
- PUT /api/clinic/inventory/items/{itemId:guid}
- POST /api/clinic/inventory/items/{itemId:guid}/activation

#### /api/clinic/marketplace (missing coverage: 3)
- GET /api/clinic/marketplace/orders
- GET /api/clinic/marketplace/orders/{orderId:guid}
- POST /api/clinic/marketplace/orders/{orderId:guid}/status

#### /api/clinic/partners (missing coverage: 5)
- GET /api/clinic/partners
- POST /api/clinic/partners
- POST /api/clinic/partners/{partnerId:guid}/activation
- GET /api/clinic/partners/contracts
- POST /api/clinic/partners/contracts

#### /api/clinic/partner-orders (missing coverage: 3)
- GET /api/clinic/partner-orders
- GET /api/clinic/partner-orders/{orderId:guid}
- POST /api/clinic/partner-orders/{orderId:guid}/status

#### /api/clinic/reports (missing coverage: 3)
- GET /api/clinic/reports/my-overview
- GET /api/clinic/reports/overview
- GET /api/clinic/reports/services

#### /api/clinic/self-service-requests (missing coverage: 6)
- GET /api/clinic/self-service-requests
- GET /api/clinic/self-service-requests/{requestId:guid}
- POST /api/clinic/self-service-requests/{requestId:guid}/adjust-paid-amount
- POST /api/clinic/self-service-requests/{requestId:guid}/approve
- POST /api/clinic/self-service-requests/{requestId:guid}/reject
- POST /api/clinic/self-service-requests/{requestId:guid}/request-reupload

#### /api/clinic/patient-app (missing coverage: 0)
- No missing endpoints in this bucket.

#### /api/clinic/patients/*/medical-documents + chronic-conditions (missing coverage: 7)
- GET /api/clinic/patients/{patientId:guid}/medical-documents
- POST /api/clinic/patients/{patientId:guid}/medical-documents
- GET /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}
- GET /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads
- POST /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads
- POST /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads/{threadId:guid}/close
- POST /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads/{threadId:guid}/replies

#### /api/public (missing coverage: 7)
- GET /api/public/{slug}/doctors/available-now
- GET /api/public/{slug}/landing
- GET /api/public/{slug}/marketplace/items
- GET /api/public/{slug}/marketplace/items/{itemId:guid}
- POST /api/public/{slug}/marketplace/orders
- GET /api/public/{slug}/payment-options
- GET /api/public/{slug}/services

#### /api/platform (missing coverage: 0)
- No missing endpoints in this bucket.

#### Other missing backend endpoints (outside named buckets)
- Count: 39

### 3.3 Controllers with Highest Uncovered Endpoint Counts

| Controller | Uncovered Endpoints |
|---|---:|
| WorkforceController | 10 |
| NotificationsController | 7 |
| PartnersController | 5 |
| PublicController | 7 |
| PatientMedicalController | 7 |
| SelfServiceRequestsController | 6 |
| InventoryController | 5 |
| MessagesController | 4 |
| VisitsController | 3 |
| ReportsController | 3 |
| PartnerOrdersController | 3 |
| MarketplaceOrdersController | 3 |
| PrescriptionsController | 2 |
| LabRequestsController | 2 |
| ClinicSettingsController | 2 |
| PatientsController | 2 |
| QueueSessionsController | 2 |
| HealthController | 1 |
| AuthController | 1 |
| MediaController | 1 |
| DoctorsController | 1 |
| InvoicesController | 1 |

## 4) Missing Frontend Product Surfaces

- Inventory management UI/action layer is missing end-to-end (list/create/update/activation).
- Marketplace backoffice order management UI/action layer is missing.
- Partner and contractor workflow UI/action layer is now implemented for operational execution (orders, services, contractor accounts), but partner core CRUD/activation/contracts coverage is still partial.
- Self-service request review/approval/rejection/reupload admin UI flow is missing.
- Patient medical document threads (list/upload/thread/reply/close) UI flow is missing.
- ReportsController endpoints are uncovered by dedicated report contracts (current finance reports page is not wired to the new report contract set).
- Public landing/marketplace/public payment options flows are partially uncovered against new public endpoints.
- In-app notifications management/consumption flows are partially uncovered in current action surface.
- Contract hotfix gaps remain: auth refresh path mismatch, doctor "my today" visits mismatch, and empty Frontend/actions/patient/getPatient.ts.

## 5) End-to-End Completion Plan (Remaining Work)

### Phase FE-1: Contract Alignment Hotfixes (Immediate)
- Update auth refresh calls to /api/auth/refresh in frontend auth action + proxy middleware refresh flow.
- Replace doctor today visits call with supported backend route (/api/clinic/visits/my + date filtering client side or add backend route intentionally).
- Implement Frontend/actions/patient/getPatient.ts with typed fetchApi contract and tests.
- Add API contract guard tests for all auth/doctor/patient critical endpoints.

### Phase FE-2: Missing Actions for New Backend Modules
- Complete remaining action groups: inventory, marketplace, self-service-requests, patient-medical-docs, reports-v2, plus partner core CRUD/contract/activation gaps.
- Define strict request/response types under Frontend/types and validation schemas under Frontend/validation for each new action group.
- Add cache revalidation strategy per route area (dashboard sections and patient app areas).

### Phase FE-3: Dashboard UI Modules (Clinic Backoffice)
- Add dashboard pages and widgets for inventory and marketplace order operations.
- Complete partner management surfaces for partner CRUD, contract lifecycle, and activation toggles.
- Add self-service requests review queue page with approve/reject/reupload/adjust actions.
- Add reports pages wired to ReportsController endpoints (overview/services/my-overview).

### Phase FE-4: Patient Medical Docs + Threads
- Build patient medical documents tab with upload/list/download and threaded discussion views.
- Add reply/close thread interactions and role-aware guards for staff/patient.

### Phase FE-5: Public and Patient-App Completion
- Complete public marketplace and landing endpoint consumption (available-now doctors, item details, payment options).
- Validate patient-app profile/visits/bookings/queue-ticket/summary against backend contract versions.
- Add self-service request creation and payment proof upload flow in patient-facing experience if required by product scope.

### Phase FE-6: Notifications and Cross-Cutting UX
- Complete in-app notifications list/read/mark-all-read UX and bell counters.
- Add robust error-state components for 401/403/429/network timeout (fetchApi already supports these codes).

### Phase FE-7: Testing + Release Hardening
- Add endpoint contract tests for every action file against backend inventory snapshots.
- Add route smoke tests for all dashboard/public/patient critical pages.
- Add typed DTO drift check between frontend types and backend DTO contracts.
- Run staged rollout: contract fixes -> action parity -> UI parity -> E2E tests -> production release.

## 6) Acceptance Criteria for Frontend Completion

- Unmatched frontend API paths reduced from 5 to 0.
- Backend endpoints not referenced by frontend reduced from 78 to target agreed scope (or 0 if full parity target).
- All critical modules (inventory, marketplace, partners, self-service requests, patient medical docs, reports) have both action layer and page layer coverage.
- End-to-end smoke suite passes for admin, staff, doctor, patient-app, and public flows.

## 7) Route Snapshot (Current Frontend Pages)

- /  <-  Frontend/app/page.tsx
- /{*}  <-  Frontend/app/[tenantSlug]/(public)/page.tsx
- /{*}/dashboard  <-  Frontend/app/[tenantSlug]/dashboard/page.tsx
- /{*}/dashboard/appointments  <-  Frontend/app/[tenantSlug]/dashboard/(clinical)/appointments/page.tsx
- /{*}/dashboard/contractor/orders  <-  Frontend/app/[tenantSlug]/dashboard/contractor/orders/page.tsx
- /{*}/dashboard/contractor/services  <-  Frontend/app/[tenantSlug]/dashboard/contractor/services/page.tsx
- /{*}/dashboard/contracts  <-  Frontend/app/[tenantSlug]/dashboard/(finance)/contracts/page.tsx
- /{*}/dashboard/doctor/contracts  <-  Frontend/app/[tenantSlug]/dashboard/doctor/contracts/page.tsx
- /{*}/dashboard/doctor/patients  <-  Frontend/app/[tenantSlug]/dashboard/doctor/patients/page.tsx
- /{*}/dashboard/doctor/patients/{*}  <-  Frontend/app/[tenantSlug]/dashboard/doctor/patients/[patientId]/page.tsx
- /{*}/dashboard/doctor/queue  <-  Frontend/app/[tenantSlug]/dashboard/doctor/queue/page.tsx
- /{*}/dashboard/doctor/reports  <-  Frontend/app/[tenantSlug]/dashboard/doctor/reports/page.tsx
- /{*}/dashboard/doctor/settings  <-  Frontend/app/[tenantSlug]/dashboard/doctor/settings/page.tsx
- /{*}/dashboard/doctor/visits  <-  Frontend/app/[tenantSlug]/dashboard/doctor/visits/page.tsx
- /{*}/dashboard/doctor/visits/{*}  <-  Frontend/app/[tenantSlug]/dashboard/doctor/visits/[visitId]/page.tsx
- /{*}/dashboard/doctors  <-  Frontend/app/[tenantSlug]/dashboard/(management)/doctors/page.tsx
- /{*}/dashboard/expenses  <-  Frontend/app/[tenantSlug]/dashboard/(finance)/expenses/page.tsx
- /{*}/dashboard/invoices  <-  Frontend/app/[tenantSlug]/dashboard/(finance)/invoices/page.tsx
- /{*}/dashboard/patients  <-  Frontend/app/[tenantSlug]/dashboard/(clinical)/patients/page.tsx
- /{*}/dashboard/patients/{*}  <-  Frontend/app/[tenantSlug]/dashboard/(clinical)/patients/[id]/page.tsx
- /{*}/dashboard/queue  <-  Frontend/app/[tenantSlug]/dashboard/(clinical)/queue/page.tsx
- /{*}/dashboard/reports  <-  Frontend/app/[tenantSlug]/dashboard/(finance)/reports/page.tsx
- /{*}/dashboard/services  <-  Frontend/app/[tenantSlug]/dashboard/(management)/services/page.tsx
- /{*}/dashboard/settings  <-  Frontend/app/[tenantSlug]/dashboard/(management)/settings/page.tsx
- /{*}/dashboard/staff  <-  Frontend/app/[tenantSlug]/dashboard/(management)/staff/page.tsx
- /{*}/login  <-  Frontend/app/[tenantSlug]/login/page.tsx
- /{*}/patient  <-  Frontend/app/[tenantSlug]/patient/(main)/page.tsx
- /{*}/patient/bookings  <-  Frontend/app/[tenantSlug]/patient/(main)/bookings/page.tsx
- /{*}/patient/history  <-  Frontend/app/[tenantSlug]/patient/(main)/history/page.tsx
- /{*}/patient/login  <-  Frontend/app/[tenantSlug]/patient/login/page.tsx
- /{*}/patient/profile  <-  Frontend/app/[tenantSlug]/patient/(main)/profile/page.tsx
- /admin  <-  Frontend/app/(platform)/admin/(dashboard)/page.tsx
- /admin/login  <-  Frontend/app/(platform)/admin/login/page.tsx
- /admin/subscriptions  <-  Frontend/app/(platform)/admin/(dashboard)/subscriptions/page.tsx
- /admin/tenants  <-  Frontend/app/(platform)/admin/(dashboard)/tenants/page.tsx

## 8) Highest-Export Model Files (Current)

- Frontend/types/enums.ts (exports: 44)
- Frontend/types/visit.ts (exports: 13)
- Frontend/types/partner.ts (exports: 9)
- Frontend/types/queue.ts (exports: 6)
- Frontend/types/finance.ts (exports: 5)
- Frontend/types/patient.ts (exports: 4)
- Frontend/validation/subscription.ts (exports: 4)
- Frontend/types/doctor.ts (exports: 4)
- Frontend/types/public.ts (exports: 4)
- Frontend/validation/patient.ts (exports: 3)
- Frontend/types/api.ts (exports: 3)
- Frontend/types/patient-app.ts (exports: 4)
- Frontend/validation/invoice.ts (exports: 2)
- Frontend/validation/services.ts (exports: 2)
- Frontend/types/auth.ts (exports: 2)
- Frontend/validation/doctor.ts (exports: 2)
- Frontend/types/settings.ts (exports: 2)
- Frontend/validation/staff.ts (exports: 2)
- Frontend/validation/queue.ts (exports: 2)
- Frontend/types/services.ts (exports: 2)
- Frontend/validation/login.ts (exports: 1)
- Frontend/validation/labs.ts (exports: 1)
- Frontend/validation/settings.ts (exports: 1)
- Frontend/validation/prescription.ts (exports: 1)
- Frontend/validation/tenant.ts (exports: 1)
- Frontend/validation/visit.ts (exports: 1)
- Frontend/types/notes.ts (exports: 1)
- Frontend/types/platform.ts (exports: 1)
- Frontend/types/feature-flags.ts (exports: 1)
- Frontend/types/booking.ts (exports: 1)
- Frontend/types/expense.ts (exports: 1)
