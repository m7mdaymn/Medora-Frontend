param(
    [string]$TenantSlug = "demo-clinic",
    [string]$ApiBaseUrl = "http://localhost:5094",
    [string]$FrontendBaseUrl = "http://localhost:3000",
    [string]$ReportPath = "docs/FULL_SYSTEM_IMPLEMENTATION_VERIFICATION_2026-04-06.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$reportFullPath = Join-Path $root $ReportPath

function Invoke-Http {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Url,
        [hashtable]$Headers,
        [string]$Body,
        [int]$TimeoutSec = 30,
        [switch]$NoRedirect
    )

    $statusCode = 0
    $content = ""
    $json = $null

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = $TimeoutSec
            ErrorAction = "Stop"
        }

        if ($Headers) {
            $params.Headers = $Headers
        }

        if ($NoRedirect) {
            $params.MaximumRedirection = 0
        }

        if ($PSBoundParameters.ContainsKey("Body")) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params
        $statusCode = [int]$response.StatusCode
        $content = [string]$response.Content
    }
    catch {
        $exception = $_.Exception
        $response = $exception.Response
        if ($response -and $response.StatusCode) {
            $statusCode = [int]$response.StatusCode.value__
            try {
                $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Dispose()
            }
            catch {
                $content = $exception.Message
            }
        }
        else {
            $content = $exception.Message
        }
    }

    $normalizedContent = $content
    if (-not [string]::IsNullOrEmpty($normalizedContent)) {
        $normalizedContent = $normalizedContent.TrimStart([char]0xFEFF, [char]0x200B, [char]0x00)
    }

    $trimmed = $normalizedContent.TrimStart()
    if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
        try {
            $json = $normalizedContent | ConvertFrom-Json -Depth 100
        }
        catch {
            $json = $null
        }
    }

    return [pscustomobject]@{
        StatusCode = $statusCode
        Content = $content
        Json = $json
    }
}

function Login-Staff {
    param(
        [string]$Username,
        [string]$Password,
        [bool]$IsSuperAdmin = $false
    )

    $headers = @{}
    if (-not $IsSuperAdmin) {
        $headers["X-Tenant"] = $TenantSlug
    }

    $payload = @{ username = $Username; password = $Password } | ConvertTo-Json -Compress
    return Invoke-Http -Method "POST" -Url "$ApiBaseUrl/api/auth/login" -Headers $headers -Body $payload
}

function Login-Patient {
    param(
        [string]$Username,
        [string]$Password
    )

    $headers = @{ "X-Tenant" = $TenantSlug }
    $payload = @{ username = $Username; password = $Password } | ConvertTo-Json -Compress
    return Invoke-Http -Method "POST" -Url "$ApiBaseUrl/api/auth/patient/login" -Headers $headers -Body $payload
}

function Get-RoleFromAuthText {
    param(
        [string]$AuthText,
        [hashtable]$TokenByRole
    )

    if ([string]::IsNullOrWhiteSpace($AuthText) -or $AuthText -eq "Anonymous" -or $AuthText -eq "Unspecified") {
        return $null
    }

    if ($AuthText.StartsWith("Roles:", [System.StringComparison]::OrdinalIgnoreCase)) {
        $rolesPart = $AuthText.Substring(6).Trim()
        $roles = $rolesPart.Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { $_.Trim() }
        foreach ($role in $roles) {
            if ($TokenByRole.ContainsKey($role)) {
                return $role
            }
        }
        return $null
    }

    if ($AuthText -eq "Authorized") {
        foreach ($fallback in @("ClinicOwner", "ClinicManager", "SuperAdmin")) {
            if ($TokenByRole.ContainsKey($fallback)) {
                return $fallback
            }
        }
    }

    return $null
}

function Resolve-EndpointRoute {
    param(
        [string]$Route,
        [hashtable]$Samples
    )

    return [regex]::Replace($Route, "\{([^}:]+)(:[^}]*)?\}", {
        param($m)

        $name = $m.Groups[1].Value.ToLowerInvariant()
        switch ($name) {
            "patientid" { return $Samples["patientId"] }
            "doctorid" { return $Samples["doctorId"] }
            "visitid" { return $Samples["visitId"] }
            "invoiceid" { return $Samples["invoiceId"] }
            "sessionid" { return $Samples["sessionId"] }
            "ticketid" { return $Samples["ticketId"] }
            "partnerid" { return $Samples["partnerId"] }
            "orderid" { return $Samples["orderId"] }
            "itemid" { return $Samples["itemId"] }
            "attendanceid" { return $Samples["attendanceId"] }
            "documentid" { return $Samples["documentId"] }
            "threadid" { return $Samples["threadId"] }
            "labrequestid" { return $Samples["labRequestId"] }
            "id" { return $Samples["genericId"] }
            default { return $Samples["genericId"] }
        }
    })
}

function Convert-FrontendRouteToSamplePath {
    param(
        [string]$Route,
        [string]$Tenant
    )

    if ([string]::IsNullOrWhiteSpace($Route) -or $Route -eq "/") {
        return "/"
    }

    $wildcardIndex = 0
    $segments = New-Object System.Collections.Generic.List[string]
    foreach ($segment in $Route.Trim("/").Split("/")) {
        if ($segment -eq "{*}") {
            if ($wildcardIndex -eq 0) {
                [void]$segments.Add($Tenant)
            }
            else {
                [void]$segments.Add("sample-id")
            }
            $wildcardIndex++
        }
        else {
            [void]$segments.Add($segment)
        }
    }

    if ($segments.Count -eq 0) {
        return "/"
    }

    return "/" + ($segments -join "/")
}

Write-Host "[1/8] Regenerating backend endpoint inventory..."
& (Join-Path $root "scripts/Generate-EndpointInventorySimple.ps1") | Out-Null

$endpointMd = Join-Path $root "docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md"
$endpointRows = New-Object System.Collections.Generic.List[object]

foreach ($line in (Get-Content -LiteralPath $endpointMd)) {
    if (-not $line.StartsWith("|")) {
        continue
    }
    if ($line -like "|---*") {
        continue
    }

    $parts = $line.Split("|")
    if ($parts.Count -lt 7) {
        continue
    }

    $method = $parts[1].Trim().ToUpperInvariant()
    if ($method -notin @("GET", "POST", "PUT", "PATCH", "DELETE")) {
        continue
    }

    $route = $parts[2].Trim()
    $controller = $parts[3].Trim()
    $action = $parts[4].Trim()
    $auth = $parts[5].Trim()

    $endpointRows.Add([pscustomobject]@{
        Method = $method
        Route = $route
        Controller = $controller
        Action = $action
        Auth = $auth
    }) | Out-Null
}

$tmpBackendEndpoints = Join-Path $root "docs/tmp_backend_endpoints.json"
$endpointRows | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $tmpBackendEndpoints -Encoding UTF8

Write-Host "[2/8] Regenerating frontend route/action/model inventories..."
& (Join-Path $root "scripts/Generate-FrontendInventoryGap.ps1") -BackendEndpointsPath "docs/tmp_backend_endpoints.json" | Out-Null

Write-Host "[3/8] Checking live service readiness..."
$backendHealth = Invoke-Http -Method "GET" -Url "$ApiBaseUrl/api/health" -Headers @{ "X-Tenant" = $TenantSlug }
$frontendHealth = Invoke-Http -Method "GET" -Url $FrontendBaseUrl -NoRedirect

Write-Host "[4/8] Logging in seeded users (roles + patient + doctors)..."
$accounts = @(
    @{ Role = "SuperAdmin"; Username = "superadmin"; Password = "Admin@123456"; Kind = "staff"; IsSuperAdmin = $true },
    @{ Role = "ClinicOwner"; Username = "owner_demo"; Password = "Owner@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "ClinicManager"; Username = "staff_sara"; Password = "Staff@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Receptionist"; Username = "reception_nada"; Password = "Reception@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Nurse"; Username = "nurse_huda"; Password = "Nurse@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Contractor"; Username = "contractor_lab"; Password = "Contractor@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Doctor"; Username = "dr_khaled"; Password = "Doctor@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Doctor"; Username = "dr_mona"; Password = "Doctor@123456"; Kind = "staff"; IsSuperAdmin = $false },
    @{ Role = "Patient"; Username = "patient_demo-clinic_1"; Password = "Patient@1234"; Kind = "patient"; IsSuperAdmin = $false }
)

$loginResults = New-Object System.Collections.Generic.List[object]
$tokenByRole = @{}
$tokenByUsername = @{}
$patientPrimaryProfileId = $null

foreach ($account in $accounts) {
    if ($account.Kind -eq "patient") {
        $login = Login-Patient -Username $account.Username -Password $account.Password
    }
    else {
        $login = Login-Staff -Username $account.Username -Password $account.Password -IsSuperAdmin $account.IsSuperAdmin
    }

    $token = $null
    $parsedLoginJson = $login.Json
    if (-not $parsedLoginJson -and -not [string]::IsNullOrWhiteSpace($login.Content)) {
        try {
            $normalizedLoginContent = ([string]$login.Content).TrimStart([char]0xFEFF, [char]0x200B, [char]0x00)
            $parsedLoginJson = $normalizedLoginContent | ConvertFrom-Json -Depth 100
        }
        catch {
            $parsedLoginJson = $null
        }
    }

    if ($login.StatusCode -eq 200 -and $parsedLoginJson -and $parsedLoginJson.data -and -not [string]::IsNullOrWhiteSpace([string]$parsedLoginJson.data.token)) {
        $token = [string]$parsedLoginJson.data.token
        $tokenByUsername[$account.Username] = $token
        if (-not $tokenByRole.ContainsKey($account.Role)) {
            $tokenByRole[$account.Role] = $token
        }
    }

    if ($login.StatusCode -eq 200 -and [string]::IsNullOrWhiteSpace($token) -and -not [string]::IsNullOrWhiteSpace($login.Content)) {
        $tokenMatch = [regex]::Match([string]$login.Content, '"token"\s*:\s*"(?<token>[^"]+)"')
        if ($tokenMatch.Success) {
            $token = [string]$tokenMatch.Groups["token"].Value
            $tokenByUsername[$account.Username] = $token
            if (-not $tokenByRole.ContainsKey($account.Role)) {
                $tokenByRole[$account.Role] = $token
            }
        }
    }

    if ($account.Kind -eq "patient" -and $parsedLoginJson -and $parsedLoginJson.data.user.profiles) {
        $profile = @($parsedLoginJson.data.user.profiles)[0]
        if ($profile -and $profile.id) {
            $patientPrimaryProfileId = [string]$profile.id
        }
    }

    if ($account.Kind -eq "patient" -and -not $patientPrimaryProfileId -and -not [string]::IsNullOrWhiteSpace($login.Content)) {
        $profileIdMatch = [regex]::Match([string]$login.Content, '"profiles"\s*:\s*\[\s*\{\s*"id"\s*:\s*"(?<id>[0-9a-fA-F-]{36})"')
        if ($profileIdMatch.Success) {
            $patientPrimaryProfileId = [string]$profileIdMatch.Groups["id"].Value
        }
    }

    $loginResults.Add([pscustomobject]@{
        Role = $account.Role
        Username = $account.Username
        StatusCode = $login.StatusCode
        Success = ($login.StatusCode -eq 200)
        HasToken = (-not [string]::IsNullOrWhiteSpace($token))
        MessagePreview = if ($login.Json -and $login.Json.message) { [string]$login.Json.message } else { ([string]$login.Content).Substring(0, [Math]::Min(120, [string]$login.Content.Length)) }
    }) | Out-Null
}

$tokenRoles = @($tokenByRole.Keys | Sort-Object)
Write-Host ("Token roles loaded: {0} => {1}" -f $tokenRoles.Count, ($tokenRoles -join ", "))

Write-Host "[5/8] Loading sample doctor/patient/visit identifiers..."
$samples = @{
    genericId = [guid]::NewGuid().ToString()
    doctorId = [guid]::NewGuid().ToString()
    patientId = if ($patientPrimaryProfileId) { $patientPrimaryProfileId } else { [guid]::NewGuid().ToString() }
    visitId = [guid]::NewGuid().ToString()
    invoiceId = [guid]::NewGuid().ToString()
    sessionId = [guid]::NewGuid().ToString()
    ticketId = [guid]::NewGuid().ToString()
    partnerId = [guid]::NewGuid().ToString()
    orderId = [guid]::NewGuid().ToString()
    itemId = [guid]::NewGuid().ToString()
    attendanceId = [guid]::NewGuid().ToString()
    documentId = [guid]::NewGuid().ToString()
    threadId = [guid]::NewGuid().ToString()
    labRequestId = [guid]::NewGuid().ToString()
}

if ($tokenByRole.ContainsKey("ClinicOwner")) {
    $ownerHeaders = @{ "Authorization" = "Bearer $($tokenByRole["ClinicOwner"])"; "X-Tenant" = $TenantSlug }

    $doctorsResp = Invoke-Http -Method "GET" -Url "$ApiBaseUrl/api/clinic/doctors?pageNumber=1&pageSize=1" -Headers $ownerHeaders
    if ($doctorsResp.Json -and $doctorsResp.Json.data.items -and @($doctorsResp.Json.data.items).Count -gt 0) {
        $samples["doctorId"] = [string]@($doctorsResp.Json.data.items)[0].id
    }

    $patientsResp = Invoke-Http -Method "GET" -Url "$ApiBaseUrl/api/clinic/patients?pageNumber=1&pageSize=1" -Headers $ownerHeaders
    if ($patientsResp.Json -and $patientsResp.Json.data.items -and @($patientsResp.Json.data.items).Count -gt 0) {
        $samples["patientId"] = [string]@($patientsResp.Json.data.items)[0].id
    }

    $invoicesResp = Invoke-Http -Method "GET" -Url "$ApiBaseUrl/api/clinic/invoices?pageNumber=1&pageSize=1" -Headers $ownerHeaders
    if ($invoicesResp.Json -and $invoicesResp.Json.data.items -and @($invoicesResp.Json.data.items).Count -gt 0) {
        $samples["invoiceId"] = [string]@($invoicesResp.Json.data.items)[0].id
        if (@($invoicesResp.Json.data.items)[0].visitId) {
            $samples["visitId"] = [string]@($invoicesResp.Json.data.items)[0].visitId
        }
    }
}

if ($tokenByUsername.ContainsKey("dr_khaled")) {
    $doctorHeaders = @{ "Authorization" = "Bearer $($tokenByUsername["dr_khaled"])"; "X-Tenant" = $TenantSlug }
    $doctorVisits = Invoke-Http -Method "GET" -Url "$ApiBaseUrl/api/clinic/visits/my?pageNumber=1&pageSize=1" -Headers $doctorHeaders
    if ($doctorVisits.Json -and $doctorVisits.Json.data.items -and @($doctorVisits.Json.data.items).Count -gt 0) {
        $firstVisit = @($doctorVisits.Json.data.items)[0]
        $samples["visitId"] = [string]$firstVisit.id
        if ($firstVisit.invoice -and $firstVisit.invoice.id) {
            $samples["invoiceId"] = [string]$firstVisit.invoice.id
        }
    }
}

Write-Host "[6/8] Probing all backend endpoints (route-level OPTIONS checks)..."
$endpointChecks = New-Object System.Collections.Generic.List[object]
$implementedStatuses = @(200, 204, 400, 401, 403, 405, 409, 410)

foreach ($ep in $endpointRows) {
    $resolvedRoute = Resolve-EndpointRoute -Route $ep.Route -Samples $samples
    $headers = @{}

    $selectedRole = Get-RoleFromAuthText -AuthText $ep.Auth -TokenByRole $tokenByRole
    if ($selectedRole -and $tokenByRole.ContainsKey($selectedRole)) {
        $headers["Authorization"] = "Bearer $($tokenByRole[$selectedRole])"
    }

    if (-not $resolvedRoute.StartsWith("/api/platform", [System.StringComparison]::OrdinalIgnoreCase)) {
        $headers["X-Tenant"] = $TenantSlug
    }

    $probe = Invoke-Http -Method "OPTIONS" -Url "$ApiBaseUrl$resolvedRoute" -Headers $headers -TimeoutSec 15
    $implemented = $implementedStatuses -contains $probe.StatusCode

    $endpointChecks.Add([pscustomobject]@{
        Method = $ep.Method
        Route = $ep.Route
        ResolvedRoute = $resolvedRoute
        Controller = $ep.Controller
        Action = $ep.Action
        Auth = $ep.Auth
        ProbeRole = if ($selectedRole) { $selectedRole } else { "none" }
        StatusCode = $probe.StatusCode
        ImplementedByProbe = $implemented
    }) | Out-Null
}

Write-Host "[7/8] Running user, patient, and doctor flow checks..."
$flowChecks = New-Object System.Collections.Generic.List[object]

function Add-FlowCheck {
    param(
        [string]$Name,
        [string]$Role,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers
    )

    $flow = Invoke-Http -Method $Method -Url $Url -Headers $Headers -TimeoutSec 20
    $ok = ($flow.StatusCode -ge 200 -and $flow.StatusCode -lt 300)
    $flowChecks.Add([pscustomobject]@{
        Name = $Name
        Role = $Role
        Method = $Method
        Url = $Url
        StatusCode = $flow.StatusCode
        Success = $ok
    }) | Out-Null
}

foreach ($role in @("SuperAdmin", "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "Contractor", "Doctor")) {
    if ($tokenByRole.ContainsKey($role)) {
        $headers = @{ "Authorization" = "Bearer $($tokenByRole[$role])" }
        if ($role -ne "SuperAdmin") {
            $headers["X-Tenant"] = $TenantSlug
        }
        Add-FlowCheck -Name "auth-me-$role" -Role $role -Method "GET" -Url "$ApiBaseUrl/api/auth/me" -Headers $headers
    }
}

if ($tokenByRole.ContainsKey("ClinicOwner")) {
    $headers = @{ "Authorization" = "Bearer $($tokenByRole["ClinicOwner"])"; "X-Tenant" = $TenantSlug }
    Add-FlowCheck -Name "owner-doctors-list" -Role "ClinicOwner" -Method "GET" -Url "$ApiBaseUrl/api/clinic/doctors?pageNumber=1&pageSize=5" -Headers $headers
    Add-FlowCheck -Name "owner-patients-list" -Role "ClinicOwner" -Method "GET" -Url "$ApiBaseUrl/api/clinic/patients?pageNumber=1&pageSize=5" -Headers $headers
}

if ($tokenByUsername.ContainsKey("dr_khaled")) {
    $headers = @{ "Authorization" = "Bearer $($tokenByUsername["dr_khaled"])"; "X-Tenant" = $TenantSlug }
    Add-FlowCheck -Name "doctor-me-profile" -Role "Doctor" -Method "GET" -Url "$ApiBaseUrl/api/clinic/doctors/me" -Headers $headers
    Add-FlowCheck -Name "doctor-my-visits" -Role "Doctor" -Method "GET" -Url "$ApiBaseUrl/api/clinic/visits/my?pageNumber=1&pageSize=5" -Headers $headers
}

if ($tokenByUsername.ContainsKey("patient_demo-clinic_1") -and $samples["patientId"]) {
    $headers = @{ "Authorization" = "Bearer $($tokenByUsername["patient_demo-clinic_1"])"; "X-Tenant" = $TenantSlug }
    Add-FlowCheck -Name "patient-summary" -Role "Patient" -Method "GET" -Url "$ApiBaseUrl/api/clinic/patient-app/profiles/$($samples["patientId"])/summary" -Headers $headers
    Add-FlowCheck -Name "patient-visits" -Role "Patient" -Method "GET" -Url "$ApiBaseUrl/api/clinic/patient-app/profiles/$($samples["patientId"])/visits?pageNumber=1&pageSize=5" -Headers $headers
}

Write-Host "[8/8] Probing all frontend pages from app route inventory..."
$frontendRoutesPath = Join-Path $root "docs/tmp_frontend_routes.json"
$routeEntries = @()
if (Test-Path -LiteralPath $frontendRoutesPath) {
    $parsedRoutes = Get-Content -LiteralPath $frontendRoutesPath -Raw | ConvertFrom-Json
    if ($parsedRoutes -is [System.Array]) {
        $routeEntries = $parsedRoutes
    }
    elseif ($null -ne $parsedRoutes) {
        $routeEntries = @($parsedRoutes)
    }
}

$pageChecks = New-Object System.Collections.Generic.List[object]
foreach ($routeEntry in $routeEntries) {
    $samplePath = Convert-FrontendRouteToSamplePath -Route $routeEntry.route -Tenant $TenantSlug
    $url = "$FrontendBaseUrl$samplePath"
    $resp = Invoke-Http -Method "GET" -Url $url -NoRedirect -TimeoutSec 20

    $pageChecks.Add([pscustomobject]@{
        Route = $routeEntry.route
        SamplePath = $samplePath
        SourceFile = $routeEntry.sourceFile
        StatusCode = $resp.StatusCode
        IsServerError = ($resp.StatusCode -ge 500)
    }) | Out-Null
}

$endpointImplementedCount = @($endpointChecks | Where-Object { $_.ImplementedByProbe }).Count
$endpointNotImplemented = @($endpointChecks | Where-Object { -not $_.ImplementedByProbe })
$endpointServerErrors = @($endpointChecks | Where-Object { $_.StatusCode -ge 500 })

$loginSuccessCount = @($loginResults | Where-Object { $_.Success }).Count
$flowSuccessCount = @($flowChecks | Where-Object { $_.Success }).Count

$pageServerErrors = @($pageChecks | Where-Object { $_.IsServerError })
$pageStatusGroups = @($pageChecks | Group-Object StatusCode | Sort-Object Name)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Full System Implementation Verification") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')") | Out-Null
$lines.Add("Tenant: $TenantSlug") | Out-Null
$lines.Add("") | Out-Null

$lines.Add("## Runtime Readiness") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Backend health status: $($backendHealth.StatusCode)") | Out-Null
$lines.Add("- Frontend root status: $($frontendHealth.StatusCode)") | Out-Null
$lines.Add("") | Out-Null

$lines.Add("## User Login Matrix") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Accounts attempted: $($loginResults.Count)") | Out-Null
$lines.Add("- Login success: $loginSuccessCount") | Out-Null
$lines.Add("- Login failed: $($loginResults.Count - $loginSuccessCount)") | Out-Null
$lines.Add("- Token roles loaded: $($tokenRoles.Count)") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Role | Username | Status | Success | HasToken |") | Out-Null
$lines.Add("|---|---|---:|---|---|") | Out-Null
foreach ($row in $loginResults) {
    $lines.Add("| $($row.Role) | $($row.Username) | $($row.StatusCode) | $($row.Success) | $($row.HasToken) |") | Out-Null
}
$lines.Add("") | Out-Null

$lines.Add("## Backend Endpoint Coverage Probe") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Endpoint inventory rows: $($endpointChecks.Count)") | Out-Null
$lines.Add("- Implemented by probe status: $endpointImplementedCount") | Out-Null
$lines.Add("- Not implemented by probe status: $($endpointNotImplemented.Count)") | Out-Null
$lines.Add("- Server errors (5xx): $($endpointServerErrors.Count)") | Out-Null
$lines.Add("") | Out-Null

if ($endpointNotImplemented.Count -gt 0) {
    $lines.Add("### Endpoint Probe Exceptions") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("| Method | Route | ProbeStatus | Auth |") | Out-Null
    $lines.Add("|---|---|---:|---|") | Out-Null
    foreach ($row in ($endpointNotImplemented | Select-Object -First 60)) {
        $lines.Add("| $($row.Method) | $($row.Route) | $($row.StatusCode) | $($row.Auth) |") | Out-Null
    }
    $lines.Add("") | Out-Null
}

$lines.Add("## User, Patient, Doctor Flow Checks") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Flow checks executed: $($flowChecks.Count)") | Out-Null
$lines.Add("- Flow checks passed: $flowSuccessCount") | Out-Null
$lines.Add("- Flow checks failed: $($flowChecks.Count - $flowSuccessCount)") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Check | Role | Status | Success |") | Out-Null
$lines.Add("|---|---|---:|---|") | Out-Null
foreach ($flow in $flowChecks) {
    $lines.Add("| $($flow.Name) | $($flow.Role) | $($flow.StatusCode) | $($flow.Success) |") | Out-Null
}
$lines.Add("") | Out-Null

$lines.Add("## Frontend Page Route Probe") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Route files/probes: $($pageChecks.Count)") | Out-Null
$lines.Add("- Route probes with 5xx: $($pageServerErrors.Count)") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("### Frontend Page Status Distribution") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Status | Count |") | Out-Null
$lines.Add("|---:|---:|") | Out-Null
foreach ($g in $pageStatusGroups) {
    $lines.Add("| $($g.Name) | $($g.Count) |") | Out-Null
}
$lines.Add("") | Out-Null

if ($pageServerErrors.Count -gt 0) {
    $lines.Add("### Frontend 5xx Failures") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("| Route | SamplePath | Status | SourceFile |") | Out-Null
    $lines.Add("|---|---|---:|---|") | Out-Null
    foreach ($p in $pageServerErrors) {
        $lines.Add("| $($p.Route) | $($p.SamplePath) | $($p.StatusCode) | $($p.SourceFile) |") | Out-Null
    }
    $lines.Add("") | Out-Null
}

$overallPass = ($loginSuccessCount -eq $loginResults.Count) -and ($endpointServerErrors.Count -eq 0) -and ($pageServerErrors.Count -eq 0)

$lines.Add("## Overall Verdict") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Overall pass condition: $overallPass") | Out-Null
$lines.Add("- Note: endpoint probe uses non-mutating route-level OPTIONS checks, plus real role/patient/doctor flow checks.") | Out-Null

$reportDir = Split-Path -Parent $reportFullPath
if (-not (Test-Path -LiteralPath $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$lines | Set-Content -LiteralPath $reportFullPath -Encoding UTF8

Write-Host "Verification report generated: $ReportPath"
Write-Host "Endpoints checked: $($endpointChecks.Count)"
Write-Host "Login success: $loginSuccessCount / $($loginResults.Count)"
Write-Host "Flow checks passed: $flowSuccessCount / $($flowChecks.Count)"
Write-Host "Frontend route probes: $($pageChecks.Count), 5xx: $($pageServerErrors.Count)"
Write-Host "Overall pass condition: $overallPass"
