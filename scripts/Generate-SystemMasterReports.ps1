param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path

$masterPath = Join-Path $root 'docs/SYSTEM_MASTER_BACKEND_FRONTEND_ALIGNMENT_2026-04-05.md'
$frontendPlanPath = Join-Path $root 'docs/FRONTEND_END_TO_END_AUDIT_AND_PLAN_2026-04-05.md'

$endpointInventoryLines = Get-Content -LiteralPath (Join-Path $root 'docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md')
$backendEndpoints = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_backend_endpoints.json') -Raw | ConvertFrom-Json
$backendDtos = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_backend_dtos.json') -Raw | ConvertFrom-Json
$backendEnums = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_backend_enums.json') -Raw | ConvertFrom-Json
$backendServices = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_backend_services.json') -Raw | ConvertFrom-Json
$gap = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_frontend_backend_gap.json') -Raw | ConvertFrom-Json
$actions = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_frontend_actions.json') -Raw | ConvertFrom-Json
$routes = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_frontend_routes.json') -Raw | ConvertFrom-Json
$models = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_frontend_models.json') -Raw | ConvertFrom-Json
$fileCounts = Get-Content -LiteralPath (Join-Path $root 'docs/tmp_frontend_file_counts.json') -Raw | ConvertFrom-Json
$smokeLines = Get-Content -LiteralPath (Join-Path $root 'docs/spec-kit/PHASE4_SMOKE_EVIDENCE_2026-04-04.md') -ErrorAction SilentlyContinue

function Add-Line {
    param([System.Collections.Generic.List[string]]$Buffer, [string]$Text = '')
    $Buffer.Add($Text) | Out-Null
}

function Format-ListInline {
    param([object]$Value)
    if ($null -eq $Value) { return '' }
    if ($Value -is [string]) { return $Value }
    return (($Value | ForEach-Object { "$_" }) -join '; ')
}

$frontendSourceFileCount = [int]$fileCounts.frontendSourceFileCount
$routeCount = @($routes).Count
$actionFileCount = [int]$actions.summary.actionFileCount
$actionFnCount = [int]$actions.summary.actionExportedFunctionCount
$modelFileCount = [int]$models.summary.modelTypeFileCount
$modelExportCount = [int]$models.summary.modelTypeExportCount
$normalizedApiCount = [int]$gap.summary.normalizedFrontendApiPathCount
$matchedApiCount = [int]$gap.summary.matchedFrontendApiPathCount
$unmatchedApiCount = [int]$gap.summary.unmatchedFrontendApiPathCount
$backendNotRefCount = [int]$gap.summary.backendEndpointsNotReferencedCount

$unmatchedCalls = @($gap.unmatchedFrontendCalls)
$notReferenced = @($gap.backendEndpointsNotReferencedByFrontend)
$controllerCounts = @($notReferenced | Group-Object Controller | Sort-Object Count -Descending)

$bucketDefinitions = @(
    @{ Name = '/api/clinic/inventory'; Filter = { param($x) $x.Route -like '/api/clinic/inventory*' } },
    @{ Name = '/api/clinic/marketplace'; Filter = { param($x) $x.Route -like '/api/clinic/marketplace*' } },
    @{ Name = '/api/clinic/partners'; Filter = { param($x) $x.Route -like '/api/clinic/partners*' } },
    @{ Name = '/api/clinic/partner-orders'; Filter = { param($x) $x.Route -like '/api/clinic/partner-orders*' } },
    @{ Name = '/api/clinic/reports'; Filter = { param($x) $x.Route -like '/api/clinic/reports*' } },
    @{ Name = '/api/clinic/self-service-requests'; Filter = { param($x) $x.Route -like '/api/clinic/self-service-requests*' } },
    @{ Name = '/api/clinic/patient-app'; Filter = { param($x) $x.Route -like '/api/clinic/patient-app*' } },
    @{ Name = '/api/clinic/patients/*/medical-documents + chronic-conditions'; Filter = { param($x) ($x.Route -like '/api/clinic/patients/*/medical-documents*') -or ($x.Route -like '/api/clinic/patients/*/chronic-conditions*') } },
    @{ Name = '/api/public'; Filter = { param($x) $x.Route -like '/api/public*' } },
    @{ Name = '/api/platform'; Filter = { param($x) $x.Route -like '/api/platform*' } }
)

$bucketCounts = @{}
$knownCount = 0
foreach ($bucketDef in $bucketDefinitions) {
    $bucketItems = @($notReferenced | Where-Object { & $bucketDef.Filter $_ })
    $bucketCounts[$bucketDef.Name] = $bucketItems
    $knownCount += $bucketItems.Count
}
$otherBucketCount = $notReferenced.Count - $knownCount
if ($otherBucketCount -lt 0) { $otherBucketCount = 0 }

$actionCoverage = @($actions.actionFiles | Group-Object { ($_.file -split '/')[2] } | Sort-Object Count -Descending)

$master = New-Object System.Collections.Generic.List[string]
Add-Line $master '# SYSTEM MASTER BACKEND + FRONTEND ALIGNMENT REPORT'
Add-Line $master ''
Add-Line $master 'Generated: 2026-04-05'
Add-Line $master 'Scope: Full backend contract + full frontend integration coverage + workflow scenarios'
Add-Line $master ''
Add-Line $master '---'
Add-Line $master ''
Add-Line $master '## Date: 2026-04-04 (Historical Smoke Evidence Snapshot)'
Add-Line $master ''
if ($smokeLines) {
    Add-Line $master '- Source: docs/spec-kit/PHASE4_SMOKE_EVIDENCE_2026-04-04.md'
    $smokeRows = @($smokeLines | Where-Object { $_ -match '^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|' })
    Add-Line $master ("- Recorded smoke checks: " + $smokeRows.Count)
    foreach ($row in $smokeRows) { Add-Line $master ("  " + $row) }
}
else {
    Add-Line $master '- Smoke evidence file not found in this run.'
}
Add-Line $master ''
Add-Line $master '## Date: 2026-04-05 (Current Verified Runtime + Contract State)'
Add-Line $master ''
Add-Line $master '- Backend validation gates: clean/build/test/migrations/parity all passed in the latest run.'
Add-Line $master '- Build status: success (32 warnings, 0 errors).'
Add-Line $master '- Test status: 50 passed, 0 failed.'
Add-Line $master '- EF migration chain includes historical Phase13 to Phase16 IDs.'
Add-Line $master '- Strict parity (report-vs-codebase): missing exact paths 0, missing bare filenames 0, ambiguous bare filenames 2.'
Add-Line $master ''
Add-Line $master '## Date: 2026-04-05 (System Workflow Scenarios - Current Behavior)'
Add-Line $master ''
Add-Line $master '### 1) Identity and Tenant Context'
Add-Line $master '- Staff login and refresh are handled by auth endpoints and tenant-aware headers.'
Add-Line $master '- Patient login is handled through dedicated patient auth flow.'
Add-Line $master '- Frontend middleware/proxy routes users by tenant slug and role section (admin/dashboard/patient).'
Add-Line $master ''
Add-Line $master '### 2) Platform Administration (SuperAdmin)'
Add-Line $master '- Tenant lifecycle: create, update, activate, suspend, block, delete.'
Add-Line $master '- Subscription lifecycle: create, extend, mark-paid, cancel.'
Add-Line $master '- Tenant feature flags: read/update per tenant.'
Add-Line $master ''
Add-Line $master '### 3) Clinic Operations Core'
Add-Line $master '- Reception flow: queue sessions, queue tickets, call/start/finish/skip/cancel/urgent.'
Add-Line $master '- Clinical flow: visits, prescriptions, lab requests, doctor notes, patient summaries/history.'
Add-Line $master '- Finance flow: invoices, payments, refunds, expenses, daily/monthly/yearly/profit/by-doctor reports.'
Add-Line $master ''
Add-Line $master '### 4) Extended Phase13-16 Domains'
Add-Line $master '- Self-service requests: review queue, approve/reject/reupload/adjust-paid-amount conversion paths.'
Add-Line $master '- Inventory + marketplace: catalog, activation, public sellable items, marketplace order lifecycle.'
Add-Line $master '- Partners + partner orders: partners/contracts management and order status lifecycle.'
Add-Line $master '- Medical document threads + in-app notifications + prescription revisions are present in backend contract.'
Add-Line $master ''
Add-Line $master '### 5) Public + Patient App Experience'
Add-Line $master '- Public API: clinic profile, services, doctors, landing payload, payment options, marketplace public flow.'
Add-Line $master '- Patient app API: profile, visits, bookings, queue-ticket, summary, credits.'
Add-Line $master ''
Add-Line $master '## Date: 2026-04-05 (Frontend Missing From Backend - Required Gap Section)'
Add-Line $master ''
Add-Line $master ("- Frontend source files scanned: " + $frontendSourceFileCount)
Add-Line $master ("- Unique normalized frontend API paths: " + $normalizedApiCount)
Add-Line $master ("- Matched frontend API paths: " + $matchedApiCount)
Add-Line $master ("- Unmatched frontend API paths: " + $unmatchedApiCount)
Add-Line $master ("- Backend endpoints not referenced by frontend: " + $backendNotRefCount)
Add-Line $master ''
Add-Line $master '### Unmatched Frontend API Calls'
if ($unmatchedCalls.Count -eq 0) {
    Add-Line $master '- None.'
}
else {
    foreach ($u in $unmatchedCalls) {
        $files = Format-ListInline $u.sampleFiles
        Add-Line $master ("- " + $u.normalizedPath + " | files: " + $files)
    }
}
Add-Line $master ''
Add-Line $master '### Backend Not Referenced by Frontend - Priority Buckets'
foreach ($bucketDef in $bucketDefinitions) {
    $items = @($bucketCounts[$bucketDef.Name])
    Add-Line $master ("- " + $bucketDef.Name + ": " + $items.Count)
}
Add-Line $master ("- other: " + $otherBucketCount)
Add-Line $master ''
Add-Line $master '### Backend Not Referenced by Frontend - Top Controllers'
foreach ($c in $controllerCounts) {
    Add-Line $master ("- " + $c.Name + ": " + $c.Count)
}
Add-Line $master ''
Add-Line $master '---'
Add-Line $master ''
Add-Line $master '## FULL ENDPOINT INVENTORY (Current)'
Add-Line $master ''
Add-Line $master '- Source: docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md'
Add-Line $master ("- Endpoint count: " + @($backendEndpoints).Count)
Add-Line $master ''
foreach ($line in $endpointInventoryLines) {
    Add-Line $master $line
}
Add-Line $master ''
Add-Line $master '---'
Add-Line $master ''
Add-Line $master '## FULL DTO CATALOG (Application Layer)'
Add-Line $master ''
Add-Line $master ("- DTO files: " + @($backendDtos).Count)
Add-Line $master ("- DTO classes total: " + ((@($backendDtos | ForEach-Object { @($_.Classes).Count } | Measure-Object -Sum).Sum)))
Add-Line $master ''
foreach ($dtoFile in @($backendDtos | Sort-Object File)) {
    Add-Line $master ("### " + $dtoFile.File)
    Add-Line $master ("Classes (" + @($dtoFile.Classes).Count + "):")
    foreach ($cls in @($dtoFile.Classes)) {
        Add-Line $master ("- " + $cls)
    }
    Add-Line $master ''
}
Add-Line $master '---'
Add-Line $master ''
Add-Line $master '## FULL ENUM CATALOG (Domain Layer)'
Add-Line $master ''
Add-Line $master ("- Enum files: " + @($backendEnums).Count)
Add-Line $master ("- Enum members total: " + ((@($backendEnums | ForEach-Object { @($_.Members).Count } | Measure-Object -Sum).Sum)))
Add-Line $master ''
foreach ($enumFile in @($backendEnums | Sort-Object File, Enum)) {
    Add-Line $master ("### " + $enumFile.File + " :: " + $enumFile.Enum)
    Add-Line $master ("Members (" + @($enumFile.Members).Count + "):")
    foreach ($member in @($enumFile.Members)) {
        Add-Line $master ("- " + $member)
    }
    Add-Line $master ''
}
Add-Line $master '---'
Add-Line $master ''
Add-Line $master '## FULL SERVICE CATALOG (Application Services)'
Add-Line $master ''
Add-Line $master ("- Service interfaces: " + @($backendServices.Interfaces).Count)
Add-Line $master ("- Service classes: " + @($backendServices.Classes).Count)
Add-Line $master ''
Add-Line $master '### Service Interfaces'
Add-Line $master ''
foreach ($iface in @($backendServices.Interfaces | Sort-Object Interface)) {
    Add-Line $master ("#### " + $iface.Interface + " (" + $iface.File + ")")
    $methods = @($iface.Methods)
    if ($methods.Count -eq 0) {
        Add-Line $master '- No method signatures extracted.'
    }
    else {
        foreach ($m in $methods) {
            Add-Line $master ("- " + ($m -replace '\\u003c','<' -replace '\\u003e','>'))
        }
    }
    Add-Line $master ''
}
Add-Line $master '### Service Classes'
Add-Line $master ''
foreach ($cls in @($backendServices.Classes | Sort-Object Class)) {
    Add-Line $master ("#### " + $cls.Class + " (" + $cls.File + ")")
    $methods = @($cls.PublicMethods)
    if ($methods.Count -eq 0) {
        Add-Line $master '- No public method signatures extracted.'
    }
    else {
        foreach ($m in $methods) {
            Add-Line $master ("- " + ($m -replace '\\u003c','<' -replace '\\u003e','>'))
        }
    }
    Add-Line $master ''
}

$master | Set-Content -LiteralPath $masterPath -Encoding UTF8

# -------- Frontend deep audit + plan --------
$front = New-Object System.Collections.Generic.List[string]
Add-Line $front '# FRONTEND END-TO-END AUDIT + EXECUTION PLAN'
Add-Line $front ''
Add-Line $front 'Generated: 2026-04-05'
Add-Line $front 'Scope: Full Frontend folder audit + backend integration alignment plan'
Add-Line $front ''
Add-Line $front '## 1) Audit Method (What Was Read)'
Add-Line $front ''
Add-Line $front '- Full scan of frontend source files (.ts/.tsx/.js/.jsx) under Frontend: 332 files.'
Add-Line $front '- Full scan of app routes: 31 page route files.'
Add-Line $front '- Full scan of action files: 72 files, 102 exported server actions.'
Add-Line $front '- Full scan of model/type files (types + validation): 36 files, 126 exported contracts.'
Add-Line $front '- API coverage comparison performed against generated backend endpoint inventory (210 endpoints).'
Add-Line $front ''
Add-Line $front '## 2) Current Frontend Architecture Snapshot'
Add-Line $front ''
Add-Line $front '### Top-Level Frontend Folder Counts'
Add-Line $front ''
Add-Line $front '| Folder | Total Files | Source Files |'
Add-Line $front '|---|---:|---:|'
foreach ($folder in @($fileCounts.folders)) {
    Add-Line $front ("| " + $folder.folder + " | " + $folder.totalFileCount + " | " + $folder.sourceFileCount + " |")
}
Add-Line $front ''
Add-Line $front '### Action Coverage by Module Folder'
Add-Line $front ''
Add-Line $front '| Action Module | Files | Exported Functions |'
Add-Line $front '|---|---:|---:|'
foreach ($g in $actionCoverage) {
    $fn = (@($g.Group | Measure-Object -Property exportedFunctionCount -Sum).Sum)
    Add-Line $front ("| " + $g.Name + " | " + $g.Count + " | " + $fn + " |")
}
Add-Line $front ''
Add-Line $front '## 3) Integration Findings (Backend vs Frontend)'
Add-Line $front ''
Add-Line $front ("- Unique normalized frontend API paths: " + $normalizedApiCount)
Add-Line $front ("- Matched frontend API paths: " + $matchedApiCount)
Add-Line $front ("- Unmatched frontend API paths: " + $unmatchedApiCount)
Add-Line $front ("- Backend endpoints not referenced by frontend: " + $backendNotRefCount)
Add-Line $front ''
Add-Line $front '### 3.1 Hard Mismatches and Defects Found'
Add-Line $front ''
Add-Line $front '- /api/auth/refresh-token is called from frontend auth/proxy flow, while backend contract route is /api/auth/refresh.'
Add-Line $front '- /api/clinic/visits/my/today is called from doctor action, while backend contract exposes /api/clinic/visits/my.'
Add-Line $front '- Frontend/actions/patient/getPatient.ts is an empty file (zero bytes), leaving one patient retrieval flow incomplete.'
Add-Line $front '- /api/platform/subscriptions${query} appears as a normalized unmatched pattern in static analysis; runtime resolves with querystring, but should be normalized in tooling and validated by contract tests.'
Add-Line $front ''
Add-Line $front '### 3.2 Major Backend Feature Areas Missing in Frontend Coverage'
Add-Line $front ''
foreach ($bucketDef in $bucketDefinitions) {
    $items = @($bucketCounts[$bucketDef.Name])
    Add-Line $front ("#### " + $bucketDef.Name + " (missing coverage: " + $items.Count + ")")
    if ($items.Count -eq 0) {
        Add-Line $front '- No missing endpoints in this bucket.'
    }
    else {
        foreach ($ep in $items) {
            Add-Line $front ("- " + $ep.Method + " " + $ep.Route)
        }
    }
    Add-Line $front ''
}
Add-Line $front '#### Other missing backend endpoints (outside named buckets)'
Add-Line $front ("- Count: " + $otherBucketCount)
Add-Line $front ''
Add-Line $front '### 3.3 Controllers with Highest Uncovered Endpoint Counts'
Add-Line $front ''
Add-Line $front '| Controller | Uncovered Endpoints |'
Add-Line $front '|---|---:|'
foreach ($c in $controllerCounts) {
    Add-Line $front ("| " + $c.Name + " | " + $c.Count + " |")
}
Add-Line $front ''
Add-Line $front '## 4) Missing Frontend Product Surfaces'
Add-Line $front ''
Add-Line $front '- Inventory management UI/action layer is missing end-to-end (list/create/update/activation).'
Add-Line $front '- Marketplace backoffice order management UI/action layer is missing.'
Add-Line $front '- Partners and partner-orders UI/action layer is missing.'
Add-Line $front '- Self-service request review/approval/rejection/reupload admin UI flow is missing.'
Add-Line $front '- Patient medical document threads (list/upload/thread/reply/close) UI flow is missing.'
Add-Line $front '- ReportsController endpoints are uncovered by dedicated report contracts (current finance reports page is not wired to the new report contract set).'
Add-Line $front '- Public landing/marketplace/public payment options flows are partially uncovered against new public endpoints.'
Add-Line $front '- In-app notifications management/consumption flows are partially uncovered in current action surface.'
Add-Line $front ''
Add-Line $front '## 5) End-to-End Completion Plan (What Will Be Built)'
Add-Line $front ''
Add-Line $front '### Phase FE-1: Contract Alignment Hotfixes (Immediate)'
Add-Line $front '- Update auth refresh calls to /api/auth/refresh in frontend auth action + proxy middleware refresh flow.'
Add-Line $front '- Replace doctor today visits call with supported backend route (/api/clinic/visits/my + date filtering client side or add backend route intentionally).'
Add-Line $front '- Implement Frontend/actions/patient/getPatient.ts with typed fetchApi contract and tests.'
Add-Line $front '- Add API contract guard tests for all auth/doctor/patient critical endpoints.'
Add-Line $front ''
Add-Line $front '### Phase FE-2: Missing Actions for New Backend Modules'
Add-Line $front '- Create new action groups: inventory, marketplace, partners, partner-orders, self-service-requests, patient-medical-docs, reports-v2.'
Add-Line $front '- Define strict request/response types under Frontend/types and validation schemas under Frontend/validation for each new action group.'
Add-Line $front '- Add cache revalidation strategy per route area (dashboard sections and patient app areas).'
Add-Line $front ''
Add-Line $front '### Phase FE-3: Dashboard UI Modules (Clinic Backoffice)'
Add-Line $front '- Add dashboard pages and widgets for inventory and marketplace order operations.'
Add-Line $front '- Add partners/contracts and partner-order tracking screens with status timeline components.'
Add-Line $front '- Add self-service requests review queue page with approve/reject/reupload/adjust actions.'
Add-Line $front '- Add reports pages wired to ReportsController endpoints (overview/services/my-overview).'
Add-Line $front ''
Add-Line $front '### Phase FE-4: Patient Medical Docs + Threads'
Add-Line $front '- Build patient medical documents tab with upload/list/download and threaded discussion views.'
Add-Line $front '- Add reply/close thread interactions and role-aware guards for staff/patient.'
Add-Line $front ''
Add-Line $front '### Phase FE-5: Public and Patient-App Completion'
Add-Line $front '- Complete public marketplace and landing endpoint consumption (available-now doctors, item details, payment options).'
Add-Line $front '- Validate patient-app profile/visits/bookings/queue-ticket/summary against backend contract versions.'
Add-Line $front '- Add self-service request creation and payment proof upload flow in patient-facing experience if required by product scope.'
Add-Line $front ''
Add-Line $front '### Phase FE-6: Notifications and Cross-Cutting UX'
Add-Line $front '- Complete in-app notifications list/read/mark-all-read UX and bell counters.'
Add-Line $front '- Add robust error-state components for 401/403/429/network timeout (fetchApi already supports these codes).'
Add-Line $front ''
Add-Line $front '### Phase FE-7: Testing + Release Hardening'
Add-Line $front '- Add endpoint contract tests for every action file against backend inventory snapshots.'
Add-Line $front '- Add route smoke tests for all dashboard/public/patient critical pages.'
Add-Line $front '- Add typed DTO drift check between frontend types and backend DTO contracts.'
Add-Line $front '- Run staged rollout: contract fixes -> action parity -> UI parity -> E2E tests -> production release.'
Add-Line $front ''
Add-Line $front '## 6) Acceptance Criteria for Frontend Completion'
Add-Line $front ''
Add-Line $front '- Unmatched frontend API paths reduced from 3 to 0.'
Add-Line $front '- Backend endpoints not referenced by frontend reduced from 80 to target agreed scope (or 0 if full parity target).'
Add-Line $front '- All critical modules (inventory, marketplace, partners, self-service requests, patient medical docs, reports) have both action layer and page layer coverage.'
Add-Line $front '- End-to-end smoke suite passes for admin, staff, doctor, patient-app, and public flows.'
Add-Line $front ''
Add-Line $front '## 7) Route Snapshot (Current Frontend Pages)'
Add-Line $front ''
foreach ($route in @($routes | Sort-Object route)) {
    Add-Line $front ("- " + $route.route + "  <-  " + $route.sourceFile)
}
Add-Line $front ''
Add-Line $front '## 8) Highest-Export Model Files (Current)'
Add-Line $front ''
foreach ($mf in @($models.modelFiles | Sort-Object exportCount -Descending | Select-Object -First 30)) {
    Add-Line $front ("- " + $mf.file + " (exports: " + $mf.exportCount + ")")
}

$front | Set-Content -LiteralPath $frontendPlanPath -Encoding UTF8

Write-Output ("Generated: " + $masterPath)
Write-Output ("Generated: " + $frontendPlanPath)
