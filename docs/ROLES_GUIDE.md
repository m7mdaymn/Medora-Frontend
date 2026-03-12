# Roles & Permissions Guide

> **Version:** 6.0 | **Last Updated:** 2026-02-08

Elite Clinic uses 7 roles with role-based access control (RBAC) enforced through ASP.NET Identity and `[Authorize(Roles = "...")]` attributes on every controller action.

---

## Role Hierarchy

```
SuperAdmin (Platform-level)
└── ClinicOwner (Tenant-level — full control)
    ├── ClinicManager (Daily operations)
    ├── Receptionist (Front desk + patient CRUD + queue)
    ├── Doctor (Clinical)
    ├── Nurse (Clinical support, read-only)
    └── Patient (Self-service)
```

---

## 1. SuperAdmin

**Scope:** Platform-wide (no tenant binding)  
**Token:** Does not include `tenantId` claim  
**Headers:** Does NOT require `X-Tenant` for platform routes  

### Capabilities
- Create, list, update, activate/suspend/block tenants
- Manage subscriptions (create, update)
- View and update feature flags for any tenant
- Cross-tenant access to any tenant-scoped endpoint (attaches via `X-Tenant` header)
- View platform audit logs

### Cannot
- Directly perform clinic operations without specifying `X-Tenant`

### API Access
| Module | Access |
|--------|--------|
| Platform Tenants | Full CRUD |
| Subscriptions | Full CRUD |
| Feature Flags | Read + Update |
| All Clinic Modules | Full (with X-Tenant) |

---

## 2. ClinicOwner

**Scope:** Single tenant  
**Token:** Includes `tenantId` claim  
**Headers:** Requires `X-Tenant` on all clinic routes  

### Capabilities
- Configure clinic settings (name, phone, working hours, booking rules)
- Create, edit, enable/disable staff (ClinicManager or Receptionist roles)
- Create, edit, enable/disable doctors with services and pricing
- Create, edit, delete patients
- Manage queue sessions and tickets
- View all visits, prescriptions, lab requests
- Create invoices and record payments
- Add and view expenses
- View all finance reports (daily, monthly, yearly, per-doctor, profit)
- Send WhatsApp messages and PWA notifications
- Create and manage bookings
- View audit logs for the tenant

### Cannot
- Manage other tenants or platform-level resources
- Access subscription or feature flag management

---

## 3. ClinicManager

**Scope:** Single tenant  
**Token:** Includes `tenantId` claim  
**Login:** `POST /api/auth/login` with `X-Tenant` header  

### Capabilities
- Create and manage patients (CRUD)
- Manage queue (open/close sessions, issue tickets, skip, cancel)
- View reception board
- Record payments and manage invoices
- Add expenses
- View daily finance (today only)
- View staff list (read-only)
- View doctor list (read-only)
- View clinic settings (read-only)

### Cannot
- Create staff or doctors
- Update clinic settings
- Manage subscriptions or feature flags
- View monthly/yearly finance (owner only)
- Access visits or medical records

---

## 4. Receptionist

**Scope:** Single tenant  
**Token:** Includes `tenantId` claim  
**Login:** `POST /api/auth/login` with `X-Tenant` header  
**Created via:** `POST /api/clinic/staff` with `"role": "Receptionist"`  

### Capabilities
- Create, edit, and manage patients (full CRUD: create, edit via PUT/PATCH, list, view details, add sub-profile, reset password)
- Manage queue (open/close sessions, issue tickets, issue tickets with payment, skip, cancel)
- View reception board
- Create, cancel, and reschedule bookings (on behalf of patients)
- List and view bookings
- Send WhatsApp messages (using templates)
- Send PWA notifications
- View unread doctor notes
- Mark doctor notes as read
- List doctor notes
- View doctor list (list only, not detail)
- View staff list (read-only)
- View clinic settings (read-only)
- View clinic services catalog (read-only)
- Subscribe to push notifications

### Cannot
- Create doctors or staff
- Update clinic settings
- Manage subscriptions or feature flags
- Access visits, prescriptions, or medical records
- Access finance or expenses
- Disable/enable staff or doctors (manager only)
- Delete patients (owner only)

### Key Difference from ClinicManager
The Receptionist role is focused on **communication and booking** while ClinicManager handles **daily clinical operations** (queue, payments, patients).

---

## 5. Doctor

**Scope:** Single tenant (own data primarily)  
**Token:** Includes `tenantId` claim  
**Login:** `POST /api/auth/login` with `X-Tenant` header  

### Capabilities
- View own queue (`/api/clinic/queue-board/my-queue`)
- Call next patient, start visit, finish visit
- Create visit records with clinical data
- Add prescriptions, lab requests, follow-ups
- Send doctor-to-reception notes
- View unread notes
- List doctors (read-only)
- Send WhatsApp messages
- Send PWA notifications

### Cannot
- Create patients, staff, or other doctors
- Access queue management (open/close sessions, issue tickets)
- Access finance or payments
- Update clinic settings
- View reception board

---

## 6. Nurse

**Scope:** Single tenant (read-only clinical support)  
**Token:** Includes `tenantId` claim  
**Login:** `POST /api/auth/login` with `X-Tenant` header  
**Created via:** `POST /api/clinic/staff` with `"role": "Nurse"`  

### Capabilities
- View patient list and details (read-only)
- View reception board (read-only)
- View doctor list (read-only)
- View clinic settings (read-only)
- View clinic services catalog (read-only)
- Subscribe to push notifications

### Cannot
- Create, edit, or delete any records
- Manage queue (open/close sessions, issue/call/skip/cancel tickets)
- Access visits, prescriptions, or medical records
- Access finance, payments, or expenses
- Send messages or notifications
- Manage bookings
- Create staff or doctors

---

## 7. Patient

**Scope:** Single tenant (own data only)  
**Token:** Includes `tenantId` claim  
**Login:** `POST /api/auth/patient/login` with `X-Tenant` header  

### Capabilities
- View own profile and visit history
- View own queue ticket status (`/api/clinic/queue-board/my-ticket`)
- Book appointments online (if OnlineBooking feature enabled)
- Cancel own bookings (within cancellation window)
- View own bookings (`/api/clinic/bookings/my`)
- View doctor list (read-only)
- View clinic settings (read-only)
- Subscribe to PWA notifications (if PwaNotifications feature enabled)
- View own prescriptions

### Cannot
- Access other patients' data
- Create visits, prescriptions, or lab requests
- Access queue management or reception board
- Access finance, expenses, or invoices
- Send messages or notifications
- Manage staff or doctors

---

## Role Assignment

### During Seeding
All 7 roles are automatically seeded on application startup:
- SuperAdmin, ClinicOwner, ClinicManager, Receptionist, Doctor, Nurse, Patient

### Staff Creation
```json
POST /api/clinic/staff
{
  "username": "new_receptionist",
  "name": "Front Desk Person",
  "password": "SecurePassword@123",
  "role": "Receptionist"   // "ClinicManager", "Receptionist", or "Nurse" — defaults to "ClinicManager"
}
```

### Doctor Creation
Doctors are always assigned the `Doctor` role via `POST /api/clinic/doctors`.

### Patient Creation
Patients are always assigned the `Patient` role via `POST /api/clinic/patients`.

---

## Feature Flag Gating

Some actions are gated by tenant feature flags:

| Feature Flag | Affects |
|-------------|---------|
| `onlineBooking` | Patient booking, booking UI |
| `whatsappAutomation` | WhatsApp message sending |
| `pwaNotifications` | PWA notification subscription |
| `expensesModule` | Expense tracking |
| `advancedMedicalTemplates` | Extended visit field configuration |
| `ratings` | Patient ratings (future) |
| `export` | Data export (future) |

Feature flags are managed by SuperAdmin: `PUT /api/platform/feature-flags/{tenantId}`

---

## Controller Authorization Reference

| Controller | Class-Level | Action-Level Overrides |
|-----------|-------------|----------------------|
| AuthController | None (public) | Individual actions specify roles |
| TenantsController | SuperAdmin | — |
| SubscriptionsController | SuperAdmin | — |
| FeatureFlagsController | SuperAdmin | — |
| ClinicServicesController | Authorize | Read: SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist,Nurse; Write: SuperAdmin,ClinicOwner,ClinicManager |
| ClinicSettingsController | Authorize | GET: all auth'd, PUT/PATCH: ClinicOwner |
| StaffController | Authorize | Most: ClinicOwner,SuperAdmin |
| DoctorsController | Authorize | Create/edit: ClinicOwner,SuperAdmin; List: all auth'd |
| PatientsController | Authorize | Create/edit/patch: ClinicOwner,ClinicManager,Receptionist,SuperAdmin; List: same; Detail: adds Doctor,Patient,Nurse |
| QueueSessionsController | Authorize | ClinicOwner,ClinicManager,Doctor,SuperAdmin |
| QueueTicketsController | Authorize | Issue/skip/cancel: ClinicOwner,ClinicManager,SuperAdmin; Call/visit: Doctor |
| QueueBoardController | Authorize | Board: ClinicOwner,ClinicManager,SuperAdmin; My-queue: Doctor; My-ticket: Patient |
| VisitsController | Authorize | Create/edit: Doctor,SuperAdmin; View: ClinicOwner,Doctor,Patient,SuperAdmin |
| PrescriptionsController | Authorize | Create: Doctor,SuperAdmin; View: adds ClinicOwner,Patient |
| LabRequestsController | Authorize | Create: Doctor,SuperAdmin; View: adds ClinicOwner,Patient |
| InvoicesController | Authorize | ClinicOwner,ClinicManager,SuperAdmin |
| ExpensesController | Authorize | ClinicOwner,ClinicManager,SuperAdmin |
| FinanceController | Authorize | ClinicOwner,ClinicManager,SuperAdmin |
| BookingsController | Authorize | Create/cancel/reschedule: Patient,ClinicOwner,ClinicManager,Receptionist,SuperAdmin |
| MessagesController | Authorize | ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| DoctorNotesController | Authorize | Create: Doctor,SuperAdmin; View/list/read: adds ClinicOwner,ClinicManager,Receptionist |
| NotificationsController | Authorize | Subscribe/list/delete: all auth'd; Send: ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin |
| PublicController | None | All public, no auth required |
| HealthController | None | Public health check |
