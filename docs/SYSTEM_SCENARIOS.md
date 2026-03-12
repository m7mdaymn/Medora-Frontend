# SYSTEM_SCENARIOS.md — Step-by-Step Workflow Scenarios

> **Version:** 6.0  
> **Last Updated:** 2026-02-08

---

## Scenario 1: Tenant Onboarding & Owner Setup

**Actor:** SuperAdmin  
**Goal:** Create a new clinic tenant with an auto-provisioned owner account.

### Steps

1. **SuperAdmin logs in** (no `X-Tenant` header needed):
   ```
   POST /api/auth/login
   Body: { "username": "superadmin", "password": "Admin@123456" }
   → Returns JWT token (no tenantId claim)
   ```

2. **Create tenant with owner auto-creation:**
   ```
   POST /api/platform/tenants
   Headers: Authorization: Bearer {token}
   Body: {
     "name": "Bright Smile Dental",
     "slug": "bright-smile",
     "ownerEmail": "owner@brightsmile.com",
     "ownerName": "Dr. Ahmed",
     "ownerUsername": "owner_bright",
     "ownerPassword": "Owner@123456",
     "ownerPhone": "0555000001"
   }
   ```
   **System automatically:**
   - Creates tenant record (Active status)
   - Creates default TenantFeatureFlags (all features off)
   - Creates default ClinicSettings (with default working hours)
   - Creates ClinicOwner user account (owner_bright)
   - Assigns "ClinicOwner" role to the user
   - On failure: full rollback of all created entities

3. **Owner logs in for first time:**
   ```
   POST /api/auth/login
   Headers: X-Tenant: bright-smile
   Body: { "username": "owner_bright", "password": "Owner@123456" }
   → Returns JWT with tenantId claim
   ```

4. **Owner configures clinic settings:**
   ```
   PUT /api/clinic/settings
   Headers: Authorization: Bearer {owner_token}, X-Tenant: bright-smile
   Body: { "clinicName": "Bright Smile Dental", "clinicPhone": "0555000001", ... }
   ```

---

## Scenario 2: Daily Clinic Opening — Walk-in Patient Flow

**Actors:** ClinicOwner/ClinicManager/Receptionist → Doctor  
**Goal:** Open a queue session, register walk-in patient, issue ticket, complete visit.

### Steps

1. **Receptionist opens queue session for a doctor:**
   ```
   POST /api/clinic/queue-sessions/open
   Body: { "doctorId": "{doctorGuid}", "notes": "Morning session" }
   ```
   - If the doctor has confirmed online bookings for today, they are **auto-converted to waiting tickets**.
   - Response includes count: `"3 booking(s) auto-converted to tickets"`

2. **Walk-in patient arrives — register if new:**
   ```
   POST /api/clinic/patients
   Body: { "name": "Ali Hassan", "phone": "0500001234", "dateOfBirth": "1985-03-15", "gender": "Male" }
   ```
   - System checks for duplicates (same phone + name = 409 Conflict)
   - Auto-creates user account with generated credentials
   - WhatsApp message (WA-001) sent with login credentials

3. **Issue queue ticket:**
   ```
   POST /api/clinic/queue-tickets/issue
   Body: { "sessionId": "{sessionGuid}", "patientId": "{patientGuid}", "doctorId": "{doctorGuid}" }
   ```

4. **Doctor calls next patient:**
   ```
   POST /api/clinic/queue-tickets/{ticketId}/call
   → Patient gets WA-004 notification ("Your turn")
   ```

5. **Doctor starts visit:**
   ```
   POST /api/clinic/queue-tickets/{ticketId}/start-visit
   → Returns { visitId, ticket } — idempotent (calling again returns same visitId)
   ```

6. **Doctor records clinical data:**
   ```
   POST /api/clinic/prescriptions
   Body: { "visitId": "{visitId}", "medicationName": "Amoxicillin", "dosage": "500mg", ... }
   
   POST /api/clinic/lab-requests
   Body: { "visitId": "{visitId}", "title": "Blood Test", "type": 0 }   // 0=Lab, 1=Imaging
   ```

7. **Doctor finishes visit:**
   ```
   POST /api/clinic/queue-tickets/{ticketId}/finish
   → Ticket marked Completed, Visit marked Completed
   → If ticket was created from a booking, the booking is also marked Completed
   ```

---

## Scenario 3: Online Booking → Session Opening → Auto-Ticket

**Actors:** Patient → Receptionist → Doctor  
**Goal:** Patient books online, booking auto-converts to ticket when session opens.

### Steps

1. **Patient books appointment online:**
   ```
   POST /api/clinic/bookings
   Headers: Authorization: Bearer {patient_token}, X-Tenant: bright-smile
   Body: { "doctorId": "{doctorGuid}", "bookingDate": "2026-03-15", "bookingTime": "10:00" }
   ```
   - Requires OnlineBooking feature flag AND BookingEnabled in ClinicSettings
   - Validates doctor exists and is enabled
   - Checks duplicate slot (409 Conflict if same doctor+date+time)
   - Status: Confirmed

2. **On booking day, Receptionist opens session:**
   ```
   POST /api/clinic/queue-sessions/open
   Body: { "doctorId": "{doctorGuid}" }
   ```
   **Automatic conversion:**
   - System queries all Confirmed bookings for this doctor on today's date
   - For each booking (ordered by time), a waiting ticket is created
   - Booking.QueueTicketId is linked to the new ticket
   - Response: `"Queue session opened successfully. 2 booking(s) auto-converted to tickets."`

3. **Patient can check their ticket status:**
   ```
   GET /api/clinic/queue-board/my-ticket
   → Shows ticket number, position, estimated wait
   ```

4. **Normal visit flow continues (call → start-visit → finish)**

5. **When ticket is finished, booking is auto-completed:**
   - Booking status changes from Confirmed → Completed
   - Ensures booking is no longer counted as active

---

## Scenario 4: Ticket Issuance with Upfront Payment

**Actor:** Receptionist/ClinicManager  
**Goal:** Issue a ticket and collect payment before the visit starts.

### Steps

1. **Issue ticket with payment:**
   ```
   POST /api/clinic/queue-tickets/issue-with-payment
   Body: {
     "sessionId": "{sessionGuid}",
     "patientId": "{patientGuid}",
     "doctorId": "{doctorGuid}",
     "doctorServiceId": "{serviceGuid}",
     "paymentAmount": 150.00,
     "paymentMethod": "Cash",
     "paymentNotes": "Consultation fee"
   }
   ```
   **System creates in single transaction:**
   - QueueTicket (Waiting status)
   - Visit (Open status, linked to ticket)
   - Invoice (Paid/PartiallyPaid based on amount vs service price)
   - Payment record

2. **Doctor starts visit (visit already exists):**
   ```
   POST /api/clinic/queue-tickets/{ticketId}/start-visit
   → Reuses existing Visit record created during payment flow
   → Returns same visitId
   ```

3. **Doctor adds clinical records and finishes as normal.**

---

## Scenario 5: Clinic Services & Doctor Service Pricing

**Actor:** ClinicOwner/ClinicManager  
**Goal:** Set up clinic-wide service catalog and configure per-doctor pricing.

### Steps

1. **Create clinic-level service:**
   ```
   POST /api/clinic/services
   Headers: Authorization: Bearer {owner_token}
   Body: {
     "name": "Root Canal Treatment",
     "description": "Endodontic therapy for damaged teeth",
     "defaultPrice": 500.00,
     "defaultDurationMinutes": 60
   }
   ```
   - Name must be unique per tenant (409 Conflict if duplicate)

2. **List clinic services:**
   ```
   GET /api/clinic/services?activeOnly=true
   → Paginated list of all active services
   ```

3. **Patch a service (partial update):**
   ```
   PATCH /api/clinic/services/{serviceId}
   Body: { "defaultPrice": 550.00 }
   → Only updates price, keeps name/description/duration unchanged
   ```

4. **Configure doctor-specific pricing** (via doctor services):
   ```
   POST /api/clinic/doctors/{doctorId}/services
   Body: { "clinicServiceId": "{serviceGuid}", "price": 600.00 }
   ```

5. **Delete clinic service** (soft-delete):
   ```
   DELETE /api/clinic/services/{serviceId}
   → 400 error if any doctor has linked this service (must unlink first)
   ```

---

## Scenario 6: Partial Updates (PATCH) Across Resources

**Actor:** Various (depends on resource)  
**Goal:** Update individual fields without sending the full object.

### Available PATCH Endpoints

| Resource | Endpoint | Allowed Roles |
|----------|----------|--------------|
| Patient | `PATCH /api/clinic/patients/{id}` | ClinicOwner, ClinicManager, Receptionist, SuperAdmin |
| Doctor | `PATCH /api/clinic/doctors/{id}` | ClinicOwner, SuperAdmin |
| Staff | `PATCH /api/clinic/staff/{id}` | ClinicOwner, SuperAdmin |
| Invoice | `PATCH /api/clinic/invoices/{id}` | ClinicOwner, ClinicManager, SuperAdmin |
| Clinic Settings | `PATCH /api/clinic/settings` | ClinicOwner, SuperAdmin |
| Clinic Service | `PATCH /api/clinic/services/{id}` | ClinicOwner, ClinicManager, SuperAdmin |

### Example — Update only patient phone:
```
PATCH /api/clinic/patients/{patientId}
Body: { "phone": "0500009999" }
→ Only phone is updated. Name, gender, address, notes remain unchanged.
```

### Example — Update invoice amount (with validation):
```
PATCH /api/clinic/invoices/{invoiceId}
Body: { "amount": 200.00 }
→ Validates: amount > 0, amount >= paidAmount
→ Recalculates remainingAmount and status automatically
```

### How it works:
- All PATCH DTOs have **nullable** fields
- Only non-null fields in the request body are applied
- Null/missing fields are **ignored** (not set to null)
- Full validation still runs on provided values
- Returns the updated resource

---

## Scenario 7: End-of-Day Session Closure

**Actor:** System (automatic) + ClinicOwner/ClinicManager (manual)  
**Goal:** Close all queue sessions and mark remaining tickets as no-show.

### Automatic Closure (Background Service)

The `SessionClosureBackgroundService` runs every 30 minutes and automatically closes sessions that are past end-of-day based on clinic working hours.

### Manual Closure

1. **Close a specific session:**
   ```
   POST /api/clinic/queue-sessions/{sessionId}/close
   → Cannot close if any tickets are InVisit (must complete or skip them first)
   → Remaining Waiting/Called tickets are marked as NoShow
   ```

2. **Close all sessions for a date (admin batch):**
   ```
   POST /api/clinic/queue-sessions/close-all
   Body: { "date": "2026-03-15" }
   → Closes all active sessions for the tenant on or before the given date
   → All remaining Waiting/Called tickets marked as NoShow
   → Returns count of sessions closed
   ```

### Protections:
- InVisit tickets block session closure (must finish or skip first)
- Already-closed sessions are idempotent (no error)
- NoShow tickets are visible in reports for follow-up

---

## Cross-Cutting Concerns

### Duplicate Prevention
- **Patient:** Unique (TenantId, Phone, Name) — returns 409 Conflict
- **Booking:** Unique (DoctorId, BookingDate, BookingTime) — returns 409 Conflict  
- **Clinic Service:** Unique (TenantId, Name) per active records — returns 409 Conflict

### Owner Protection
- ClinicManager cannot disable/enable users with the ClinicOwner role
- Applies to both `POST /api/clinic/staff/{id}/disable` and `POST /api/clinic/doctors/{id}/disable`
- Only ClinicOwner and SuperAdmin can manage other owners

### Nurse Role (Read-Only Clinical Support)
- Can view: patients, queue board, doctors, clinic settings, clinic services
- Cannot modify any data or access medical records
- Created via `POST /api/clinic/staff` with `"role": "Nurse"`

### Lab Request Type Filtering
- `GET /api/clinic/lab-requests/by-visit/{visitId}?type=0` — Lab requests only
- `GET /api/clinic/lab-requests/by-visit/{visitId}?type=1` — Imaging requests only
- Omit `type` parameter — returns all requests
