# PERMISSIONS_MATRIX.md — Role/Action Access Control

> **Version:** 6.0  
> **Last Updated:** 2026-02-08  
> **Status:** All 5 Phases + Production Hardening Complete

---

## ROLES DEFINITION (Clean — No Duplicates)

| Role | Scope | Description |
|------|-------|-------------|
| **SuperAdmin** | Platform | Platform owner. Manages tenants, subscriptions, feature flags, platform analytics. Does NOT operate daily clinic workflows. |
| **ClinicOwner** | Tenant | Clinic administrator. Full control over clinic configuration, staff, doctors, reports. Also referred to as ClinicAdmin. |
| **ClinicManager** | Tenant | Operations staff (reception/manager). Handles daily flow: patients, queue, payments, today's finance. |
| **Receptionist** | Tenant | Front desk staff. Full patient CRUD, queue management, bookings, messages/notifications, doctor notes. Cannot create doctors or update clinic settings. |
| **Doctor** | Tenant | Medical provider. Manages own queue, creates visits, prescriptions, labs. |
| **Nurse** | Tenant | Clinical support. View-only access to patients, queue board, doctors, clinic settings. Cannot create or modify records. |
| **Patient** | Tenant | End user. Persistent session. Views own data, queue status, bookings. |

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access |
| 📖 | Read-only access |
| 🔒 | Own data only |
| ⚙️ | Conditional (feature flag or setting dependent) |
| ❌ | No access |

---

## MODULE: Platform Administration

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Create tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| List all tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View tenant details | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activate/suspend/block tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage subscriptions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View/edit feature flags | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View platform analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View platform audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View cross-tenant WhatsApp logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage tenant WhatsApp config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lock clinic for abuse | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## MODULE: Authentication

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Login (staff) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Login (patient) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Refresh token | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile (me) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (never) |

---

## MODULE: Clinic Settings

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| View clinic settings | ❌ | ✅ | 📖 | 📖 | ❌ | 📖 | ❌ |
| Update clinic settings (PUT) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Patch clinic settings (PATCH) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure working hours | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure WhatsApp numbers | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure booking rules | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## MODULE: Staff / Employee Management

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Create staff | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit staff (PUT) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Patch staff (PATCH) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View staff list | ❌ | ✅ | 📖 | 📖 | ❌ | ❌ | ❌ |
| Disable/enable staff | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View staff schedule | ❌ | ✅ | 📖 | 📖 | ❌ | ❌ | ❌ |
| View login history | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Note:** ClinicManager cannot disable/enable users with ClinicOwner role (owner protection).

---

## MODULE: Doctor Management

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Create doctor | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit doctor profile (PUT) | ❌ | ✅ | ❌ | ❌ | 🔒 (own) | ❌ | ❌ |
| Patch doctor profile (PATCH) | ❌ | ✅ | ❌ | ❌ | 🔒 (own) | ❌ | ❌ |
| Enable/disable doctor | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure doctor visit fields | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure services/pricing | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View doctor list | ❌ | ✅ | 📖 | 📖 | ❌ | 📖 | ❌ |
| Configure urgent case behavior | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Note:** ClinicManager cannot disable/enable users with ClinicOwner role (owner protection).

---

## MODULE: Patient Management

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Create patient | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit patient (PUT) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Patch patient (PATCH) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View patient list | ❌ | ✅ | ✅ | ✅ | ❌ | 📖 | ❌ |
| View patient detail | ❌ | ✅ | ✅ | ✅ | 🔒 (own patients) | 📖 | 🔒 (own) |
| Add sub-profile (child) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reset patient password | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete patient | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Note:** Duplicate patient detection enforced — unique (TenantId, Phone, Name). Returns 409 Conflict.

---

## MODULE: Queue System

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Open session | ❌ | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| Close session | ❌ | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| Close all sessions (admin) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Issue ticket (walk-in) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue ticket with payment | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Call ticket (next) | ❌ | ❌ | ❌ | ❌ | ✅ (own queue) | ❌ | ❌ |
| Start visit | ❌ | ❌ | ❌ | ❌ | ✅ (own queue) | ❌ | ❌ |
| Finish visit | ❌ | ❌ | ❌ | ❌ | ✅ (own queue) | ❌ | ❌ |
| Skip / no-show | ❌ | ✅ | ✅ | ✅ | ✅ (own queue) | ❌ | ❌ |
| Cancel ticket | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ⚙️ (within rules) |
| View reception board | ❌ | ✅ | ✅ | ✅ | ❌ | 📖 | ❌ |
| View own queue | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View own ticket status | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Insert urgent ticket | ❌ | ✅ | ✅ | ✅ | ✅ (own queue) | ❌ | ❌ |

> **Note:** Opening a session auto-converts any confirmed bookings for that doctor+date into waiting tickets.

---

## MODULE: Visits & Medical Records

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Create visit record | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit visit record | ❌ | ❌ | ❌ | ❌ | ✅ (own, same day) | ❌ | ❌ |
| View visit details | ❌ | ✅ | ❌ | ❌ | ✅ (own default) | ❌ | 🔒 (own) |
| View all visits for patient | ❌ | ✅ | ❌ | ❌ | ⚙️ (if permitted) | ❌ | 🔒 (own) |
| Add prescription | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Add lab/imaging request | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Schedule follow-up | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View prescriptions | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | 🔒 (own) |
| Filter lab requests by type | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | 🔒 (own) |

---

## MODULE: Payments & Finance

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Record payment | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update payment status | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Patch invoice (PATCH) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View payment status | ❌ | ✅ | ✅ | ❌ | 📖 | ❌ | 🔒 (own) |
| View daily revenue | ❌ | ✅ (all) | ✅ (today) | ❌ | ❌ | ❌ | ❌ |
| View monthly revenue | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View yearly revenue | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View revenue per doctor | ❌ | ✅ (all) | ✅ (today) | ❌ | 🔒 (own) | ❌ | ❌ |
| Add expense | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View expenses | ❌ | ✅ (all) | ✅ (today) | ❌ | ❌ | ❌ | ❌ |
| View profit | ❌ | ✅ (all) | ✅ (today) | ❌ | ❌ | ❌ | ❌ |

---

## MODULE: Online Booking

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Book appointment online | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (if OnlineBooking flag + BookingEnabled) |
| Cancel booking | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (within cancellation window) |
| Reschedule booking | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (within cancellation window) |
| View booking by ID | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| List all bookings (paginated) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View own bookings (/my) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> **Note:** Confirmed bookings are auto-converted to queue tickets when a doctor's session opens.

---

## MODULE: WhatsApp & Notifications

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| Send WhatsApp/PWA message | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Retry failed message | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View message by ID | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| List all messages (paginated) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Send doctor note to reception | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View unread doctor notes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| List all doctor notes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mark doctor note as read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Subscribe to push notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (if PwaNotifications flag) |
| Unsubscribe from push | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own subscriptions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send push notification | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## MODULE: Reporting & Export

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| View doctor performance | ❌ | ✅ | ❌ | ❌ | 🔒 (own) | ❌ | ❌ |
| View patient trends | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export reports | ❌ | ⚙️ (if enabled) | ❌ | ❌ | ❌ | ❌ | ❌ |
| View platform KPIs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View expiring subscriptions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View WA delivery health | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## MODULE: Clinic Services Catalog

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| List clinic services | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View service by ID | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create clinic service | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update/patch clinic service | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete clinic service | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Note:** Clinic services have unique names per tenant. Deletion prevented if doctor-service links exist.

---

## MODULE: Public SEO

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| View public clinic profile | — | — | — | — | — | — | — |
| View public doctors list | — | — | — | — | — | — | — |
| View public services | — | — | — | — | — | — | — |
| View public working hours | — | — | — | — | — | — | — |

> Public endpoints require NO authentication and NO `X-Tenant` header. Accessed via `/api/public/{slug}/...`.

---

## MODULE: Audit

| Action | SuperAdmin | ClinicOwner | ClinicManager | Receptionist | Doctor | Nurse | Patient |
|--------|-----------|-------------|---------------|-------------|--------|-------|--------|
| View platform audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View tenant audit logs | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own login history | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

*Updated per phase as new modules are implemented.*
