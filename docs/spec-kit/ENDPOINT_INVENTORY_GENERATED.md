# Endpoint Inventory (Generated)

Generated: 2026-04-05 17:10:20 +02:00
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
