# Patch-Ready Change Spec (Option 2) - 2026-04-06

## Intent
This document is the implementation blueprint for the reviewed gaps.
It is intentionally patch-oriented: exact files, signature diffs, endpoint diffs, DTO diffs, and test additions.

## Baseline
- Build and tests currently pass.
- Endpoint parity currently passes.
- The required fixes are behavior and contract consistency fixes.

## Patch Set A (P0) - Remove Broken Patient Credit Calls From Patient Profile

### Why
Patient profile calls deprecated staff-only credit endpoints, causing invalid patient flow.

### Endpoint Contract Diff
Before:
- Frontend calls `GET /api/clinic/patient-credits/{patientId}/balance`
- Frontend calls `GET /api/clinic/patient-credits/{patientId}/history`

After:
- Patient profile frontend no longer calls either endpoint.
- Backend endpoints remain unchanged (still 410 for compatibility).

### DTO Contract Diff
Frontend:
- Remove unused `ICreditBalance` and `ICreditHistoryItem` from patient-app frontend contracts.

Backend:
- No DTO shape change in this patch set.

### Files And Exact Edits
1) `Frontend/actions/patient-app/profile.ts`
- Remove imports: `ICreditBalance`, `ICreditHistoryItem`.
- Remove functions:
  - `getPatientCreditBalanceAction`
  - `getPatientCreditHistoryAction`

Patch sketch:
```ts
-import {
-  ICreditBalance,
-  ICreditHistoryItem,
-  IPatientPartnerOrderTimelineItem,
-  IPatientSummary,
-} from '@/types/patient-app'
+import { IPatientPartnerOrderTimelineItem, IPatientSummary } from '@/types/patient-app'

-export async function getPatientCreditBalanceAction(...) { ... }
-export async function getPatientCreditHistoryAction(...) { ... }
```

2) `Frontend/app/[tenantSlug]/patient/(main)/profile/page.tsx`
- Remove import `getPatientCreditBalanceAction`.
- Remove icons used only by wallet card: `Wallet`, `ShieldCheck`.
- Remove balance SWR query and `balance` variable.
- Remove full wallet card JSX block.

Patch sketch:
```tsx
-import { getPatientProfileAppAction, getPatientCreditBalanceAction } from '@/actions/patient-app/profile'
+import { getPatientProfileAppAction } from '@/actions/patient-app/profile'

-import { User, Phone, Calendar, MapPin, Wallet, ShieldCheck, Info, LucideIcon } from 'lucide-react'
+import { User, Phone, Calendar, MapPin, Info, LucideIcon } from 'lucide-react'

-const { data: balanceRes, isLoading: loadingBalance } = useSWR(...)
-const balance = balanceRes?.data?.balance || 0

-{/* wallet card block */}
```

3) `Frontend/types/patient-app.ts`
- Remove `ICreditBalance` and `ICreditHistoryItem` interfaces if no remaining usage.

### Acceptance
- Opening patient profile does not call `/api/clinic/patient-credits/*`.
- Patient profile renders without wallet errors.

## Patch Set B (P1) - Normalize Booking Source Semantics

### Why
Booking filters and queue flags currently only treat `VisitSource.Booking` as booking, while enum includes additional booking sources.

### Endpoint Contract Diff
No path changes.

Behavior change:
- `GET /api/clinic/visits/my` with `isBooking=true` includes all booking-origin sources.
- Queue ticket DTO `isFromBooking` is true for all booking-origin sources.

### DTO Contract Diff
No DTO shape change.

Semantic change:
- `QueueTicketDto.IsFromBooking` means "any booking-origin source".

### Files And Exact Edits
1) `src/EliteClinic.Application/Features/Clinic/Services/QueueService.cs`
- Add helper:
```csharp
private static bool IsBookingSource(VisitSource source)
{
    return source == VisitSource.Booking
        || source == VisitSource.ConsultationBooking
        || source == VisitSource.PatientSelfServiceBooking;
}
```
- Replace:
```csharp
-IsFromBooking = t.Source == VisitSource.Booking,
+IsFromBooking = IsBookingSource(t.Source),

-ticket.IsFromBooking = visitInfo.Source == VisitSource.Booking;
+ticket.IsFromBooking = IsBookingSource(visitInfo.Source);
```

2) `src/EliteClinic.Application/Features/Clinic/Services/VisitService.cs`
- Replace `IsBooking` filter predicate:
```csharp
-query = request.IsBooking.Value
-    ? query.Where(v => v.Source == VisitSource.Booking)
-    : query.Where(v => v.Source != VisitSource.Booking);
+query = request.IsBooking.Value
+    ? query.Where(v => v.Source == VisitSource.Booking
+        || v.Source == VisitSource.ConsultationBooking
+        || v.Source == VisitSource.PatientSelfServiceBooking)
+    : query.Where(v => v.Source != VisitSource.Booking
+        && v.Source != VisitSource.ConsultationBooking
+        && v.Source != VisitSource.PatientSelfServiceBooking);
```

### Acceptance
- Booking counts align with reports service logic.
- Doctor `isBooking=true` filter includes consultation-booking and self-service-booking visits.

## Patch Set C (P1) - Direct Refund Model Consistency

### Why
Current code still creates/updates credit state in refund and auto-session-closure paths.

### C1: Non-Breaking Cleanup (recommended first)

#### Endpoint Contract Diff
No path removals in C1.

Behavior diff:
- `POST /api/clinic/invoices/{id}/refund` no longer increases `CreditAmount`.
- Auto session closure stops writing new patient-credit balances/transactions and performs refund-style settlement.

#### DTO Contract Diff
No shape change in C1.

Notes:
- Keep existing fields temporarily for compatibility.

#### Files And Exact Edits
1) `src/EliteClinic.Application/Features/Clinic/Services/InvoiceService.cs`
- In `RefundPaymentAsync`:
  - Remove partial-refund credit accumulation.
  - Always keep `CreditAmount = 0` and `CreditIssuedAt = null` for new writes.

Patch sketch:
```csharp
if (isFullRefund)
{
    invoice.Amount = 0;
    invoice.PaidAmount = 0;
    invoice.RemainingAmount = 0;
    invoice.CreditAmount = 0;
    invoice.CreditIssuedAt = null;
    invoice.HasPendingSettlement = false;
    invoice.PendingSettlementAmount = 0;
}
else
{
    invoice.RemainingAmount = Math.Max(invoice.Amount - invoice.PaidAmount, 0m);
    invoice.CreditAmount = 0;
    invoice.CreditIssuedAt = null;
}
```

2) `src/EliteClinic.Infrastructure/Services/SessionClosureBackgroundService.cs`
- Replace credit issuance branch with refund-style payment creation (idempotent guard required).
- Remove writes to:
  - `PatientCreditBalances`
  - `PatientCreditTransactions`

Patch sketch:
```csharp
var alreadyAutoRefunded = await dbContext.Payments.IgnoreQueryFilters()
    .AnyAsync(p => !p.IsDeleted
        && p.TenantId == session.TenantId
        && p.InvoiceId == invoice.Id
        && p.Amount < 0
        && p.PaymentMethod == "AutoRefundSessionClosure", cancellationToken);

if (!alreadyAutoRefunded)
{
    dbContext.Payments.Add(new Payment
    {
        TenantId = session.TenantId,
        InvoiceId = invoice.Id,
        Amount = -invoice.PaidAmount,
        PaymentMethod = "AutoRefundSessionClosure",
        Notes = "Auto refund issued by session closure for unserved paid ticket",
        PaidAt = DateTime.UtcNow
    });
}

invoice.Amount = 0;
invoice.PaidAmount = 0;
invoice.RemainingAmount = 0;
invoice.Status = InvoiceStatus.Refunded;
invoice.CreditAmount = 0;
invoice.CreditIssuedAt = null;
```

3) `src/EliteClinic.Api/Program.cs`
- Remove DI registration if no active consumers remain:
```csharp
-builder.Services.AddScoped<IPatientCreditService, PatientCreditService>();
```

### C2: Breaking Cleanup (execute after C1 stabilizes)

#### Endpoint Contract Diff
Option A (safer external compatibility): keep `PatientCreditsController` returning 410.

Option B (strict removal): remove `api/clinic/patient-credits/*` routes and update Swagger/docs.

#### DTO Contract Diff
Backend DTO removals:
- `InvoiceDto`: remove `CreditAmount`, `CreditIssuedAt`.
- `ClinicSettingsDto`, `UpdateClinicSettingsRequest`, `PatchClinicSettingsRequest`: remove `RetainCreditOnNoShow`.

Frontend DTO removals:
- `Frontend/types/visit.ts` remove `creditAmount`, `creditIssuedAt` from `IInvoice`.

Domain/entity cleanup:
- Remove legacy credit columns/fields from `Invoice` and `ClinicSettings` in a migration.
- Remove `PatientCreditBalance` and `PatientCreditTransaction` usage and table references in DbContext when data migration is complete.

## Patch Set D (P1) - Inventory Branch Scope Enforcement For Doctor/Receptionist

### Why
Inventory list/get endpoints are role-open to Doctor/Receptionist but currently tenant-wide unless caller voluntarily passes `branchId`.

### Endpoint Contract Diff
No path changes.

Behavior change:
- `GET /api/clinic/inventory/items` and `GET /api/clinic/inventory/items/{itemId}` become branch-scoped for non-owner roles.

### DTO Contract Diff
No DTO shape change.

### Files And Exact Edits
1) `src/EliteClinic.Application/Features/Clinic/Services/IInventoryService.cs`
- Signature updates:
```csharp
-Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid itemId);
-Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, InventoryItemsQuery query);
+Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid callerUserId, Guid itemId);
+Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, Guid callerUserId, InventoryItemsQuery query);
```

2) `src/EliteClinic.Api/Controllers/InventoryController.cs`
- Add current user helper and pass caller id to service methods:
```csharp
private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

var result = await _inventoryService.ListItemsAsync(_tenantContext.TenantId, GetCurrentUserId(), query);
var result = await _inventoryService.GetItemByIdAsync(_tenantContext.TenantId, GetCurrentUserId(), itemId);
```

3) `src/EliteClinic.Application/Features/Clinic/Services/InventoryService.cs`
- Inject `IBranchAccessService`.
- In list/get methods:
  - Retrieve scoped branch ids via branch access service.
  - Apply scope filter if not owner/manager/superadmin.
  - If requested branch is out of scope, return access error.

Patch sketch:
```csharp
var scope = await _branchAccessService.GetScopedBranchIdsAsync(tenantId, callerUserId);
if (scope != null)
{
    if (query.BranchId.HasValue && !scope.Contains(query.BranchId.Value))
        return ApiResponse<PagedResult<InventoryItemDto>>.Error("Access denied for requested branch");

    q = q.Where(i => scope.Contains(i.BranchId));
}
```

## Test Additions (Patch-Ready)

### Backend Tests
1) `tests/EliteClinic.Tests/Phase3InventoryMarketplaceTests.cs`
- Add `Inventory_List_ShouldRespectBranchScope_ForDoctorLikeCaller`.
- Add `Inventory_GetById_ShouldRejectOutOfScopeBranch_ForDoctorLikeCaller`.

2) `tests/EliteClinic.Tests/QueueWithPaymentCompatibilityTests.cs`
- Add `QueueTicket_IsFromBooking_ShouldBeTrue_ForAllBookingSources`.

3) `tests/EliteClinic.Tests/Phase7BusinessTests.cs`
- Add `RefundPayment_ShouldNotIncreaseCreditAmount_OnPartialRefund`.
- Add `SessionClosure_ShouldCreateAutoRefund_NotCreditIssue`.

### Frontend Checks
No frontend test harness currently configured in scripts.
For now, validate via lint/build and runtime route checks.

## Execution Order
1) Apply Patch Set A (P0 hotfix).
2) Apply Patch Set B (booking semantics).
3) Apply Patch Set D (branch scope in inventory endpoints).
4) Apply Patch Set C1 (non-breaking direct-refund cleanup).
5) Stabilize, then execute Patch Set C2 (breaking cleanup + migration).

## Validation Commands
- `dotnet build EliteClinic.sln`
- `dotnet test EliteClinic.sln --no-build`
- `corepack pnpm -C Frontend lint`
- `corepack pnpm -C Frontend build`
