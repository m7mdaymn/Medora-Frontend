# SYSTEM MASTER BACKEND + FRONTEND ALIGNMENT REPORT

Generated: 2026-04-05
Scope: Full backend contract + full frontend integration coverage + workflow scenarios

---

## Date: 2026-04-04 (Historical Smoke Evidence Snapshot)

- Source: docs/spec-kit/PHASE4_SMOKE_EVIDENCE_2026-04-04.md
- Recorded smoke checks: 7
  | GET | /api/health | 200 | {"success":true,"message":"Operation completed successfully","data":{"status":"Healthy","database":"Connected","version":"0.0.1","timestamp":"2026-04-04T21:16:43.163099Z"},"errors"... |
  | POST | /api/auth/login | 200 | {"success":true,"message":"Login successful","data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1la... |
  | GET | /api/clinic/partners?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 partner(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":false},"errors... |
  | GET | /api/clinic/partners/contracts | 200 | {"success":true,"message":"Retrieved 0 contract(s)","data":[],"errors":[],"meta":{"timestamp":"2026-04-04T21:16:45.4281793Z","requestId":"5345a4b8-bf04-475e-8458-242a24438b49"}} |
  | GET | /api/clinic/partner-orders?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 partner order(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":false},"... |
  | GET | /api/clinic/notifications/in-app?pageNumber=1&pageSize=5 | 200 | {"success":true,"message":"Retrieved 0 in-app notification(s)","data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":5,"totalPages":0,"hasPreviousPage":false,"hasNextPage":fa... |
  | POST | /api/clinic/notifications/in-app/mark-all-read | 200 | {"success":true,"message":"No unread notifications","data":0,"errors":[],"meta":{"timestamp":"2026-04-04T21:16:48.1471419Z","requestId":"657663d3-5018-453d-9deb-52fd38dddb3b"}} |

## Date: 2026-04-05 (Current Verified Runtime + Contract State)

- Backend validation gates: clean/build/test/migrations/parity all passed in the latest run.
- Build status: success (32 warnings, 0 errors).
- Test status: 51 passed, 0 failed.
- EF migration chain includes historical Phase13 to Phase17 IDs.
- Strict parity (report-vs-codebase): missing exact paths 0, missing bare filenames 0, ambiguous bare filenames 2.

## Date: 2026-04-05 (Phase17 Contractor + Partner Workflow Delivery Update)

- Backend partner workflow now supports explicit milestones: accept, schedule, arrived, and result upload/completion.
- New backend contract surface delivered:
  - POST /api/clinic/partner-orders/{orderId:guid}/accept
  - POST /api/clinic/partner-orders/{orderId:guid}/schedule
  - POST /api/clinic/partner-orders/{orderId:guid}/arrived
  - POST /api/clinic/partner-orders/{orderId:guid}/result
  - POST /api/clinic/partners/{partnerId:guid}/users
  - GET/POST/PUT /api/clinic/partners/services
  - GET /api/clinic/patient-app/profiles/{patientId:guid}/partner-orders
- Financial rule implemented per product clarification: if settlement target is Clinic, doctor share is computed from clinic share only.
- External contractor access is active via Contractor role plus partner-user linkage and scoped access checks.
- Frontend sync delivered for contractor workflows:
  - Contractor orders workspace (accept/schedule/arrived/result).
  - Contractor services workspace (catalog create/list).
  - Staff contracts workspace upgraded to manage partner services and contractor accounts.
  - Patient history now includes partner-order timeline.
- Frontend typed-route stabilization completed by adding doctor route fallbacks:
  - /{tenantSlug}/dashboard/doctor/contracts -> redirects to doctor queue.
  - /{tenantSlug}/dashboard/doctor/reports -> redirects to doctor visits.
- Verification (latest run):
  - corepack pnpm -C Frontend exec tsc --noEmit: PASS (exit code 0).
  - dotnet test tests/EliteClinic.Tests/EliteClinic.Tests.csproj -v minimal: PASS (51/51).
- Endpoint inventory refreshed from controllers: docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md now reports 219 rows (Generated: 2026-04-05 19:42:12 +02:00).

## Date: 2026-04-05 (System Workflow Scenarios - Current Behavior)

### 1) Identity and Tenant Context
- Staff login and refresh are handled by auth endpoints and tenant-aware headers.
- Patient login is handled through dedicated patient auth flow.
- Frontend middleware/proxy routes users by tenant slug and role section (admin/dashboard/patient).

### 2) Platform Administration (SuperAdmin)
- Tenant lifecycle: create, update, activate, suspend, block, delete.
- Subscription lifecycle: create, extend, mark-paid, cancel.
- Tenant feature flags: read/update per tenant.

### 3) Clinic Operations Core
- Reception flow: queue sessions, queue tickets, call/start/finish/skip/cancel/urgent.
- Clinical flow: visits, prescriptions, lab requests, doctor notes, patient summaries/history.
- Finance flow: invoices, payments, refunds, expenses, daily/monthly/yearly/profit/by-doctor reports.

### 4) Extended Phase13-17 Domains
- Self-service requests: review queue, approve/reject/reupload/adjust-paid-amount conversion paths.
- Inventory + marketplace: catalog, activation, public sellable items, marketplace order lifecycle.
- Partners + partner orders: partners/contracts management and order status lifecycle.
- Medical document threads + in-app notifications + prescription revisions are present in backend contract.

### 5) Public + Patient App Experience
- Public API: clinic profile, services, doctors, landing payload, payment options, marketplace public flow.
- Patient app API: profile, visits, bookings, queue-ticket, summary, credits.

## Date: 2026-04-05 (Frontend Missing From Backend - Required Gap Section)

- Frontend source files scanned: 338
- Unique normalized frontend API paths: 98
- Matched frontend API paths: 93
- Unmatched frontend API paths: 5
- Backend endpoints not referenced by frontend: 78

### Unmatched Frontend API Calls
- /api/auth/refresh-token | files: Frontend/actions/auth/refresh-token.ts; Frontend/proxy.ts
- /api/clinic/partner-orders{*} | files: Frontend/actions/partner/workflow.ts
- /api/clinic/partners{*} | files: Frontend/actions/partner/workflow.ts
- /api/clinic/visits/my/today | files: Frontend/actions/doctor/get-my-today-visits.ts
- /api/platform/subscriptions{*} | files: Frontend/actions/platform/subscriptions.ts

### Backend Not Referenced by Frontend - Priority Buckets
- /api/clinic/inventory: 5
- /api/clinic/marketplace: 3
- /api/clinic/partners: 5
- /api/clinic/partner-orders: 3
- /api/clinic/reports: 3
- /api/clinic/self-service-requests: 6
- /api/clinic/patient-app: 0
- /api/clinic/patients/*/medical-documents + chronic-conditions: 7
- /api/public: 7
- /api/platform: 0
- other: 39

### Backend Not Referenced by Frontend - Top Controllers
- WorkforceController: 10
- NotificationsController: 7
- PatientMedicalController: 7
- PublicController: 7
- SelfServiceRequestsController: 6
- InventoryController: 5
- PartnersController: 5
- MessagesController: 4
- MarketplaceOrdersController: 3
- PartnerOrdersController: 3
- ReportsController: 3
- VisitsController: 3
- ClinicSettingsController: 2
- LabRequestsController: 2
- PatientsController: 2
- PrescriptionsController: 2
- QueueSessionsController: 2
- AuthController: 1
- DoctorsController: 1
- HealthController: 1
- InvoicesController: 1
- MediaController: 1

---

## FULL ENDPOINT INVENTORY (Current)

- Source: docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md
- Endpoint count: 219

# Endpoint Inventory (Generated)

Generated: 2026-04-05 19:42:12 +02:00
Source: src/EliteClinic.Api/Controllers

| Method | Route | Controller | Action | Auth |
|---|---|---|---|---|
| POST | /api/auth/login | AuthController | Login | Unspecified |
| GET | /api/auth/me | AuthController | GetMe | Authorized |
| POST | /api/auth/patient/login | AuthController | PatientLogin | Unspecified |
| POST | /api/auth/refresh | AuthController | Refresh | Unspecified |
| GET | /api/clinic/bookings | BookingsController | GetAll | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/bookings | BookingsController | Create | Roles: Patient,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/bookings/{id:guid} | BookingsController | GetById | Roles: Patient,ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/bookings/{id:guid}/cancel | BookingsController | Cancel | Roles: Patient,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/bookings/{id:guid}/reschedule | BookingsController | Reschedule | Roles: Patient,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/bookings/my | BookingsController | GetMyBookings | Roles: Patient |
| GET | /api/clinic/doctor-notes | DoctorNotesController | GetAll | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/doctor-notes | DoctorNotesController | Create | Roles: Doctor,SuperAdmin |
| POST | /api/clinic/doctor-notes/{id:guid}/read | DoctorNotesController | MarkAsRead | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/doctor-notes/unread | DoctorNotesController | GetUnread | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/doctors | DoctorsController | GetAllDoctors | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,SuperAdmin |
| POST | /api/clinic/doctors | DoctorsController | CreateDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/doctors/{id:guid} | DoctorsController | GetDoctorById | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| PATCH | /api/clinic/doctors/{id:guid} | DoctorsController | PatchDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/doctors/{id:guid} | DoctorsController | UpdateDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/doctors/{id:guid}/disable | DoctorsController | DisableDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/doctors/{id:guid}/enable | DoctorsController | EnableDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/doctors/{id:guid}/services | DoctorsController | UpdateServices | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/doctors/{id:guid}/visit-fields | DoctorsController | UpdateVisitFields | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/doctors/me | DoctorsController | GetMyProfile | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/doctors/me/patients | DoctorsController | GetMyPatients | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/doctors/me/patients/{patientId:guid}/history | DoctorsController | GetMyPatientHistory | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/doctors/me/visit-fields | DoctorsController | GetMyVisitFields | Roles: Doctor,SuperAdmin |
| PUT | /api/clinic/doctors/me/visit-fields | DoctorsController | UpdateMyVisitFields | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/expenses | ExpensesController | GetAll | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/expenses | ExpensesController | Create | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| DELETE | /api/clinic/expenses/{id:guid} | ExpensesController | Delete | Roles: ClinicOwner,SuperAdmin |
| PUT | /api/clinic/expenses/{id:guid} | ExpensesController | Update | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/finance/by-doctor | FinanceController | GetByDoctor | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/finance/daily | FinanceController | GetDailyRevenue | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/finance/monthly | FinanceController | GetMonthly | Roles: ClinicOwner,SuperAdmin |
| GET | /api/clinic/finance/profit | FinanceController | GetProfit | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/finance/yearly | FinanceController | GetYearly | Roles: ClinicOwner,SuperAdmin |
| GET | /api/clinic/inventory/items | InventoryController | GetItems | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/inventory/items | InventoryController | Create | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/inventory/items/{itemId:guid} | InventoryController | GetItemById | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| PUT | /api/clinic/inventory/items/{itemId:guid} | InventoryController | Update | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/inventory/items/{itemId:guid}/activation | InventoryController | SetActivation | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/invoices | InvoicesController | GetInvoices | Roles: ClinicOwner,ClinicManager,Doctor,Receptionist,SuperAdmin |
| POST | /api/clinic/invoices | InvoicesController | CreateInvoice | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/invoices/{id:guid} | InvoicesController | GetInvoice | Roles: ClinicOwner,ClinicManager,Doctor,Receptionist,SuperAdmin |
| PATCH | /api/clinic/invoices/{id:guid} | InvoicesController | PatchInvoice | Roles: ClinicOwner,ClinicManager,Doctor,Receptionist,SuperAdmin |
| PUT | /api/clinic/invoices/{id:guid} | InvoicesController | UpdateInvoice | Roles: ClinicOwner,ClinicManager,Doctor,Receptionist,SuperAdmin |
| POST | /api/clinic/invoices/{id:guid}/adjustments | InvoicesController | AddAdjustment | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/invoices/{id:guid}/line-items | InvoicesController | AddLineItem | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/invoices/{id:guid}/payments | InvoicesController | GetPayments | Roles: ClinicOwner,ClinicManager,Doctor,Receptionist,SuperAdmin |
| POST | /api/clinic/invoices/{id:guid}/refund | InvoicesController | Refund | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/marketplace/orders | MarketplaceOrdersController | GetOrders | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/marketplace/orders/{orderId:guid} | MarketplaceOrdersController | GetOrderById | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/marketplace/orders/{orderId:guid}/status | MarketplaceOrdersController | UpdateStatus | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/media/clinic-image | MediaController | UploadClinicImage | Roles: ClinicOwner,SuperAdmin |
| POST | /api/clinic/media/clinic-logo | MediaController | UploadClinicLogo | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/media/doctors/{doctorId:guid}/photo | MediaController | UploadDoctorPhoto | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/messages | MessagesController | GetAll | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/messages/{id:guid} | MessagesController | GetById | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/messages/{id:guid}/retry | MessagesController | Retry | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/messages/send | MessagesController | Send | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| DELETE | /api/clinic/notifications/{id:guid} | NotificationsController | Unsubscribe | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/notifications/in-app | NotificationsController | GetInApp | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| POST | /api/clinic/notifications/in-app/{id:guid}/read | NotificationsController | MarkInAppRead | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| POST | /api/clinic/notifications/in-app/mark-all-read | NotificationsController | MarkAllInAppRead | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| GET | /api/clinic/notifications/my | NotificationsController | GetMySubscriptions | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/notifications/send | NotificationsController | SendNotification | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/notifications/subscribe | NotificationsController | Subscribe | Roles: Patient,Doctor,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/partner-orders | PartnerOrdersController | List | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin |
| GET | /api/clinic/partner-orders/{orderId:guid} | PartnerOrdersController | GetById | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin |
| POST | /api/clinic/partner-orders/{orderId:guid}/status | PartnerOrdersController | UpdateStatus | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin |
| GET | /api/clinic/partners | PartnersController | List | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/partners | PartnersController | Create | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/partners/{partnerId:guid} | PartnersController | Update | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/partners/{partnerId:guid}/activation | PartnersController | SetActivation | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/partners/contracts | PartnersController | ListContracts | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/partners/contracts | PartnersController | CreateContract | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/partners/contracts/{contractId:guid} | PartnersController | UpdateContract | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/patient-app/profiles/{patientId:guid} | PatientAppController | GetProfile | Roles: Patient,SuperAdmin |
| GET | /api/clinic/patient-app/profiles/{patientId:guid}/bookings | PatientAppController | GetBookings | Roles: Patient,SuperAdmin |
| GET | /api/clinic/patient-app/profiles/{patientId:guid}/queue-ticket | PatientAppController | GetQueueTicket | Roles: Patient,SuperAdmin |
| GET | /api/clinic/patient-app/profiles/{patientId:guid}/summary | PatientAppController | GetSummary | Roles: Patient,SuperAdmin |
| GET | /api/clinic/patient-app/profiles/{patientId:guid}/visits | PatientAppController | GetVisits | Roles: Patient,SuperAdmin |
| GET | /api/clinic/patient-credits/{patientId:guid}/balance | PatientCreditsController | GetBalance | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| GET | /api/clinic/patient-credits/{patientId:guid}/history | PatientCreditsController | GetHistory | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| GET | /api/clinic/patients | PatientsController | GetAllPatients | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| POST | /api/clinic/patients | PatientsController | CreatePatient | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| DELETE | /api/clinic/patients/{id:guid} | PatientsController | DeletePatient | Roles: ClinicOwner,Receptionist,SuperAdmin |
| GET | /api/clinic/patients/{id:guid} | PatientsController | GetPatientById | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| PATCH | /api/clinic/patients/{id:guid} | PatientsController | PatchPatient | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| PUT | /api/clinic/patients/{id:guid} | PatientsController | UpdatePatient | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/patients/{id:guid}/profiles | PatientsController | AddSubProfile | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/patients/{id:guid}/reset-password | PatientsController | ResetPassword | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/patients/{id:guid}/send-credentials | PatientsController | SendCredentials | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/chronic-conditions | PatientMedicalController | GetChronicProfile | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| PUT | /api/clinic/patients/{patientId:guid}/chronic-conditions | PatientMedicalController | UpsertChronicProfile | Roles: ClinicOwner,ClinicManager,Nurse,Doctor,Patient,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/medical-documents | PatientMedicalController | ListDocuments | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| POST | /api/clinic/patients/{patientId:guid}/medical-documents | PatientMedicalController | UploadDocument | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid} | PatientMedicalController | DownloadDocument | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads | PatientMedicalController | ListDocumentThreads | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| POST | /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads | PatientMedicalController | CreateDocumentThread | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| POST | /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads/{threadId:guid}/close | PatientMedicalController | CloseThread | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| POST | /api/clinic/patients/{patientId:guid}/medical-documents/{documentId:guid}/threads/{threadId:guid}/replies | PatientMedicalController | AddThreadReply | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/summary | VisitsController | GetPatientSummary | Roles: ClinicOwner,Doctor,SuperAdmin |
| GET | /api/clinic/patients/{patientId:guid}/visits | VisitsController | GetPatientVisits | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/payments | InvoicesController | RecordPayment | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/queue/board | QueueBoardController | GetBoard | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| GET | /api/clinic/queue/my-queue | QueueBoardController | GetMyQueue | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/queue/my-ticket | QueueBoardController | GetMyTicket | Roles: Patient,SuperAdmin |
| GET | /api/clinic/queue/sessions | QueueSessionsController | GetSessions | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/queue/sessions | QueueSessionsController | OpenSession | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| GET | /api/clinic/queue/sessions/{id:guid} | QueueSessionsController | GetSession | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/queue/sessions/{id:guid}/close | QueueSessionsController | CloseSession | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| GET | /api/clinic/queue/sessions/{id:guid}/tickets | QueueSessionsController | GetTickets | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/queue/sessions/close-all | QueueSessionsController | CloseAllSessions | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/queue/tickets | QueueTicketsController | IssueTicket | Roles: ClinicOwner,ClinicManager,Receptionist,Nurse,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/call | QueueTicketsController | CallTicket | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/cancel | QueueTicketsController | CancelTicket | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/finish | QueueTicketsController | FinishTicket | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/skip | QueueTicketsController | SkipTicket | Roles: ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/start-visit | QueueTicketsController | StartVisit | Roles: ClinicOwner,ClinicManager,Doctor,Nurse,SuperAdmin |
| POST | /api/clinic/queue/tickets/{id:guid}/urgent | QueueTicketsController | MarkUrgent | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| POST | /api/clinic/queue/tickets/with-payment | QueueTicketsController | IssueTicketWithPayment | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/reports/my-overview | ReportsController | GetMyOverview | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/reports/overview | ReportsController | GetOverview | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/reports/services | ReportsController | GetServicesSales | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/self-service-requests | SelfServiceRequestsController | GetAll | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/self-service-requests/{requestId:guid} | SelfServiceRequestsController | GetById | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/self-service-requests/{requestId:guid}/adjust-paid-amount | SelfServiceRequestsController | AdjustPaidAmount | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/self-service-requests/{requestId:guid}/approve | SelfServiceRequestsController | Approve | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/self-service-requests/{requestId:guid}/reject | SelfServiceRequestsController | Reject | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/self-service-requests/{requestId:guid}/request-reupload | SelfServiceRequestsController | RequestReupload | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/services | ClinicServicesController | GetAll | Roles: SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist,Nurse |
| POST | /api/clinic/services | ClinicServicesController | Create | Roles: SuperAdmin,ClinicOwner,ClinicManager |
| DELETE | /api/clinic/services/{id:guid} | ClinicServicesController | Delete | Roles: SuperAdmin,ClinicOwner,ClinicManager |
| GET | /api/clinic/services/{id:guid} | ClinicServicesController | GetById | Roles: SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist,Nurse |
| PATCH | /api/clinic/services/{id:guid} | ClinicServicesController | Update | Roles: SuperAdmin,ClinicOwner,ClinicManager |
| GET | /api/clinic/services/doctors/{doctorId:guid}/links | ClinicServicesController | GetDoctorLinks | Roles: SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist |
| DELETE | /api/clinic/services/doctors/{doctorId:guid}/links/{clinicServiceId:guid} | ClinicServicesController | RemoveDoctorLink | Roles: SuperAdmin,ClinicOwner,ClinicManager |
| PUT | /api/clinic/services/doctors/{doctorId:guid}/links/{clinicServiceId:guid} | ClinicServicesController | UpsertDoctorLink | Roles: SuperAdmin,ClinicOwner,ClinicManager |
| GET | /api/clinic/settings | ClinicSettingsController | GetSettings | Authorized |
| PATCH | /api/clinic/settings | ClinicSettingsController | PatchSettings | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/settings | ClinicSettingsController | UpdateSettings | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/settings/payment-methods | ClinicSettingsController | ReplacePaymentMethods | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/settings/payment-options | ClinicSettingsController | GetPaymentOptions | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/staff | StaffController | GetAllStaff | Authorized |
| POST | /api/clinic/staff | StaffController | CreateStaff | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/staff/{id:guid} | StaffController | GetStaffById | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PATCH | /api/clinic/staff/{id:guid} | StaffController | PatchStaff | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| PUT | /api/clinic/staff/{id:guid} | StaffController | UpdateStaff | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/staff/{id:guid}/disable | StaffController | DisableStaff | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/staff/{id:guid}/enable | StaffController | EnableStaff | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/staff/payroll-only | StaffController | CreatePayrollOnlyWorker | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/visits | VisitsController | CreateVisit | Roles: ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| GET | /api/clinic/visits/{id:guid} | VisitsController | GetVisit | Roles: ClinicOwner,Doctor,SuperAdmin |
| PUT | /api/clinic/visits/{id:guid} | VisitsController | UpdateVisit | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/visits/{id:guid}/complete | VisitsController | CompleteVisit | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/visits/{id:guid}/inventory-usage | VisitsController | RecordInventoryUsage | Roles: Doctor,ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/visits/{visitId:guid}/labs | LabRequestsController | GetByVisit | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/visits/{visitId:guid}/labs | LabRequestsController | Create | Roles: ClinicOwner,Doctor,SuperAdmin |
| DELETE | /api/clinic/visits/{visitId:guid}/labs/{id:guid} | LabRequestsController | Delete | Roles: ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| PUT | /api/clinic/visits/{visitId:guid}/labs/{id:guid} | LabRequestsController | Update | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/visits/{visitId:guid}/labs/{id:guid}/result | LabRequestsController | AddResult | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/visits/{visitId:guid}/labs/{labRequestId:guid}/partner-order | LabRequestsController | CreatePartnerOrder | Roles: ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| GET | /api/clinic/visits/{visitId:guid}/prescriptions | PrescriptionsController | GetByVisit | Roles: ClinicOwner,Doctor,SuperAdmin |
| POST | /api/clinic/visits/{visitId:guid}/prescriptions | PrescriptionsController | Create | Roles: ClinicOwner,Doctor,SuperAdmin |
| DELETE | /api/clinic/visits/{visitId:guid}/prescriptions/{id:guid} | PrescriptionsController | Delete | Roles: ClinicOwner,Doctor,SuperAdmin |
| PUT | /api/clinic/visits/{visitId:guid}/prescriptions/{id:guid} | PrescriptionsController | Update | Roles: ClinicOwner,Doctor,SuperAdmin |
| GET | /api/clinic/visits/{visitId:guid}/prescriptions/{id:guid}/revisions | PrescriptionsController | GetRevisions | Roles: ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin |
| POST | /api/clinic/visits/{visitId:guid}/prescriptions/{prescriptionId:guid}/partner-order | PrescriptionsController | CreatePartnerOrder | Roles: ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| POST | /api/clinic/visits/maintenance/{id:guid}/close | VisitsController | CloseStaleVisit | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/visits/maintenance/stale-open | VisitsController | GetStaleOpenVisits | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/visits/my | VisitsController | GetMyVisits | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/visits/my/patients | VisitsController | GetMyPatients | Roles: Doctor,SuperAdmin |
| GET | /api/clinic/workforce/absence | WorkforceController | ListAbsence | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/workforce/absence | WorkforceController | CreateAbsence | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/workforce/attendance | WorkforceController | ListAttendance | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| POST | /api/clinic/workforce/attendance | WorkforceController | CreateAttendance | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| PUT | /api/clinic/workforce/attendance/{attendanceId:guid}/checkout | WorkforceController | CheckOutAttendance | Roles: ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| GET | /api/clinic/workforce/daily-closing | WorkforceController | GetDailyClosingSnapshots | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/workforce/daily-closing/generate | WorkforceController | GenerateDailyClosing | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/clinic/workforce/doctors/{doctorId:guid}/compensation-rules | WorkforceController | ListCompensationRules | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/workforce/doctors/{doctorId:guid}/compensation-rules | WorkforceController | CreateCompensationRule | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| POST | /api/clinic/workforce/salary-payouts | WorkforceController | CreateSalaryPayout | Roles: ClinicOwner,ClinicManager,SuperAdmin |
| GET | /api/health | HealthController | GetHealth | Unspecified |
| GET | /api/platform/feature-flags/{tenantId} | FeatureFlagsController | GetFeatureFlags | Roles: SuperAdmin |
| PUT | /api/platform/feature-flags/{tenantId} | FeatureFlagsController | UpdateFeatureFlags | Roles: SuperAdmin |
| GET | /api/platform/subscriptions | SubscriptionsController | GetAllSubscriptions | Roles: SuperAdmin |
| POST | /api/platform/subscriptions | SubscriptionsController | CreateSubscription | Roles: SuperAdmin |
| POST | /api/platform/subscriptions/{id}/cancel | SubscriptionsController | CancelSubscription | Roles: SuperAdmin |
| POST | /api/platform/subscriptions/{id}/extend | SubscriptionsController | ExtendSubscription | Roles: SuperAdmin |
| POST | /api/platform/subscriptions/{id}/mark-paid | SubscriptionsController | MarkPaid | Roles: SuperAdmin |
| GET | /api/platform/tenants | TenantsController | GetAllTenants | Roles: SuperAdmin |
| POST | /api/platform/tenants | TenantsController | CreateTenant | Roles: SuperAdmin |
| DELETE | /api/platform/tenants/{id} | TenantsController | DeleteTenant | Roles: SuperAdmin |
| GET | /api/platform/tenants/{id} | TenantsController | GetTenantById | Roles: SuperAdmin |
| PUT | /api/platform/tenants/{id} | TenantsController | UpdateTenant | Roles: SuperAdmin |
| POST | /api/platform/tenants/{id}/activate | TenantsController | ActivateTenant | Roles: SuperAdmin |
| POST | /api/platform/tenants/{id}/block | TenantsController | BlockTenant | Roles: SuperAdmin |
| POST | /api/platform/tenants/{id}/suspend | TenantsController | SuspendTenant | Roles: SuperAdmin |
| GET | /api/public/{slug}/clinic | PublicController | GetClinicProfile | Unspecified |
| GET | /api/public/{slug}/doctors | PublicController | GetDoctors | Unspecified |
| GET | /api/public/{slug}/doctors/available-now | PublicController | GetAvailableDoctorsNow | Unspecified |
| GET | /api/public/{slug}/landing | PublicController | GetLanding | Unspecified |
| GET | /api/public/{slug}/marketplace/items | PublicController | GetMarketplaceItems | Unspecified |
| GET | /api/public/{slug}/marketplace/items/{itemId:guid} | PublicController | GetMarketplaceItemById | Unspecified |
| POST | /api/public/{slug}/marketplace/orders | PublicController | CreateMarketplaceOrder | Unspecified |
| GET | /api/public/{slug}/payment-options | PublicController | GetPaymentOptions | Unspecified |
| GET | /api/public/{slug}/services | PublicController | GetServices | Unspecified |
| GET | /api/public/{slug}/working-hours | PublicController | GetWorkingHours | Unspecified |

---

## FULL DTO CATALOG (Application Layer)

- DTO files: 26
- DTO classes total: 174

### src/EliteClinic.Application/Features/Clinic/DTOs/BookingDtos.cs
Classes (4):
- BookingDto
- CreateBookingRequest
- CancelBookingRequest
- RescheduleBookingRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/ClinicServiceDtos.cs
Classes (5):
- ClinicServiceDto
- CreateClinicServiceRequest
- UpdateClinicServiceRequest
- DoctorClinicServiceLinkDto
- UpsertDoctorClinicServiceLinkRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/ClinicSettingsDtos.cs
Classes (9):
- ClinicSettingsDto
- UpdateClinicSettingsRequest
- PatchClinicSettingsRequest
- ClinicPaymentMethodDto
- UpsertClinicPaymentMethodRequest
- UpdateClinicPaymentMethodsRequest
- ClinicPaymentOptionsDto
- WorkingHourDto
- WorkingHourRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/DoctorDtos.cs
Classes (10):
- DoctorDto
- CreateDoctorRequest
- UpdateDoctorRequest
- PatchDoctorRequest
- DoctorCompensationHistoryItemDto
- DoctorServiceDto
- DoctorServiceRequest
- UpdateDoctorServicesRequest
- DoctorVisitFieldConfigDto
- UpdateVisitFieldsRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/DoctorNoteDtos.cs
Classes (2):
- DoctorNoteDto
- CreateDoctorNoteRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/ExpenseDtos.cs
Classes (3):
- ExpenseDto
- CreateExpenseRequest
- UpdateExpenseRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/FinanceDtos.cs
Classes (5):
- DailyRevenueDto
- DoctorRevenueDto
- MonthlyRevenueDto
- YearlyRevenueDto
- ProfitReportDto

### src/EliteClinic.Application/Features/Clinic/DTOs/InventoryDtos.cs
Classes (8):
- InventoryItemDto
- InventoryItemImageDto
- CreateInventoryItemRequest
- UpdateInventoryItemRequest
- InventoryItemsQuery
- SetInventoryItemActivationRequest
- RecordVisitInventoryUsageRequest
- VisitInventoryUsageDto

### src/EliteClinic.Application/Features/Clinic/DTOs/InvoiceDtos.cs
Classes (10):
- InvoiceDto
- CreateInvoiceRequest
- UpdateInvoiceRequest
- PatchInvoiceRequest
- PaymentDto
- CreatePaymentRequest
- AddInvoiceAdjustmentRequest
- RefundInvoiceRequest
- InvoiceLineItemDto
- AddInvoiceLineItemRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/LabRequestDtos.cs
Classes (4):
- LabRequestDto
- CreateLabRequestRequest
- UpdateLabRequestRequest
- AddLabResultRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/MarketplaceDtos.cs
Classes (12):
- PublicMarketplaceItemDto
- PublicMarketplaceItemsQuery
- CreatePublicMarketplaceOrderRequest
- CreatePublicMarketplaceOrderItemRequest
- MarketplaceOrderItemDto
- MarketplaceOrderDto
- MarketplaceOrdersQuery
- UpdateMarketplaceOrderStatusRequest
- SalesInvoiceDto
- SalesInvoiceLineItemDto
- PublicBranchDto
- PublicLandingDto

### src/EliteClinic.Application/Features/Clinic/DTOs/MediaDtos.cs
Classes (1):
- MediaFileDto

### src/EliteClinic.Application/Features/Clinic/DTOs/MessageLogDtos.cs
Classes (3):
- MessageLogDto
- SendMessageRequest
- RetryMessageRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/NotificationDtos.cs
Classes (5):
- NotificationSubscriptionDto
- CreateNotificationSubscriptionRequest
- SendNotificationRequest
- InAppNotificationDto
- InAppNotificationsQuery

### src/EliteClinic.Application/Features/Clinic/DTOs/PartnerDtos.cs
Classes (14):
- PartnerDto
- CreatePartnerRequest
- UpdatePartnerRequest
- SetPartnerActivationRequest
- PartnerContractDto
- CreatePartnerContractRequest
- UpdatePartnerContractRequest
- PartnerContractsQuery
- PartnerOrderDto
- PartnerOrderStatusHistoryDto
- CreateLabPartnerOrderRequest
- CreatePrescriptionPartnerOrderRequest
- UpdatePartnerOrderStatusRequest
- PartnerOrdersQuery

### src/EliteClinic.Application/Features/Clinic/DTOs/PatientCreditDtos.cs
Classes (4):
- PatientCreditBalanceDto
- PatientCreditTransactionDto
- IssuePatientCreditRequest
- ConsumePatientCreditRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/PatientDtos.cs
Classes (10):
- PatientDto
- PatientSubProfileDto
- CreatePatientRequest
- CreatePatientResponse
- SendPatientCredentialsRequest
- SendPatientCredentialsResponse
- UpdatePatientRequest
- AddSubProfileRequest
- PatchPatientRequest
- ResetPasswordResponse

### src/EliteClinic.Application/Features/Clinic/DTOs/PatientMedicalDtos.cs
Classes (10):
- PatientMedicalDocumentDto
- PatientMedicalDocumentAccessDto
- UploadPatientMedicalDocumentRequest
- PatientChronicProfileDto
- UpsertPatientChronicProfileRequest
- PatientMedicalDocumentThreadDto
- PatientMedicalDocumentThreadReplyDto
- CreatePatientMedicalDocumentThreadRequest
- AddPatientMedicalDocumentThreadReplyRequest
- ClosePatientMedicalDocumentThreadRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/PrescriptionDtos.cs
Classes (4):
- PrescriptionDto
- CreatePrescriptionRequest
- UpdatePrescriptionRequest
- PrescriptionRevisionDto

### src/EliteClinic.Application/Features/Clinic/DTOs/PublicDtos.cs
Classes (4):
- PublicClinicDto
- PublicDoctorDto
- PublicDoctorServiceDto
- PublicWorkingHourDto

### src/EliteClinic.Application/Features/Clinic/DTOs/QueueDtos.cs
Classes (8):
- QueueSessionDto
- CreateQueueSessionRequest
- QueueTicketDto
- CreateQueueTicketRequest
- CreateQueueTicketWithPaymentRequest
- StartVisitResultDto
- QueueBoardDto
- QueueBoardSessionDto

### src/EliteClinic.Application/Features/Clinic/DTOs/ReportDtos.cs
Classes (4):
- ClinicOverviewReportDto
- DoctorOverviewReportRowDto
- ServicesSalesReportDto
- ServiceSalesReportRowDto

### src/EliteClinic.Application/Features/Clinic/DTOs/SelfServiceRequestDtos.cs
Classes (10):
- PatientSelfServiceRequestListItemDto
- PatientSelfServiceRequestDocumentDto
- PatientSelfServicePaymentProofDto
- PatientSelfServiceRequestDto
- CreatePatientSelfServiceRequest
- SelfServiceRequestsQuery
- ApprovePatientSelfServiceRequest
- RejectPatientSelfServiceRequest
- RequestSelfServicePaymentReupload
- AdjustSelfServicePaidAmountRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/StaffDtos.cs
Classes (5):
- StaffDto
- CreateStaffRequest
- UpdateStaffRequest
- PatchStaffRequest
- CreatePayrollOnlyWorkerRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/VisitDtos.cs
Classes (10):
- VisitDto
- CreateVisitRequest
- UpdateVisitRequest
- CompleteVisitRequest
- PatientSummaryDto
- VisitSummaryDto
- ProfileVisitQueryRequest
- StaleOpenVisitDto
- CloseStaleVisitRequest
- MyVisitsFilterRequest

### src/EliteClinic.Application/Features/Clinic/DTOs/WorkforceDtos.cs
Classes (10):
- DoctorCompensationRuleDto
- CreateDoctorCompensationRuleRequest
- AttendanceRecordDto
- CreateAttendanceRecordRequest
- CheckOutAttendanceRequest
- CreateSalaryPayoutRequest
- SalaryPayoutExpenseDto
- DailyClosingSnapshotDto
- AbsenceRecordDto
- CreateAbsenceRecordRequest

---

## FULL ENUM CATALOG (Domain Layer)

- Enum files: 33
- Enum members total: 129

### src/EliteClinic.Domain/Enums/BookingStatus.cs :: BookingStatus
Members (4):
- Confirmed
- Cancelled
- Rescheduled
- Completed

### src/EliteClinic.Domain/Enums/ChronicConditionType.cs :: ChronicConditionType
Members (5):
- Diabetes
- Hypertension
- CardiacDisease
- Asthma
- Other

### src/EliteClinic.Domain/Enums/CreditReason.cs :: CreditReason
Members (8):
- DoctorAbsent
- SessionForceClosedUnserved
- SessionAutoClosedUnserved
- ClinicCancellationAfterPayment
- NoShowRetainedByPolicy
- ManualAdjustment
- CreditConsumption
- CreditExpiration

### src/EliteClinic.Domain/Enums/CreditTransactionType.cs :: CreditTransactionType
Members (5):
- Issued
- Consumed
- Adjusted
- Reversed
- Expired

### src/EliteClinic.Domain/Enums/DoctorCompensationMode.cs :: DoctorCompensationMode
Members (3):
- Salary
- Percentage
- FixedPerVisit

### src/EliteClinic.Domain/Enums/DocumentCategory.cs :: DocumentCategory
Members (3):
- Lab
- Radiology
- OtherMedicalDocument

### src/EliteClinic.Domain/Enums/EncounterFinancialState.cs :: EncounterFinancialState
Members (3):
- NotStarted
- PendingSettlement
- FinanciallySettled

### src/EliteClinic.Domain/Enums/EncounterLifecycleState.cs :: EncounterLifecycleState
Members (4):
- Draft
- InProgress
- MedicallyCompleted
- FullyClosed

### src/EliteClinic.Domain/Enums/FinanceActionType.cs :: FinanceActionType
Members (5):
- Refund
- Credit
- Void
- Reverse
- Adjustment

### src/EliteClinic.Domain/Enums/Gender.cs :: Gender
Members (2):
- Male
- Female

### src/EliteClinic.Domain/Enums/InAppNotificationType.cs :: InAppNotificationType
Members (4):
- PartnerOrderStatusChanged
- MedicalDocumentThreadUpdated
- PrescriptionRevised
- System

### src/EliteClinic.Domain/Enums/InventoryItemType.cs :: InventoryItemType
Members (4):
- Medicine
- Tool
- Equipment
- Consumable

### src/EliteClinic.Domain/Enums/InvoiceStatus.cs :: InvoiceStatus
Members (4):
- Unpaid
- PartiallyPaid
- Paid
- Refunded

### src/EliteClinic.Domain/Enums/LabRequestType.cs :: LabRequestType
Members (2):
- Lab
- Imaging

### src/EliteClinic.Domain/Enums/MarketplaceOrderStatus.cs :: MarketplaceOrderStatus
Members (4):
- Pending
- WhatsAppRedirected
- Confirmed
- Cancelled

### src/EliteClinic.Domain/Enums/MedicalDocumentThreadStatus.cs :: MedicalDocumentThreadStatus
Members (2):
- Open
- Closed

### src/EliteClinic.Domain/Enums/MessageChannel.cs :: MessageChannel
Members (2):
- WhatsApp
- PWA

### src/EliteClinic.Domain/Enums/MessageScenario.cs :: MessageScenario
Members (7):
- PatientAccountCreated
- QueueTicketIssued
- QueueTurnReady
- MedicationReminder
- CreditIssued
- BookingConfirmed
- BookingCancelled

### src/EliteClinic.Domain/Enums/MessageStatus.cs :: MessageStatus
Members (7):
- Pending
- Sending
- Sent
- Delivered
- Read
- Failed
- Retrying

### src/EliteClinic.Domain/Enums/PartnerOrderStatus.cs :: PartnerOrderStatus
Members (6):
- Draft
- Sent
- Accepted
- InProgress
- Completed
- Cancelled

### src/EliteClinic.Domain/Enums/PartnerType.cs :: PartnerType
Members (3):
- Laboratory
- Radiology
- Pharmacy

### src/EliteClinic.Domain/Enums/PatientSelfServicePaymentPolicy.cs :: PatientSelfServicePaymentPolicy
Members (2):
- FullOnly
- PartialAllowed

### src/EliteClinic.Domain/Enums/PatientSelfServiceRequestStatus.cs :: PatientSelfServiceRequestStatus
Members (7):
- PendingPaymentReview
- PaymentApproved
- ConvertedToQueueTicket
- ConvertedToBooking
- Rejected
- ReuploadRequested
- Expired

### src/EliteClinic.Domain/Enums/PatientSelfServiceRequestType.cs :: PatientSelfServiceRequestType
Members (2):
- SameDayTicket
- FutureBooking

### src/EliteClinic.Domain/Enums/SalesInvoiceStatus.cs :: SalesInvoiceStatus
Members (2):
- Issued
- Cancelled

### src/EliteClinic.Domain/Enums/SubscriptionStatus.cs :: SubscriptionStatus
Members (3):
- Active
- Expired
- Cancelled

### src/EliteClinic.Domain/Enums/TenantStatus.cs :: TenantStatus
Members (4):
- Active
- Suspended
- Blocked
- Inactive

### src/EliteClinic.Domain/Enums/TicketStatus.cs :: TicketStatus
Members (7):
- Waiting
- Called
- InVisit
- Completed
- Skipped
- NoShow
- Cancelled

### src/EliteClinic.Domain/Enums/UrgentCaseMode.cs :: UrgentCaseMode
Members (4):
- Disabled
- UrgentNext
- UrgentBucket
- UrgentFront

### src/EliteClinic.Domain/Enums/VisitSource.cs :: VisitSource
Members (5):
- WalkInTicket
- Booking
- ConsultationBooking
- PatientSelfServiceTicket
- PatientSelfServiceBooking

### src/EliteClinic.Domain/Enums/VisitStatus.cs :: VisitStatus
Members (2):
- Open
- Completed

### src/EliteClinic.Domain/Enums/VisitType.cs :: VisitType
Members (2):
- Exam
- Consultation

### src/EliteClinic.Domain/Enums/WorkerMode.cs :: WorkerMode
Members (2):
- LoginBased
- PayrollOnly

---

## FULL SERVICE CATALOG (Application Services)

- Service interfaces: 31
- Service classes: 31

### Service Interfaces

#### IBookingService (src/EliteClinic.Application/Features/Clinic/Services/IBookingService.cs)
- Task<ApiResponse<BookingDto>> CreateAsync(Guid tenantId, Guid patientUserId, CreateBookingRequest request)
- Task<ApiResponse<BookingDto>> CancelAsync(Guid tenantId, Guid bookingId, Guid callerUserId, CancelBookingRequest request, bool isAdministrativeAction = false)
- Task<ApiResponse<BookingDto>> RescheduleAsync(Guid tenantId, Guid bookingId, Guid callerUserId, RescheduleBookingRequest request, bool isAdministrativeAction = false)
- Task<ApiResponse<BookingDto>> GetByIdAsync(Guid tenantId, Guid bookingId)
- Task<ApiResponse<PagedResult<BookingDto>>> GetAllAsync(Guid tenantId, Guid? patientId, Guid? doctorId, string? status, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<List<BookingDto>>> GetMyBookingsAsync(Guid tenantId, Guid patientUserId)
- Task<ApiResponse<List<BookingDto>>> GetBookingsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)

#### IBranchAccessService (src/EliteClinic.Application/Features/Clinic/Services/IBranchAccessService.cs)
- Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default)
- Task<ApiResponse> EnsureCanAccessBranchAsync(Guid tenantId, Guid callerUserId, Guid branchId, CancellationToken cancellationToken = default)

#### IClinicServiceManager (src/EliteClinic.Application/Features/Clinic/Services/IClinicServiceManager.cs)
- Task<ApiResponse<ClinicServiceDto>> CreateAsync(Guid tenantId, CreateClinicServiceRequest request)
- Task<ApiResponse<ClinicServiceDto>> GetByIdAsync(Guid tenantId, Guid id)
- Task<ApiResponse<PagedResult<ClinicServiceDto>>> GetAllAsync(Guid tenantId, int pageNumber = 1, int pageSize = 20, bool? activeOnly = null)
- Task<ApiResponse<ClinicServiceDto>> UpdateAsync(Guid tenantId, Guid id, UpdateClinicServiceRequest request)
- Task<ApiResponse<bool>> DeleteAsync(Guid tenantId, Guid id)
- Task<ApiResponse<List<DoctorClinicServiceLinkDto>>> GetDoctorLinksAsync(Guid tenantId, Guid doctorId)
- Task<ApiResponse<DoctorClinicServiceLinkDto>> UpsertDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId, UpsertDoctorClinicServiceLinkRequest request)
- Task<ApiResponse<bool>> RemoveDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId)

#### IClinicSettingsService (src/EliteClinic.Application/Features/Clinic/Services/IClinicSettingsService.cs)
- Task<ApiResponse<ClinicSettingsDto>> GetSettingsAsync(Guid tenantId)
- Task<ApiResponse<ClinicSettingsDto>> UpdateSettingsAsync(Guid tenantId, UpdateClinicSettingsRequest request)
- Task<ApiResponse<ClinicSettingsDto>> PatchSettingsAsync(Guid tenantId, PatchClinicSettingsRequest request)
- Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(Guid tenantId, bool activeOnly = false)
- Task<ApiResponse<List<ClinicPaymentMethodDto>>> ReplacePaymentMethodsAsync(Guid tenantId, UpdateClinicPaymentMethodsRequest request)

#### IDoctorNoteService (src/EliteClinic.Application/Features/Clinic/Services/IDoctorNoteService.cs)
- Task<ApiResponse<DoctorNoteDto>> CreateAsync(Guid tenantId, Guid doctorUserId, CreateDoctorNoteRequest request)
- Task<ApiResponse<List<DoctorNoteDto>>> GetUnreadAsync(Guid tenantId)
- Task<ApiResponse<PagedResult<DoctorNoteDto>>> GetAllAsync(Guid tenantId, bool? unreadOnly, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<DoctorNoteDto>> MarkAsReadAsync(Guid tenantId, Guid noteId, Guid readerUserId)

#### IDoctorService (src/EliteClinic.Application/Features/Clinic/Services/IDoctorService.cs)
- Task<ApiResponse<DoctorDto>> CreateDoctorAsync(Guid tenantId, CreateDoctorRequest request)
- Task<ApiResponse<PagedResult<DoctorDto>>> GetAllDoctorsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<DoctorDto>> GetDoctorByIdAsync(Guid tenantId, Guid id)
- Task<ApiResponse<DoctorDto>> UpdateDoctorAsync(Guid tenantId, Guid id, UpdateDoctorRequest request)
- Task<ApiResponse<DoctorDto>> PatchDoctorAsync(Guid tenantId, Guid id, PatchDoctorRequest request)
- Task<ApiResponse<DoctorDto>> EnableDoctorAsync(Guid tenantId, Guid id)
- Task<ApiResponse<DoctorDto>> DisableDoctorAsync(Guid tenantId, Guid id)
- Task<ApiResponse<List<DoctorServiceDto>>> UpdateServicesAsync(Guid tenantId, Guid doctorId, UpdateDoctorServicesRequest request)
- Task<ApiResponse<DoctorVisitFieldConfigDto>> UpdateVisitFieldsAsync(Guid tenantId, Guid doctorId, UpdateVisitFieldsRequest request)
- Task<ApiResponse<DoctorDto>> GetMyProfileAsync(Guid tenantId, Guid doctorUserId)
- Task<ApiResponse<DoctorVisitFieldConfigDto>> GetMyVisitFieldsAsync(Guid tenantId, Guid doctorUserId)
- Task<ApiResponse<DoctorVisitFieldConfigDto>> UpdateMyVisitFieldsAsync(Guid tenantId, Guid doctorUserId, UpdateVisitFieldsRequest request)

#### IExpenseService (src/EliteClinic.Application/Features/Clinic/Services/IExpenseService.cs)
- Task<ApiResponse<ExpenseDto>> CreateAsync(Guid tenantId, CreateExpenseRequest request, Guid callerUserId)
- Task<ApiResponse<ExpenseDto>> UpdateAsync(Guid tenantId, Guid expenseId, UpdateExpenseRequest request)
- Task<ApiResponse> DeleteAsync(Guid tenantId, Guid expenseId)
- Task<ApiResponse<PagedResult<ExpenseDto>>> GetAllAsync(Guid tenantId, DateTime? from, DateTime? to, string? category, int pageNumber = 1, int pageSize = 10)

#### IFileStorageService (src/EliteClinic.Application/Features/Clinic/Services/IFileStorageService.cs)
- Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
- Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveFileAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
- Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)

#### IFinanceService (src/EliteClinic.Application/Features/Clinic/Services/IFinanceService.cs)
- Task<ApiResponse<DailyRevenueDto>> GetDailyRevenueAsync(Guid tenantId, DateTime date)
- Task<ApiResponse<List<DoctorRevenueDto>>> GetRevenueByDoctorAsync(Guid tenantId, DateTime date, Guid? doctorId, decimal commissionPercent = 0)
- Task<ApiResponse<MonthlyRevenueDto>> GetMonthlyRevenueAsync(Guid tenantId, int year, int month)
- Task<ApiResponse<YearlyRevenueDto>> GetYearlyRevenueAsync(Guid tenantId, int year)
- Task<ApiResponse<ProfitReportDto>> GetProfitReportAsync(Guid tenantId, DateTime from, DateTime to)

#### IInventoryService (src/EliteClinic.Application/Features/Clinic/Services/IInventoryService.cs)
- Task<ApiResponse<InventoryItemDto>> CreateItemAsync(Guid tenantId, CreateInventoryItemRequest request)
- Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid tenantId, Guid itemId, UpdateInventoryItemRequest request)
- Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid itemId)
- Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, InventoryItemsQuery query)
- Task<ApiResponse<InventoryItemDto>> SetActivationAsync(Guid tenantId, Guid itemId, SetInventoryItemActivationRequest request)
- Task<ApiResponse<VisitInventoryUsageDto>> RecordVisitUsageAsync(Guid tenantId, Guid visitId, Guid callerUserId, RecordVisitInventoryUsageRequest request)

#### IInvoiceNumberService (src/EliteClinic.Application/Features/Clinic/Services/IInvoiceNumberService.cs)
- Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)

#### IInvoiceService (src/EliteClinic.Application/Features/Clinic/Services/IInvoiceService.cs)
- Task<ApiResponse<InvoiceDto>> EnsureInvoiceForVisitAsync(Guid tenantId, Guid visitId, Guid performedByUserId, string? initialNotes = null)
- Task<ApiResponse<InvoiceDto>> CreateInvoiceAsync(Guid tenantId, CreateInvoiceRequest request)
- Task<ApiResponse<InvoiceDto>> UpdateInvoiceAsync(Guid tenantId, Guid invoiceId, UpdateInvoiceRequest request)
- Task<ApiResponse<InvoiceDto>> PatchInvoiceAsync(Guid tenantId, Guid invoiceId, PatchInvoiceRequest request)
- Task<ApiResponse<InvoiceDto>> GetInvoiceByIdAsync(Guid tenantId, Guid invoiceId)
- Task<ApiResponse<PagedResult<InvoiceDto>>> GetInvoicesAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, string? invoiceNumber = null, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<PaymentDto>> RecordPaymentAsync(Guid tenantId, CreatePaymentRequest request)
- Task<ApiResponse<InvoiceDto>> AddAdjustmentAsync(Guid tenantId, Guid invoiceId, AddInvoiceAdjustmentRequest request, Guid performedByUserId)
- Task<ApiResponse<InvoiceDto>> AddLineItemAsync(Guid tenantId, Guid invoiceId, AddInvoiceLineItemRequest request, Guid performedByUserId)
- Task<ApiResponse<PaymentDto>> RefundPaymentAsync(Guid tenantId, Guid invoiceId, RefundInvoiceRequest request, Guid performedByUserId)
- Task<ApiResponse<List<PaymentDto>>> GetPaymentsByInvoiceAsync(Guid tenantId, Guid invoiceId)

#### ILabRequestService (src/EliteClinic.Application/Features/Clinic/Services/ILabRequestService.cs)
- Task<ApiResponse<LabRequestDto>> CreateAsync(Guid tenantId, Guid visitId, CreateLabRequestRequest request, Guid callerUserId)
- Task<ApiResponse<LabRequestDto>> UpdateAsync(Guid tenantId, Guid visitId, Guid labId, UpdateLabRequestRequest request, Guid callerUserId)
- Task<ApiResponse<LabRequestDto>> AddResultAsync(Guid tenantId, Guid visitId, Guid labId, AddLabResultRequest request)
- Task<ApiResponse<LabRequestDto>> DeleteAsync(Guid tenantId, Guid visitId, Guid labId, Guid callerUserId)
- Task<ApiResponse<List<LabRequestDto>>> GetByVisitAsync(Guid tenantId, Guid visitId, LabRequestType? type = null)

#### IMarketplaceService (src/EliteClinic.Application/Features/Clinic/Services/IMarketplaceService.cs)
- Task<ApiResponse<PagedResult<PublicMarketplaceItemDto>>> GetPublicItemsAsync(string tenantSlug, PublicMarketplaceItemsQuery query)
- Task<ApiResponse<PublicMarketplaceItemDto>> GetPublicItemByIdAsync(string tenantSlug, Guid itemId)
- Task<ApiResponse<MarketplaceOrderDto>> CreatePublicOrderAsync(string tenantSlug, CreatePublicMarketplaceOrderRequest request)
- Task<ApiResponse<PagedResult<MarketplaceOrderDto>>> GetClinicOrdersAsync(Guid tenantId, MarketplaceOrdersQuery query)
- Task<ApiResponse<MarketplaceOrderDto>> GetClinicOrderByIdAsync(Guid tenantId, Guid orderId)
- Task<ApiResponse<MarketplaceOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid orderId, Guid changedByUserId, UpdateMarketplaceOrderStatusRequest request)

#### IMediaService (src/EliteClinic.Application/Features/Clinic/Services/IMediaService.cs)
- Task<ApiResponse<MediaFileDto>> UploadClinicLogoAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
- Task<ApiResponse<MediaFileDto>> UploadClinicImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
- Task<ApiResponse<MediaFileDto>> UploadDoctorPhotoAsync(Guid tenantId, Guid doctorId, IFormFile file, CancellationToken cancellationToken = default)

#### IMessageDeliveryProvider (src/EliteClinic.Application/Features/Clinic/Services/IMessageDeliveryProvider.cs)
- Task<MessageDeliveryResult> DeliverAsync(MessageLog message, CancellationToken cancellationToken = default)

#### IMessageService (src/EliteClinic.Application/Features/Clinic/Services/IMessageService.cs)
- Task<ApiResponse<MessageLogDto>> SendMessageAsync(Guid tenantId, SendMessageRequest request)
- Task<ApiResponse<MessageLogDto>> RetryMessageAsync(Guid tenantId, Guid messageId)
- Task<ApiResponse<PagedResult<MessageLogDto>>> GetAllAsync(Guid tenantId, string? templateName, string? channel, string? status, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<MessageLogDto>> GetByIdAsync(Guid tenantId, Guid messageId)
- Task LogScenarioAsync(Guid tenantId, MessageScenario scenario, Guid? recipientUserId = null, string? recipientPhone = null,
- Task LogWorkflowEventAsync(Guid tenantId, string templateName, Guid? recipientUserId = null, string? recipientPhone = null, Dictionary<string, string>? variables = null)

#### IMessageTemplateRenderer (src/EliteClinic.Application/Features/Clinic/Services/IMessageTemplateRenderer.cs)
- Task<MessageRenderResult> RenderAsync(Guid tenantId, MessageScenario scenario, MessageChannel channel, string language, Dictionary<string, string>? variables = null, CancellationToken cancellationToken = default)

#### INotificationService (src/EliteClinic.Application/Features/Clinic/Services/INotificationService.cs)
- Task<ApiResponse<NotificationSubscriptionDto>> SubscribeAsync(Guid tenantId, Guid userId, CreateNotificationSubscriptionRequest request)
- Task<ApiResponse> UnsubscribeAsync(Guid tenantId, Guid subscriptionId, Guid userId)
- Task<ApiResponse<List<NotificationSubscriptionDto>>> GetMySubscriptionsAsync(Guid tenantId, Guid userId)
- Task<ApiResponse<MessageLogDto>> SendNotificationAsync(Guid tenantId, SendNotificationRequest request)
- Task<ApiResponse<PagedResult<InAppNotificationDto>>> GetInAppNotificationsAsync(Guid tenantId, Guid userId, InAppNotificationsQuery query)
- Task<ApiResponse<InAppNotificationDto>> MarkInAppReadAsync(Guid tenantId, Guid userId, Guid notificationId)
- Task<ApiResponse<int>> MarkAllInAppReadAsync(Guid tenantId, Guid userId)

#### IPartnerService (src/EliteClinic.Application/Features/Clinic/Services/IPartnerService.cs)
- Task<ApiResponse<PagedResult<PartnerDto>>> ListPartnersAsync(Guid tenantId, PartnerType? type, bool activeOnly, int pageNumber = 1, int pageSize = 20)
- Task<ApiResponse<PartnerDto>> CreatePartnerAsync(Guid tenantId, CreatePartnerRequest request)
- Task<ApiResponse<PartnerDto>> UpdatePartnerAsync(Guid tenantId, Guid partnerId, UpdatePartnerRequest request)
- Task<ApiResponse<PartnerDto>> SetPartnerActivationAsync(Guid tenantId, Guid partnerId, bool isActive)
- Task<ApiResponse<List<PartnerContractDto>>> ListContractsAsync(Guid tenantId, PartnerContractsQuery query)
- Task<ApiResponse<PartnerContractDto>> CreateContractAsync(Guid tenantId, CreatePartnerContractRequest request)
- Task<ApiResponse<PartnerContractDto>> UpdateContractAsync(Guid tenantId, Guid contractId, UpdatePartnerContractRequest request)
- Task<ApiResponse<PartnerOrderDto>> CreateLabOrderAsync(Guid tenantId, Guid visitId, Guid labRequestId, Guid callerUserId, CreateLabPartnerOrderRequest request)
- Task<ApiResponse<PartnerOrderDto>> CreatePrescriptionOrderAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId, CreatePrescriptionPartnerOrderRequest request)
- Task<ApiResponse<PagedResult<PartnerOrderDto>>> ListOrdersAsync(Guid tenantId, Guid callerUserId, PartnerOrdersQuery query)
- Task<ApiResponse<PartnerOrderDto>> GetOrderByIdAsync(Guid tenantId, Guid callerUserId, Guid orderId)
- Task<ApiResponse<PartnerOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid callerUserId, Guid orderId, UpdatePartnerOrderStatusRequest request)

#### IPatientCreditService (src/EliteClinic.Application/Features/Clinic/Services/IPatientCreditService.cs)
- Task<ApiResponse<PatientCreditTransactionDto>> IssueCreditAsync(Guid tenantId, IssuePatientCreditRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<PatientCreditTransactionDto>> ConsumeCreditAsync(Guid tenantId, ConsumePatientCreditRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<PatientCreditBalanceDto>> GetBalanceAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken = default)
- Task<ApiResponse<PagedResult<PatientCreditTransactionDto>>> GetHistoryAsync(Guid tenantId, Guid patientId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)

#### IPatientMedicalService (src/EliteClinic.Application/Features/Clinic/Services/IPatientMedicalService.cs)
- Task<ApiResponse<PatientMedicalDocumentDto>> UploadDocumentAsync(
- Task<ApiResponse<List<PatientMedicalDocumentDto>>> ListDocumentsAsync(
- Task<ApiResponse<PatientMedicalDocumentAccessDto>> GetDocumentAccessAsync(
- Task<ApiResponse<PatientChronicProfileDto>> GetChronicProfileAsync(
- Task<ApiResponse<PatientChronicProfileDto>> UpsertChronicProfileAsync(
- Task<ApiResponse<List<PatientMedicalDocumentThreadDto>>> ListDocumentThreadsAsync(
- Task<ApiResponse<PatientMedicalDocumentThreadDto>> CreateDocumentThreadAsync(
- Task<ApiResponse<PatientMedicalDocumentThreadDto>> AddThreadReplyAsync(
- Task<ApiResponse<PatientMedicalDocumentThreadDto>> CloseThreadAsync(

#### IPatientSelfServiceRequestService (src/EliteClinic.Application/Features/Clinic/Services/IPatientSelfServiceRequestService.cs)
- Task<ApiResponse<PatientSelfServiceRequestDto>> CreateAsync(
- Task<ApiResponse<List<PatientSelfServiceRequestListItemDto>>> ListOwnedAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> GetOwnedByIdAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> ReuploadPaymentProofAsync(
- Task<ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>> GetClinicRequestsAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> GetClinicRequestByIdAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> ApproveAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> RejectAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> RequestReuploadAsync(
- Task<ApiResponse<PatientSelfServiceRequestDto>> AdjustPaidAmountAsync(

#### IPatientService (src/EliteClinic.Application/Features/Clinic/Services/IPatientService.cs)
- Task<ApiResponse<CreatePatientResponse>> CreatePatientAsync(Guid tenantId, CreatePatientRequest request)
- Task<ApiResponse<PagedResult<PatientDto>>> GetAllPatientsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10, string? search = null)
- Task<ApiResponse<PatientDto>> GetPatientByIdAsync(Guid tenantId, Guid id)
- Task<ApiResponse<PatientDto>> UpdatePatientAsync(Guid tenantId, Guid id, UpdatePatientRequest request)
- Task<ApiResponse<PatientDto>> PatchPatientAsync(Guid tenantId, Guid id, PatchPatientRequest request)
- Task<ApiResponse<PatientDto>> AddSubProfileAsync(Guid tenantId, Guid parentId, AddSubProfileRequest request)
- Task<ApiResponse<ResetPasswordResponse>> ResetPasswordAsync(Guid tenantId, Guid id)
- Task<ApiResponse<SendPatientCredentialsResponse>> SendCredentialsAsync(Guid tenantId, Guid id, SendPatientCredentialsRequest request)
- Task<ApiResponse<PatientDto>> GetOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
- Task<ApiResponse<object>> DeletePatientAsync(Guid tenantId, Guid id)

#### IPrescriptionService (src/EliteClinic.Application/Features/Clinic/Services/IPrescriptionService.cs)
- Task<ApiResponse<PrescriptionDto>> CreateAsync(Guid tenantId, Guid visitId, CreatePrescriptionRequest request, Guid callerUserId)
- Task<ApiResponse<PrescriptionDto>> UpdateAsync(Guid tenantId, Guid visitId, Guid prescriptionId, UpdatePrescriptionRequest request, Guid callerUserId)
- Task<ApiResponse> DeleteAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)
- Task<ApiResponse<List<PrescriptionDto>>> GetByVisitAsync(Guid tenantId, Guid visitId)
- Task<ApiResponse<List<PrescriptionRevisionDto>>> GetRevisionsAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)

#### IPublicService (src/EliteClinic.Application/Features/Clinic/Services/IPublicService.cs)
- Task<ApiResponse<PublicLandingDto>> GetLandingAsync(string tenantSlug)
- Task<ApiResponse<PublicClinicDto>> GetClinicProfileAsync(string tenantSlug)
- Task<ApiResponse<List<PublicDoctorDto>>> GetDoctorsAsync(string tenantSlug)
- Task<ApiResponse<List<PublicDoctorDto>>> GetAvailableDoctorsNowAsync(string tenantSlug)
- Task<ApiResponse<List<PublicDoctorServiceDto>>> GetServicesAsync(string tenantSlug)
- Task<ApiResponse<List<PublicWorkingHourDto>>> GetWorkingHoursAsync(string tenantSlug)
- Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(string tenantSlug)

#### IQueueService (src/EliteClinic.Application/Features/Clinic/Services/IQueueService.cs)
- Task<ApiResponse<QueueSessionDto>> OpenSessionAsync(Guid tenantId, CreateQueueSessionRequest request, Guid callerUserId)
- Task<ApiResponse<QueueSessionDto>> CloseSessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId, bool forceClose = false)
- Task<ApiResponse<int>> CloseAllSessionsForDateAsync(Guid tenantId, DateTime date)
- Task<ApiResponse<PagedResult<QueueSessionDto>>> GetSessionsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<QueueSessionDto>> GetSessionByIdAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
- Task<ApiResponse<QueueTicketDto>> IssueTicketAsync(Guid tenantId, CreateQueueTicketRequest request)
- Task<ApiResponse<QueueTicketDto>> IssueTicketWithPaymentAsync(Guid tenantId, CreateQueueTicketWithPaymentRequest request)
- Task<ApiResponse<QueueTicketDto>> CallTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<StartVisitResultDto>> StartVisitFromTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<QueueTicketDto>> FinishTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<QueueTicketDto>> SkipTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<QueueTicketDto>> CancelTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<QueueTicketDto>> MarkUrgentAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- Task<ApiResponse<List<QueueTicketDto>>> GetTicketsBySessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
- Task<ApiResponse<QueueBoardDto>> GetBoardAsync(Guid tenantId)
- Task<ApiResponse<QueueBoardSessionDto>> GetMyQueueAsync(Guid tenantId, Guid doctorUserId)
- Task<ApiResponse<QueueTicketDto>> GetMyTicketAsync(Guid tenantId, Guid patientUserId)
- Task<ApiResponse<QueueTicketDto>> GetTicketForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)

#### IReportsService (src/EliteClinic.Application/Features/Clinic/Services/IReportsService.cs)
- Task<ApiResponse<ClinicOverviewReportDto>> GetClinicOverviewAsync(Guid tenantId, DateTime fromDate, DateTime toDate, Guid? doctorId = null, VisitType? visitType = null, VisitSource? source = null)
- Task<ApiResponse<ServicesSalesReportDto>> GetServicesSalesAsync(Guid tenantId, DateTime fromDate, DateTime toDate, Guid? doctorId = null, VisitType? visitType = null, VisitSource? source = null)
- Task<ApiResponse<ClinicOverviewReportDto>> GetDoctorOwnOverviewAsync(Guid tenantId, Guid doctorUserId, DateTime fromDate, DateTime toDate, VisitType? visitType = null, VisitSource? source = null)

#### IStaffService (src/EliteClinic.Application/Features/Clinic/Services/IStaffService.cs)
- Task<ApiResponse<StaffDto>> CreateStaffAsync(Guid tenantId, CreateStaffRequest request)
- Task<ApiResponse<StaffDto>> CreatePayrollOnlyWorkerAsync(Guid tenantId, CreatePayrollOnlyWorkerRequest request)
- Task<ApiResponse<PagedResult<StaffDto>>> GetAllStaffAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<StaffDto>> GetStaffByIdAsync(Guid tenantId, Guid id)
- Task<ApiResponse<StaffDto>> UpdateStaffAsync(Guid tenantId, Guid id, UpdateStaffRequest request)
- Task<ApiResponse<StaffDto>> PatchStaffAsync(Guid tenantId, Guid id, PatchStaffRequest request)
- Task<ApiResponse<StaffDto>> EnableStaffAsync(Guid tenantId, Guid id)
- Task<ApiResponse<StaffDto>> DisableStaffAsync(Guid tenantId, Guid id)

#### IVisitService (src/EliteClinic.Application/Features/Clinic/Services/IVisitService.cs)
- Task<ApiResponse<VisitDto>> CreateVisitAsync(Guid tenantId, CreateVisitRequest request, Guid callerUserId)
- Task<ApiResponse<VisitDto>> UpdateVisitAsync(Guid tenantId, Guid visitId, UpdateVisitRequest request, Guid callerUserId)
- Task<ApiResponse<VisitDto>> CompleteVisitAsync(Guid tenantId, Guid visitId, CompleteVisitRequest request, Guid callerUserId)
- Task<ApiResponse<VisitDto>> GetVisitByIdAsync(Guid tenantId, Guid visitId, Guid callerUserId)
- Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsAsync(Guid tenantId, Guid patientId, Guid callerUserId, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryAsync(Guid tenantId, Guid patientId, Guid callerUserId)
- Task<ApiResponse<PagedResult<VisitDto>>> GetMyVisitsAsync(Guid tenantId, Guid doctorUserId, MyVisitsFilterRequest request)
- Task<ApiResponse<PagedResult<PatientDto>>> GetMyPatientsAsync(Guid tenantId, Guid doctorUserId, int pageNumber = 1, int pageSize = 10, string? search = null)
- Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId, int pageNumber = 1, int pageSize = 10)
- Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
- Task<ApiResponse<List<StaleOpenVisitDto>>> GetStaleOpenVisitsAsync(Guid tenantId, int olderThanHours = 12)
- Task<ApiResponse<VisitDto>> CloseStaleVisitAsync(Guid tenantId, Guid visitId, CloseStaleVisitRequest request)

#### IWorkforceService (src/EliteClinic.Application/Features/Clinic/Services/IWorkforceService.cs)
- Task<ApiResponse<DoctorCompensationRuleDto>> CreateDoctorCompensationRuleAsync(Guid tenantId, Guid doctorId, Guid changedByUserId, CreateDoctorCompensationRuleRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<List<DoctorCompensationRuleDto>>> ListDoctorCompensationRulesAsync(Guid tenantId, Guid doctorId, CancellationToken cancellationToken = default)
- Task<ApiResponse<AttendanceRecordDto>> CreateAttendanceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAttendanceRecordRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<AttendanceRecordDto>> CheckOutAttendanceAsync(Guid tenantId, Guid attendanceId, CheckOutAttendanceRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<List<AttendanceRecordDto>>> ListAttendanceAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
- Task<ApiResponse<AbsenceRecordDto>> CreateAbsenceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAbsenceRecordRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<List<AbsenceRecordDto>>> ListAbsenceRecordsAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
- Task<ApiResponse<SalaryPayoutExpenseDto>> CreateSalaryPayoutAsync(Guid tenantId, Guid recordedByUserId, CreateSalaryPayoutRequest request, CancellationToken cancellationToken = default)
- Task<ApiResponse<DailyClosingSnapshotDto>> GenerateDailyClosingSnapshotAsync(Guid tenantId, Guid generatedByUserId, DateTime snapshotDate, CancellationToken cancellationToken = default)
- Task<ApiResponse<List<DailyClosingSnapshotDto>>> GetDailyClosingSnapshotsAsync(Guid tenantId, DateTime? from, DateTime? to, CancellationToken cancellationToken = default)

### Service Classes

#### BookingService (src/EliteClinic.Application/Features/Clinic/Services/BookingService.cs)
- public async Task<ApiResponse<BookingDto>> CreateAsync(Guid tenantId, Guid patientUserId, CreateBookingRequest request)
- public async Task<ApiResponse<BookingDto>> CancelAsync(Guid tenantId, Guid bookingId, Guid callerUserId, CancelBookingRequest request, bool isAdministrativeAction = false)
- public async Task<ApiResponse<BookingDto>> RescheduleAsync(Guid tenantId, Guid bookingId, Guid callerUserId, RescheduleBookingRequest request, bool isAdministrativeAction = false)
- public async Task<ApiResponse<BookingDto>> GetByIdAsync(Guid tenantId, Guid bookingId)
- public async Task<ApiResponse<PagedResult<BookingDto>>> GetAllAsync(Guid tenantId, Guid? patientId, Guid? doctorId,
- public async Task<ApiResponse<List<BookingDto>>> GetMyBookingsAsync(Guid tenantId, Guid patientUserId)
- public async Task<ApiResponse<List<BookingDto>>> GetBookingsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)

#### BranchAccessService (src/EliteClinic.Application/Features/Clinic/Services/BranchAccessService.cs)
- public async Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default)
- public async Task<ApiResponse> EnsureCanAccessBranchAsync(Guid tenantId, Guid callerUserId, Guid branchId, CancellationToken cancellationToken = default)

#### ClinicServiceManager (src/EliteClinic.Application/Features/Clinic/Services/ClinicServiceManager.cs)
- public async Task<ApiResponse<ClinicServiceDto>> CreateAsync(Guid tenantId, CreateClinicServiceRequest request)
- public async Task<ApiResponse<ClinicServiceDto>> GetByIdAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<PagedResult<ClinicServiceDto>>> GetAllAsync(Guid tenantId, int pageNumber = 1, int pageSize = 20, bool? activeOnly = null)
- public async Task<ApiResponse<ClinicServiceDto>> UpdateAsync(Guid tenantId, Guid id, UpdateClinicServiceRequest request)
- public async Task<ApiResponse<bool>> DeleteAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<List<DoctorClinicServiceLinkDto>>> GetDoctorLinksAsync(Guid tenantId, Guid doctorId)
- public async Task<ApiResponse<DoctorClinicServiceLinkDto>> UpsertDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId, UpsertDoctorClinicServiceLinkRequest request)
- public async Task<ApiResponse<bool>> RemoveDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId)

#### ClinicSettingsService (src/EliteClinic.Application/Features/Clinic/Services/ClinicSettingsService.cs)
- public async Task<ApiResponse<ClinicSettingsDto>> GetSettingsAsync(Guid tenantId)
- public async Task<ApiResponse<ClinicSettingsDto>> UpdateSettingsAsync(Guid tenantId, UpdateClinicSettingsRequest request)
- public async Task<ApiResponse<ClinicSettingsDto>> PatchSettingsAsync(Guid tenantId, PatchClinicSettingsRequest request)
- public async Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(Guid tenantId, bool activeOnly = false)
- public async Task<ApiResponse<List<ClinicPaymentMethodDto>>> ReplacePaymentMethodsAsync(Guid tenantId, UpdateClinicPaymentMethodsRequest request)

#### DoctorNoteService (src/EliteClinic.Application/Features/Clinic/Services/DoctorNoteService.cs)
- public async Task<ApiResponse<DoctorNoteDto>> CreateAsync(Guid tenantId, Guid doctorUserId, CreateDoctorNoteRequest request)
- public async Task<ApiResponse<List<DoctorNoteDto>>> GetUnreadAsync(Guid tenantId)
- public async Task<ApiResponse<PagedResult<DoctorNoteDto>>> GetAllAsync(Guid tenantId, bool? unreadOnly, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<DoctorNoteDto>> MarkAsReadAsync(Guid tenantId, Guid noteId, Guid readerUserId)

#### DoctorServiceImpl (src/EliteClinic.Application/Features/Clinic/Services/DoctorService.cs)
- public async Task<ApiResponse<DoctorDto>> CreateDoctorAsync(Guid tenantId, CreateDoctorRequest request)
- public async Task<ApiResponse<PagedResult<DoctorDto>>> GetAllDoctorsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<DoctorDto>> GetDoctorByIdAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<DoctorDto>> GetMyProfileAsync(Guid tenantId, Guid doctorUserId)
- public async Task<ApiResponse<DoctorDto>> UpdateDoctorAsync(Guid tenantId, Guid id, UpdateDoctorRequest request)
- public async Task<ApiResponse<DoctorDto>> PatchDoctorAsync(Guid tenantId, Guid id, PatchDoctorRequest request)
- public async Task<ApiResponse<DoctorDto>> EnableDoctorAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<DoctorDto>> DisableDoctorAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<List<DoctorServiceDto>>> UpdateServicesAsync(Guid tenantId, Guid doctorId, UpdateDoctorServicesRequest request)
- public async Task<ApiResponse<DoctorVisitFieldConfigDto>> UpdateVisitFieldsAsync(Guid tenantId, Guid doctorId, UpdateVisitFieldsRequest request)
- public async Task<ApiResponse<DoctorVisitFieldConfigDto>> GetMyVisitFieldsAsync(Guid tenantId, Guid doctorUserId)
- public async Task<ApiResponse<DoctorVisitFieldConfigDto>> UpdateMyVisitFieldsAsync(Guid tenantId, Guid doctorUserId, UpdateVisitFieldsRequest request)

#### ExpenseService (src/EliteClinic.Application/Features/Clinic/Services/ExpenseService.cs)
- public async Task<ApiResponse<ExpenseDto>> CreateAsync(Guid tenantId, CreateExpenseRequest request, Guid callerUserId)
- public async Task<ApiResponse<ExpenseDto>> UpdateAsync(Guid tenantId, Guid expenseId, UpdateExpenseRequest request)
- public async Task<ApiResponse> DeleteAsync(Guid tenantId, Guid expenseId)
- public async Task<ApiResponse<PagedResult<ExpenseDto>>> GetAllAsync(Guid tenantId, DateTime? from, DateTime? to,

#### FinanceService (src/EliteClinic.Application/Features/Clinic/Services/FinanceService.cs)
- public async Task<ApiResponse<DailyRevenueDto>> GetDailyRevenueAsync(Guid tenantId, DateTime date)
- public async Task<ApiResponse<List<DoctorRevenueDto>>> GetRevenueByDoctorAsync(Guid tenantId, DateTime date, Guid? doctorId, decimal commissionPercent = 0)
- public async Task<ApiResponse<MonthlyRevenueDto>> GetMonthlyRevenueAsync(Guid tenantId, int year, int month)
- public async Task<ApiResponse<YearlyRevenueDto>> GetYearlyRevenueAsync(Guid tenantId, int year)
- public async Task<ApiResponse<ProfitReportDto>> GetProfitReportAsync(Guid tenantId, DateTime from, DateTime to)

#### InventoryService (src/EliteClinic.Application/Features/Clinic/Services/InventoryService.cs)
- public async Task<ApiResponse<InventoryItemDto>> CreateItemAsync(Guid tenantId, CreateInventoryItemRequest request)
- public async Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid tenantId, Guid itemId, UpdateInventoryItemRequest request)
- public async Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid itemId)
- public async Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, InventoryItemsQuery query)
- public async Task<ApiResponse<InventoryItemDto>> SetActivationAsync(Guid tenantId, Guid itemId, SetInventoryItemActivationRequest request)
- public async Task<ApiResponse<VisitInventoryUsageDto>> RecordVisitUsageAsync(Guid tenantId, Guid visitId, Guid callerUserId, RecordVisitInventoryUsageRequest request)

#### InvoiceNumberService (src/EliteClinic.Application/Features/Clinic/Services/InvoiceNumberService.cs)
- public async Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)

#### InvoiceService (src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs)
- public async Task<ApiResponse<InvoiceDto>> EnsureInvoiceForVisitAsync(Guid tenantId, Guid visitId, Guid performedByUserId, string? initialNotes = null)
- public async Task<ApiResponse<InvoiceDto>> CreateInvoiceAsync(Guid tenantId, CreateInvoiceRequest request)
- public async Task<ApiResponse<InvoiceDto>> UpdateInvoiceAsync(Guid tenantId, Guid invoiceId, UpdateInvoiceRequest request)
- public async Task<ApiResponse<InvoiceDto>> PatchInvoiceAsync(Guid tenantId, Guid invoiceId, PatchInvoiceRequest request)
- public async Task<ApiResponse<InvoiceDto>> GetInvoiceByIdAsync(Guid tenantId, Guid invoiceId)
- public async Task<ApiResponse<PagedResult<InvoiceDto>>> GetInvoicesAsync(Guid tenantId, DateTime? from, DateTime? to,
- public async Task<ApiResponse<PaymentDto>> RecordPaymentAsync(Guid tenantId, CreatePaymentRequest request)
- public async Task<ApiResponse<InvoiceDto>> AddLineItemAsync(Guid tenantId, Guid invoiceId, AddInvoiceLineItemRequest request, Guid performedByUserId)
- public async Task<ApiResponse<InvoiceDto>> AddAdjustmentAsync(Guid tenantId, Guid invoiceId, AddInvoiceAdjustmentRequest request, Guid performedByUserId)
- public async Task<ApiResponse<PaymentDto>> RefundPaymentAsync(Guid tenantId, Guid invoiceId, RefundInvoiceRequest request, Guid performedByUserId)
- public async Task<ApiResponse<List<PaymentDto>>> GetPaymentsByInvoiceAsync(Guid tenantId, Guid invoiceId)

#### LabRequestService (src/EliteClinic.Application/Features/Clinic/Services/LabRequestService.cs)
- public async Task<ApiResponse<LabRequestDto>> CreateAsync(Guid tenantId, Guid visitId, CreateLabRequestRequest request, Guid callerUserId)
- public async Task<ApiResponse<LabRequestDto>> UpdateAsync(Guid tenantId, Guid visitId, Guid labId,
- public async Task<ApiResponse<LabRequestDto>> AddResultAsync(Guid tenantId, Guid visitId, Guid labId, AddLabResultRequest request)
- public async Task<ApiResponse<LabRequestDto>> DeleteAsync(Guid tenantId, Guid visitId, Guid labId, Guid callerUserId)
- public async Task<ApiResponse<List<LabRequestDto>>> GetByVisitAsync(Guid tenantId, Guid visitId, LabRequestType? type = null)

#### MarketplaceService (src/EliteClinic.Application/Features/Clinic/Services/MarketplaceService.cs)
- public async Task<ApiResponse<PagedResult<PublicMarketplaceItemDto>>> GetPublicItemsAsync(string tenantSlug, PublicMarketplaceItemsQuery query)
- public async Task<ApiResponse<PublicMarketplaceItemDto>> GetPublicItemByIdAsync(string tenantSlug, Guid itemId)
- public async Task<ApiResponse<MarketplaceOrderDto>> CreatePublicOrderAsync(string tenantSlug, CreatePublicMarketplaceOrderRequest request)
- public async Task<ApiResponse<PagedResult<MarketplaceOrderDto>>> GetClinicOrdersAsync(Guid tenantId, MarketplaceOrdersQuery query)
- public async Task<ApiResponse<MarketplaceOrderDto>> GetClinicOrderByIdAsync(Guid tenantId, Guid orderId)
- public async Task<ApiResponse<MarketplaceOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid orderId, Guid changedByUserId, UpdateMarketplaceOrderStatusRequest request)

#### MediaService (src/EliteClinic.Application/Features/Clinic/Services/MediaService.cs)
- public async Task<ApiResponse<MediaFileDto>> UploadClinicLogoAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<MediaFileDto>> UploadClinicImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<MediaFileDto>> UploadDoctorPhotoAsync(Guid tenantId, Guid doctorId, IFormFile file, CancellationToken cancellationToken = default)

#### MessageDeliveryResult (src/EliteClinic.Application/Features/Clinic/Services/IMessageDeliveryProvider.cs)
- No public method signatures extracted.

#### MessageRenderResult (src/EliteClinic.Application/Features/Clinic/Services/IMessageTemplateRenderer.cs)
- No public method signatures extracted.

#### MessageService (src/EliteClinic.Application/Features/Clinic/Services/MessageService.cs)
- public async Task<ApiResponse<MessageLogDto>> SendMessageAsync(Guid tenantId, SendMessageRequest request)
- public async Task<ApiResponse<MessageLogDto>> RetryMessageAsync(Guid tenantId, Guid messageId)
- public async Task<ApiResponse<PagedResult<MessageLogDto>>> GetAllAsync(Guid tenantId, string? templateName,
- public async Task<ApiResponse<MessageLogDto>> GetByIdAsync(Guid tenantId, Guid messageId)
- public async Task LogWorkflowEventAsync(Guid tenantId, string templateName, Guid? recipientUserId = null, string? recipientPhone = null,
- public async Task LogScenarioAsync(Guid tenantId, MessageScenario scenario, Guid? recipientUserId = null, string? recipientPhone = null,

#### MessageTemplateRenderer (src/EliteClinic.Application/Features/Clinic/Services/MessageTemplateRenderer.cs)
- public async Task<MessageRenderResult> RenderAsync(
- public static MessageRenderResult RenderFromTemplate(string template, Dictionary<string, string>? variables)

#### NotificationService (src/EliteClinic.Application/Features/Clinic/Services/NotificationService.cs)
- public async Task<ApiResponse<NotificationSubscriptionDto>> SubscribeAsync(Guid tenantId, Guid userId, CreateNotificationSubscriptionRequest request)
- public async Task<ApiResponse> UnsubscribeAsync(Guid tenantId, Guid subscriptionId, Guid userId)
- public async Task<ApiResponse<List<NotificationSubscriptionDto>>> GetMySubscriptionsAsync(Guid tenantId, Guid userId)
- public async Task<ApiResponse<MessageLogDto>> SendNotificationAsync(Guid tenantId, SendNotificationRequest request)
- public async Task<ApiResponse<PagedResult<InAppNotificationDto>>> GetInAppNotificationsAsync(Guid tenantId, Guid userId, InAppNotificationsQuery query)
- public async Task<ApiResponse<InAppNotificationDto>> MarkInAppReadAsync(Guid tenantId, Guid userId, Guid notificationId)
- public async Task<ApiResponse<int>> MarkAllInAppReadAsync(Guid tenantId, Guid userId)

#### PartnerService (src/EliteClinic.Application/Features/Clinic/Services/PartnerService.cs)
- public async Task<ApiResponse<PagedResult<PartnerDto>>> ListPartnersAsync(Guid tenantId, PartnerType? type, bool activeOnly, int pageNumber = 1, int pageSize = 20)
- public async Task<ApiResponse<PartnerDto>> CreatePartnerAsync(Guid tenantId, CreatePartnerRequest request)
- public async Task<ApiResponse<PartnerDto>> UpdatePartnerAsync(Guid tenantId, Guid partnerId, UpdatePartnerRequest request)
- public async Task<ApiResponse<PartnerDto>> SetPartnerActivationAsync(Guid tenantId, Guid partnerId, bool isActive)
- public async Task<ApiResponse<List<PartnerContractDto>>> ListContractsAsync(Guid tenantId, PartnerContractsQuery query)
- public async Task<ApiResponse<PartnerContractDto>> CreateContractAsync(Guid tenantId, CreatePartnerContractRequest request)
- public async Task<ApiResponse<PartnerContractDto>> UpdateContractAsync(Guid tenantId, Guid contractId, UpdatePartnerContractRequest request)
- public async Task<ApiResponse<PartnerOrderDto>> CreateLabOrderAsync(Guid tenantId, Guid visitId, Guid labRequestId, Guid callerUserId, CreateLabPartnerOrderRequest request)
- public async Task<ApiResponse<PartnerOrderDto>> CreatePrescriptionOrderAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId, CreatePrescriptionPartnerOrderRequest request)
- public async Task<ApiResponse<PagedResult<PartnerOrderDto>>> ListOrdersAsync(Guid tenantId, Guid callerUserId, PartnerOrdersQuery query)
- public async Task<ApiResponse<PartnerOrderDto>> GetOrderByIdAsync(Guid tenantId, Guid callerUserId, Guid orderId)
- public async Task<ApiResponse<PartnerOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid callerUserId, Guid orderId, UpdatePartnerOrderStatusRequest request)

#### PatientCreditService (src/EliteClinic.Application/Features/Clinic/Services/PatientCreditService.cs)
- public async Task<ApiResponse<PatientCreditTransactionDto>> IssueCreditAsync(Guid tenantId, IssuePatientCreditRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<PatientCreditTransactionDto>> ConsumeCreditAsync(Guid tenantId, ConsumePatientCreditRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<PatientCreditBalanceDto>> GetBalanceAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<PagedResult<PatientCreditTransactionDto>>> GetHistoryAsync(Guid tenantId, Guid patientId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)

#### PatientMedicalService (src/EliteClinic.Application/Features/Clinic/Services/PatientMedicalService.cs)
- public async Task<ApiResponse<PatientMedicalDocumentDto>> UploadDocumentAsync(
- public async Task<ApiResponse<List<PatientMedicalDocumentDto>>> ListDocumentsAsync(
- public async Task<ApiResponse<PatientMedicalDocumentAccessDto>> GetDocumentAccessAsync(
- public async Task<ApiResponse<PatientChronicProfileDto>> GetChronicProfileAsync(
- public async Task<ApiResponse<PatientChronicProfileDto>> UpsertChronicProfileAsync(
- public async Task<ApiResponse<List<PatientMedicalDocumentThreadDto>>> ListDocumentThreadsAsync(
- public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> CreateDocumentThreadAsync(
- public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> AddThreadReplyAsync(
- public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> CloseThreadAsync(

#### PatientSelfServiceRequestService (src/EliteClinic.Application/Features/Clinic/Services/PatientSelfServiceRequestService.cs)
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> CreateAsync(
- public async Task<ApiResponse<List<PatientSelfServiceRequestListItemDto>>> ListOwnedAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> GetOwnedByIdAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> ReuploadPaymentProofAsync(
- public async Task<ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>> GetClinicRequestsAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> GetClinicRequestByIdAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> ApproveAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> RejectAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> RequestReuploadAsync(
- public async Task<ApiResponse<PatientSelfServiceRequestDto>> AdjustPaidAmountAsync(

#### PatientService (src/EliteClinic.Application/Features/Clinic/Services/PatientService.cs)
- public async Task<ApiResponse<CreatePatientResponse>> CreatePatientAsync(Guid tenantId, CreatePatientRequest request)
- public async Task<ApiResponse<PagedResult<PatientDto>>> GetAllPatientsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10, string? search = null)
- public async Task<ApiResponse<PatientDto>> GetPatientByIdAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<PatientDto>> UpdatePatientAsync(Guid tenantId, Guid id, UpdatePatientRequest request)
- public async Task<ApiResponse<PatientDto>> PatchPatientAsync(Guid tenantId, Guid id, PatchPatientRequest request)
- public async Task<ApiResponse<PatientDto>> AddSubProfileAsync(Guid tenantId, Guid parentId, AddSubProfileRequest request)
- public async Task<ApiResponse<ResetPasswordResponse>> ResetPasswordAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<SendPatientCredentialsResponse>> SendCredentialsAsync(Guid tenantId, Guid id, SendPatientCredentialsRequest request)
- public async Task<ApiResponse<PatientDto>> GetOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
- public async Task<ApiResponse<object>> DeletePatientAsync(Guid tenantId, Guid id)

#### PrescriptionService (src/EliteClinic.Application/Features/Clinic/Services/PrescriptionService.cs)
- public async Task<ApiResponse<PrescriptionDto>> CreateAsync(Guid tenantId, Guid visitId, CreatePrescriptionRequest request, Guid callerUserId)
- public async Task<ApiResponse<PrescriptionDto>> UpdateAsync(Guid tenantId, Guid visitId, Guid prescriptionId,
- public async Task<ApiResponse> DeleteAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)
- public async Task<ApiResponse<List<PrescriptionDto>>> GetByVisitAsync(Guid tenantId, Guid visitId)
- public async Task<ApiResponse<List<PrescriptionRevisionDto>>> GetRevisionsAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)

#### PublicService (src/EliteClinic.Application/Features/Clinic/Services/PublicService.cs)
- public async Task<ApiResponse<PublicLandingDto>> GetLandingAsync(string tenantSlug)
- public async Task<ApiResponse<PublicClinicDto>> GetClinicProfileAsync(string tenantSlug)
- public async Task<ApiResponse<List<PublicDoctorDto>>> GetDoctorsAsync(string tenantSlug)
- public async Task<ApiResponse<List<PublicDoctorServiceDto>>> GetServicesAsync(string tenantSlug)
- public async Task<ApiResponse<List<PublicWorkingHourDto>>> GetWorkingHoursAsync(string tenantSlug)
- public async Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(string tenantSlug)
- public async Task<ApiResponse<List<PublicDoctorDto>>> GetAvailableDoctorsNowAsync(string tenantSlug)

#### QueueService (src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs)
- public async Task<ApiResponse<QueueSessionDto>> OpenSessionAsync(Guid tenantId, CreateQueueSessionRequest request, Guid callerUserId)
- public async Task<ApiResponse<QueueSessionDto>> CloseSessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId, bool forceClose = false)
- public async Task<ApiResponse<int>> CloseAllSessionsForDateAsync(Guid tenantId, DateTime date)
- public async Task<ApiResponse<PagedResult<QueueSessionDto>>> GetSessionsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<QueueSessionDto>> GetSessionByIdAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
- public async Task<ApiResponse<QueueTicketDto>> IssueTicketAsync(Guid tenantId, CreateQueueTicketRequest request)
- public async Task<ApiResponse<QueueTicketDto>> IssueTicketWithPaymentAsync(Guid tenantId, CreateQueueTicketWithPaymentRequest request)
- public async Task<ApiResponse<QueueTicketDto>> CallTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<StartVisitResultDto>> StartVisitFromTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<QueueTicketDto>> FinishTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<QueueTicketDto>> SkipTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<QueueTicketDto>> CancelTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<QueueTicketDto>> MarkUrgentAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
- public async Task<ApiResponse<List<QueueTicketDto>>> GetTicketsBySessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
- public async Task<ApiResponse<QueueBoardDto>> GetBoardAsync(Guid tenantId)
- public async Task<ApiResponse<QueueBoardSessionDto>> GetMyQueueAsync(Guid tenantId, Guid doctorUserId)
- public async Task<ApiResponse<QueueTicketDto>> GetMyTicketAsync(Guid tenantId, Guid patientUserId)
- public async Task<ApiResponse<QueueTicketDto>> GetTicketForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)

#### ReportsService (src/EliteClinic.Application/Features/Clinic/Services/ReportsService.cs)
- public async Task<ApiResponse<ClinicOverviewReportDto>> GetClinicOverviewAsync(
- public async Task<ApiResponse<ServicesSalesReportDto>> GetServicesSalesAsync(
- public async Task<ApiResponse<ClinicOverviewReportDto>> GetDoctorOwnOverviewAsync(

#### StaffService (src/EliteClinic.Application/Features/Clinic/Services/StaffService.cs)
- public async Task<ApiResponse<StaffDto>> CreateStaffAsync(Guid tenantId, CreateStaffRequest request)
- public async Task<ApiResponse<StaffDto>> CreatePayrollOnlyWorkerAsync(Guid tenantId, CreatePayrollOnlyWorkerRequest request)
- public async Task<ApiResponse<PagedResult<StaffDto>>> GetAllStaffAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<StaffDto>> GetStaffByIdAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<StaffDto>> UpdateStaffAsync(Guid tenantId, Guid id, UpdateStaffRequest request)
- public async Task<ApiResponse<StaffDto>> PatchStaffAsync(Guid tenantId, Guid id, PatchStaffRequest request)
- public async Task<ApiResponse<StaffDto>> EnableStaffAsync(Guid tenantId, Guid id)
- public async Task<ApiResponse<StaffDto>> DisableStaffAsync(Guid tenantId, Guid id)

#### VisitService (src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs)
- public async Task<ApiResponse<VisitDto>> CreateVisitAsync(Guid tenantId, CreateVisitRequest request, Guid callerUserId)
- public async Task<ApiResponse<VisitDto>> UpdateVisitAsync(Guid tenantId, Guid visitId, UpdateVisitRequest request, Guid callerUserId)
- public async Task<ApiResponse<VisitDto>> CompleteVisitAsync(Guid tenantId, Guid visitId, CompleteVisitRequest request, Guid callerUserId)
- public async Task<ApiResponse<VisitDto>> GetVisitByIdAsync(Guid tenantId, Guid visitId, Guid callerUserId)
- public async Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsAsync(Guid tenantId, Guid patientId, Guid callerUserId, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryAsync(Guid tenantId, Guid patientId, Guid callerUserId)
- public async Task<ApiResponse<PagedResult<VisitDto>>> GetMyVisitsAsync(Guid tenantId, Guid doctorUserId, MyVisitsFilterRequest request)
- public async Task<ApiResponse<PagedResult<PatientDto>>> GetMyPatientsAsync(Guid tenantId, Guid doctorUserId, int pageNumber = 1, int pageSize = 10, string? search = null)
- public async Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId, int pageNumber = 1, int pageSize = 10)
- public async Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
- public async Task<ApiResponse<List<StaleOpenVisitDto>>> GetStaleOpenVisitsAsync(Guid tenantId, int olderThanHours = 12)
- public async Task<ApiResponse<VisitDto>> CloseStaleVisitAsync(Guid tenantId, Guid visitId, CloseStaleVisitRequest request)

#### WorkforceService (src/EliteClinic.Application/Features/Clinic/Services/WorkforceService.cs)
- public async Task<ApiResponse<DoctorCompensationRuleDto>> CreateDoctorCompensationRuleAsync(Guid tenantId, Guid doctorId, Guid changedByUserId, CreateDoctorCompensationRuleRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<List<DoctorCompensationRuleDto>>> ListDoctorCompensationRulesAsync(Guid tenantId, Guid doctorId, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<AttendanceRecordDto>> CreateAttendanceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAttendanceRecordRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<AbsenceRecordDto>> CreateAbsenceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAbsenceRecordRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<List<AbsenceRecordDto>>> ListAbsenceRecordsAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<AttendanceRecordDto>> CheckOutAttendanceAsync(Guid tenantId, Guid attendanceId, CheckOutAttendanceRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<List<AttendanceRecordDto>>> ListAttendanceAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<SalaryPayoutExpenseDto>> CreateSalaryPayoutAsync(Guid tenantId, Guid recordedByUserId, CreateSalaryPayoutRequest request, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<DailyClosingSnapshotDto>> GenerateDailyClosingSnapshotAsync(Guid tenantId, Guid generatedByUserId, DateTime snapshotDate, CancellationToken cancellationToken = default)
- public async Task<ApiResponse<List<DailyClosingSnapshotDto>>> GetDailyClosingSnapshotsAsync(Guid tenantId, DateTime? from, DateTime? to, CancellationToken cancellationToken = default)

