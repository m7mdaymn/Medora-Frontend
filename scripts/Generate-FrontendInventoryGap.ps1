param(
    [string]$BackendEndpointsPath = "docs/tmp_backend_endpoints.json",
    [string]$FrontendRootPath = "Frontend",
    [string]$OutputDir = "docs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Resolve-Path -LiteralPath ".").Path
$frontendRoot = Join-Path $root $FrontendRootPath
$backendPath = Join-Path $root $BackendEndpointsPath
$docsPath = Join-Path $root $OutputDir

if (-not (Test-Path -LiteralPath $backendPath)) {
    throw "Backend endpoints file not found: $BackendEndpointsPath"
}
if (-not (Test-Path -LiteralPath $frontendRoot)) {
    throw "Frontend root not found: $FrontendRootPath"
}
if (-not (Test-Path -LiteralPath $docsPath)) {
    New-Item -ItemType Directory -Path $docsPath -Force | Out-Null
}

function Get-RelativePath {
    param(
        [Parameter(Mandatory = $true)][string]$BasePath,
        [Parameter(Mandatory = $true)][string]$FullPath
    )

    $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd([char[]]@(92,47))
    $full = [System.IO.Path]::GetFullPath($FullPath)

    if ($full.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relative = $full.Substring($base.Length).TrimStart([char[]]@(92,47))
        if ([string]::IsNullOrWhiteSpace($relative)) {
            return "."
        }
        return ($relative -replace "\\", "/")
    }

    return ($full -replace "\\", "/")
}

function Convert-AppPageFileToRoute {
    param(
        [Parameter(Mandatory = $true)][string]$AppRoot,
        [Parameter(Mandatory = $true)][string]$PageFilePath
    )

    $directoryPath = Split-Path -Parent $PageFilePath
    $relativeDirectory = Get-RelativePath -BasePath $AppRoot -FullPath $directoryPath

    if ($relativeDirectory -eq "." -or [string]::IsNullOrWhiteSpace($relativeDirectory)) {
        return "/"
    }

    $routeSegments = New-Object System.Collections.Generic.List[string]
    foreach ($segment in ($relativeDirectory -split "/")) {
        if ([string]::IsNullOrWhiteSpace($segment)) {
            continue
        }

        if ($segment -match "^\(.*\)$") {
            continue
        }

        if ($segment -match "^\[\.\.\.[^\]]+\]$" -or $segment -match "^\[\[[.]{3}[^\]]+\]\]$" -or $segment -match "^\[[^\]]+\]$") {
            [void]$routeSegments.Add("{*}")
            continue
        }

        [void]$routeSegments.Add($segment)
    }

    if ($routeSegments.Count -eq 0) {
        return "/"
    }

    return "/" + ($routeSegments -join "/")
}

function Normalize-FrontendApiPath {
    param([string]$PathValue)

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return $null
    }

    $path = $PathValue.Trim()
    $path = $path -replace "\\", "/"

    $apiMatch = [regex]::Match($path, "(?i)/api(?:/|$)")
    if (-not $apiMatch.Success) {
        return $null
    }

    $path = $path.Substring($apiMatch.Index)

    $questionMarkIndex = $path.IndexOf("?")
    if ($questionMarkIndex -ge 0) {
        $path = $path.Substring(0, $questionMarkIndex)
    }

    $hashIndex = $path.IndexOf("#")
    if ($hashIndex -ge 0) {
        $path = $path.Substring(0, $hashIndex)
    }

    $path = [regex]::Replace($path, "\$\{[^}]+\}", "{*}")
    $path = [regex]::Replace($path, "\[\[?\.{3}[^\]]+\]?\]", "{*}")
    $path = [regex]::Replace($path, "\[[^\]/]+\]", "{*}")

    $segments = New-Object System.Collections.Generic.List[string]
    foreach ($segment in ($path -split "/")) {
        $normalizedSegment = $segment.Trim()
        if ([string]::IsNullOrWhiteSpace($normalizedSegment)) {
            continue
        }

        if ($normalizedSegment -match "^:[A-Za-z0-9_]+$") {
            $normalizedSegment = "{*}"
        }

        if ($normalizedSegment -match "^\{[^}]+\}$" -and $normalizedSegment -ne "{*}") {
            $normalizedSegment = "{*}"
        }

        if ([string]::IsNullOrWhiteSpace($normalizedSegment)) {
            continue
        }

        [void]$segments.Add($normalizedSegment.ToLowerInvariant())
    }

    if ($segments.Count -eq 0) {
        return "/"
    }

    $normalizedPath = "/" + ($segments -join "/")
    if ($normalizedPath.Length -gt 1) {
        $normalizedPath = $normalizedPath.TrimEnd("/")
    }

    return $normalizedPath
}

function Normalize-BackendRoute {
    param([string]$Route)

    if ([string]::IsNullOrWhiteSpace($Route)) {
        return $null
    }

    $path = $Route.Trim()
    $path = $path -replace "\\", "/"

    $questionMarkIndex = $path.IndexOf("?")
    if ($questionMarkIndex -ge 0) {
        $path = $path.Substring(0, $questionMarkIndex)
    }

    $hashIndex = $path.IndexOf("#")
    if ($hashIndex -ge 0) {
        $path = $path.Substring(0, $hashIndex)
    }

    if (-not $path.StartsWith("/")) {
        $path = "/" + $path
    }

    $segments = New-Object System.Collections.Generic.List[string]
    foreach ($segment in ($path -split "/")) {
        $normalizedSegment = $segment.Trim()
        if ([string]::IsNullOrWhiteSpace($normalizedSegment)) {
            continue
        }

        if ($normalizedSegment -match "^\{[^}]+\}$") {
            $normalizedSegment = "{*}"
        }

        [void]$segments.Add($normalizedSegment.ToLowerInvariant())
    }

    if ($segments.Count -eq 0) {
        return "/"
    }

    $normalizedPath = "/" + ($segments -join "/")
    if ($normalizedPath.Length -gt 1) {
        $normalizedPath = $normalizedPath.TrimEnd("/")
    }

    return $normalizedPath
}

function Test-ApiPathMatch {
    param(
        [Parameter(Mandatory = $true)][string]$FrontendPath,
        [Parameter(Mandatory = $true)][string]$BackendPath
    )

    $frontendSegments = @()
    if ($FrontendPath.Trim("/") -ne "") {
        $frontendSegments = $FrontendPath.Trim("/").Split("/")
    }

    $backendSegments = @()
    if ($BackendPath.Trim("/") -ne "") {
        $backendSegments = $BackendPath.Trim("/").Split("/")
    }

    if ($frontendSegments.Count -eq 0 -and $backendSegments.Count -eq 0) {
        return $true
    }

    $minimumCount = [Math]::Min($frontendSegments.Count, $backendSegments.Count)
    for ($index = 0; $index -lt $minimumCount; $index++) {
        $frontSegment = $frontendSegments[$index]
        $backSegment = $backendSegments[$index]

        if ($frontSegment -ne "{*}" -and $backSegment -ne "{*}" -and $frontSegment -ne $backSegment) {
            return $false
        }
    }

    if ($frontendSegments.Count -eq $backendSegments.Count) {
        return $true
    }

    if ($frontendSegments.Count -gt $backendSegments.Count) {
        for ($index = $backendSegments.Count; $index -lt $frontendSegments.Count; $index++) {
            if ($frontendSegments[$index] -ne "{*}") {
                return $false
            }
        }
        return $true
    }

    for ($index = $frontendSegments.Count; $index -lt $backendSegments.Count; $index++) {
        if ($backendSegments[$index] -ne "{*}") {
            return $false
        }
    }

    return $true
}

$sourceExtensions = @(".ts", ".tsx", ".js", ".jsx")
$stringLiteralRegex = [regex]'(?s)(["''`])((?:\\.|(?!\1).)*)\1'

$routesOutputPath = Join-Path $docsPath "tmp_frontend_routes.json"
$actionsOutputPath = Join-Path $docsPath "tmp_frontend_actions.json"
$modelsOutputPath = Join-Path $docsPath "tmp_frontend_models.json"
$apiCallsOutputPath = Join-Path $docsPath "tmp_frontend_api_calls.json"
$fileCountsOutputPath = Join-Path $docsPath "tmp_frontend_file_counts.json"
$gapOutputPath = Join-Path $docsPath "tmp_frontend_backend_gap.json"

# Step 1: Backend endpoints
$backendEndpointsRaw = Get-Content -LiteralPath $backendPath -Raw | ConvertFrom-Json
$backendEndpoints = @()
foreach ($endpoint in $backendEndpointsRaw) {
    $normalizedRoute = Normalize-BackendRoute -Route $endpoint.Route
    $backendEndpoints += [pscustomobject]@{
        Method = $endpoint.Method
        Route = $endpoint.Route
        NormalizedRoute = $normalizedRoute
        Controller = $endpoint.Controller
        Action = $endpoint.Action
        Auth = $endpoint.Auth
    }
}

# Step 2: Frontend routes
$appRoot = Join-Path $frontendRoot "app"
$routeFiles = @()
if (Test-Path -LiteralPath $appRoot) {
    $routeFiles = Get-ChildItem -LiteralPath $appRoot -Recurse -File | Where-Object { $_.Name -in @("page.ts", "page.tsx") }
}

$routeEntries = @()
foreach ($file in $routeFiles) {
    $routePath = Convert-AppPageFileToRoute -AppRoot $appRoot -PageFilePath $file.FullName
    $routeEntries += [pscustomobject]@{
        route = $routePath
        sourceFile = Get-RelativePath -BasePath $root -FullPath $file.FullName
    }
}

$routeEntries = @($routeEntries | Sort-Object route, sourceFile)

# Step 3: Frontend actions
$actionsRoot = Join-Path $frontendRoot "actions"
$actionFiles = @()
if (Test-Path -LiteralPath $actionsRoot) {
    $actionFiles = Get-ChildItem -LiteralPath $actionsRoot -Recurse -File -Filter "*.ts" | Where-Object { $_.Name -notlike "*.d.ts" }
}

$actionEntries = @()
foreach ($file in $actionFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($null -eq $content) {
        $content = ""
    }

    $functionMatches = [regex]::Matches($content, "(?m)^\s*export\s+(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(")
    $functionNames = @()
    foreach ($match in $functionMatches) {
        $functionNames += $match.Groups[1].Value
    }

    $uniqueFunctionNames = @($functionNames | Sort-Object -Unique)

    $actionEntries += [pscustomobject]@{
        file = Get-RelativePath -BasePath $root -FullPath $file.FullName
        exportedFunctions = $uniqueFunctionNames
        exportedFunctionCount = $uniqueFunctionNames.Count
    }
}
$actionEntries = @($actionEntries | Sort-Object file)
$actionExportedFunctionCount = 0
if ($actionEntries.Count -gt 0) {
    $actionExportedFunctionCount = ($actionEntries | Measure-Object -Property exportedFunctionCount -Sum).Sum
}

# Step 4: Model/type files
$modelRoots = @(
    (Join-Path $frontendRoot "types"),
    (Join-Path $frontendRoot "validation")
)
$modelFiles = @()
foreach ($modelRoot in $modelRoots) {
    if (Test-Path -LiteralPath $modelRoot) {
        $modelFiles += Get-ChildItem -LiteralPath $modelRoot -Recurse -File | Where-Object { $_.Extension -in @(".ts", ".tsx") }
    }
}

$modelEntries = @()
foreach ($file in $modelFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($null -eq $content) {
        $content = ""
    }

    $exports = @()

    foreach ($match in [regex]::Matches($content, "(?m)^\s*export\s+(?:declare\s+)?type\s+([A-Za-z_][A-Za-z0-9_]*)\b")) {
        $exports += [pscustomobject]@{ kind = "type"; name = $match.Groups[1].Value }
    }
    foreach ($match in [regex]::Matches($content, "(?m)^\s*export\s+(?:declare\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)\b")) {
        $exports += [pscustomobject]@{ kind = "interface"; name = $match.Groups[1].Value }
    }
    foreach ($match in [regex]::Matches($content, "(?m)^\s*export\s+(?:const\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)\b")) {
        $exports += [pscustomobject]@{ kind = "enum"; name = $match.Groups[1].Value }
    }
    foreach ($match in [regex]::Matches($content, "(?m)^\s*export\s+(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b")) {
        $exports += [pscustomobject]@{ kind = "class"; name = $match.Groups[1].Value }
    }

    $uniqueExports = @()
    $seenExportKeys = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($exportItem in $exports) {
        $key = "$($exportItem.kind):$($exportItem.name)"
        if ($seenExportKeys.Add($key)) {
            $uniqueExports += $exportItem
        }
    }

    $modelEntries += [pscustomobject]@{
        file = Get-RelativePath -BasePath $root -FullPath $file.FullName
        exports = $uniqueExports
        exportCount = $uniqueExports.Count
    }
}
$modelEntries = @($modelEntries | Sort-Object file)

# Step 5: Frontend source files and API call literals
$frontendSourceFiles = Get-ChildItem -LiteralPath $frontendRoot -Recurse -File | Where-Object {
    $_.Extension -in $sourceExtensions -and
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\\.next\\"
}

$apiCallOccurrences = @()
foreach ($file in $frontendSourceFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($null -eq $content) {
        $content = ""
    }

    foreach ($match in $stringLiteralRegex.Matches($content)) {
        $literalValue = $match.Groups[2].Value
        if ($literalValue -notmatch "/api/") {
            continue
        }

        $normalizedPath = Normalize-FrontendApiPath -PathValue $literalValue
        $apiCallOccurrences += [pscustomobject]@{
            file = Get-RelativePath -BasePath $root -FullPath $file.FullName
            literal = $literalValue
            normalizedPath = $normalizedPath
        }
    }
}

$apiCallOccurrences = @($apiCallOccurrences | Sort-Object file, literal)
$normalizedFrontendApiPaths = @($apiCallOccurrences |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_.normalizedPath) } |
    Select-Object -ExpandProperty normalizedPath -Unique |
    Sort-Object)

# Step 6: Coverage comparison
$matchedFrontendCalls = @()
$unmatchedFrontendCalls = @()
$referencedBackendRoutes = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)

foreach ($path in $normalizedFrontendApiPaths) {
    $matchingBackend = @()
    foreach ($backendEndpoint in $backendEndpoints) {
        if ([string]::IsNullOrWhiteSpace($backendEndpoint.NormalizedRoute)) {
            continue
        }
        if (Test-ApiPathMatch -FrontendPath $path -BackendPath $backendEndpoint.NormalizedRoute) {
            $matchingBackend += $backendEndpoint
        }
    }

    $occurrencesForPath = @($apiCallOccurrences | Where-Object { $_.normalizedPath -eq $path })

    if ($matchingBackend.Count -gt 0) {
        foreach ($backendEndpoint in $matchingBackend) {
            [void]$referencedBackendRoutes.Add($backendEndpoint.NormalizedRoute)
        }

        $matchedFrontendCalls += [pscustomobject]@{
            normalizedPath = $path
            occurrenceCount = $occurrencesForPath.Count
            sampleFiles = ($occurrencesForPath | Select-Object -ExpandProperty file -Unique | Select-Object -First 10)
            matchedBackendRoutes = ($matchingBackend | ForEach-Object { "$($_.Method) $($_.Route)" } | Sort-Object -Unique)
        }
    }
    else {
        $unmatchedFrontendCalls += [pscustomobject]@{
            normalizedPath = $path
            occurrenceCount = $occurrencesForPath.Count
            sampleFiles = ($occurrencesForPath | Select-Object -ExpandProperty file -Unique | Select-Object -First 10)
        }
    }
}

$matchedFrontendCalls = @($matchedFrontendCalls | Sort-Object normalizedPath)
$unmatchedFrontendCalls = @($unmatchedFrontendCalls | Sort-Object normalizedPath)

$backendEndpointsNotReferencedByFrontend = @()
foreach ($backendEndpoint in $backendEndpoints) {
    if ([string]::IsNullOrWhiteSpace($backendEndpoint.NormalizedRoute)) {
        continue
    }
    if (-not $referencedBackendRoutes.Contains($backendEndpoint.NormalizedRoute)) {
        $backendEndpointsNotReferencedByFrontend += [pscustomobject]@{
            Method = $backendEndpoint.Method
            Route = $backendEndpoint.Route
            NormalizedRoute = $backendEndpoint.NormalizedRoute
            Controller = $backendEndpoint.Controller
            Action = $backendEndpoint.Action
        }
    }
}
$backendEndpointsNotReferencedByFrontend = @($backendEndpointsNotReferencedByFrontend | Sort-Object NormalizedRoute, Method)

# Step 7: File counts by top-level frontend folders
$topFolders = @("app", "actions", "components", "lib", "hooks", "store", "types", "validation")
$fileCounts = @()
foreach ($folder in $topFolders) {
    $folderPath = Join-Path $frontendRoot $folder
    $allFiles = @()
    $sourceFilesInFolder = @()

    if (Test-Path -LiteralPath $folderPath) {
        $allFiles = Get-ChildItem -LiteralPath $folderPath -Recurse -File
        $sourceFilesInFolder = $allFiles | Where-Object { $_.Extension -in $sourceExtensions }
    }

    $fileCounts += [pscustomobject]@{
        folder = $folder
        pathExists = (Test-Path -LiteralPath $folderPath)
        totalFileCount = $allFiles.Count
        sourceFileCount = $sourceFilesInFolder.Count
    }
}

# Save artifacts
$routeEntries | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $routesOutputPath -Encoding UTF8

[pscustomobject]@{
    actionFiles = $actionEntries
    summary = [pscustomobject]@{
        actionFileCount = $actionFiles.Count
        actionExportedFunctionCount = $actionExportedFunctionCount
    }
} | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $actionsOutputPath -Encoding UTF8

$modelTypeExportCount = 0
if ($modelEntries.Count -gt 0) {
    $modelTypeExportCount = ($modelEntries | Measure-Object -Property exportCount -Sum).Sum
}

[pscustomobject]@{
    modelFiles = $modelEntries
    summary = [pscustomobject]@{
        modelTypeFileCount = $modelFiles.Count
        modelTypeExportCount = $modelTypeExportCount
    }
} | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $modelsOutputPath -Encoding UTF8

[pscustomobject]@{
    extractedApiCallLiterals = $apiCallOccurrences
    summary = [pscustomobject]@{
        extractedApiCallLiteralCount = $apiCallOccurrences.Count
        uniqueNormalizedFrontendApiPathCount = $normalizedFrontendApiPaths.Count
    }
} | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $apiCallsOutputPath -Encoding UTF8

[pscustomobject]@{
    folders = $fileCounts
    frontendSourceFileCount = $frontendSourceFiles.Count
} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $fileCountsOutputPath -Encoding UTF8

[pscustomobject]@{
    matchedFrontendCalls = $matchedFrontendCalls
    unmatchedFrontendCalls = $unmatchedFrontendCalls
    backendEndpointsNotReferencedByFrontend = $backendEndpointsNotReferencedByFrontend
    summary = [pscustomobject]@{
        normalizedFrontendApiPathCount = $normalizedFrontendApiPaths.Count
        matchedFrontendApiPathCount = $matchedFrontendCalls.Count
        unmatchedFrontendApiPathCount = $unmatchedFrontendCalls.Count
        backendEndpointCount = $backendEndpoints.Count
        backendEndpointsNotReferencedCount = $backendEndpointsNotReferencedByFrontend.Count
    }
} | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $gapOutputPath -Encoding UTF8

# Step 8: concise summary counts + file existence confirmation
$outputFiles = @(
    $routesOutputPath,
    $actionsOutputPath,
    $modelsOutputPath,
    $apiCallsOutputPath,
    $fileCountsOutputPath,
    $gapOutputPath
)

$missingOutputFiles = @()
foreach ($filePath in $outputFiles) {
    if (-not (Test-Path -LiteralPath $filePath)) {
        $missingOutputFiles += $filePath
    }
}

$routeCount = @($routeEntries | Select-Object -ExpandProperty route -Unique).Count

Write-Host ("frontend source file count: {0}" -f $frontendSourceFiles.Count)
Write-Host ("routes count: {0}" -f $routeCount)
Write-Host ("action files count: {0}" -f $actionFiles.Count)
Write-Host ("action exported function count: {0}" -f $actionExportedFunctionCount)
Write-Host ("model/type files count: {0}" -f $modelFiles.Count)
Write-Host ("extracted api call literal count: {0}" -f $apiCallOccurrences.Count)
Write-Host ("unique normalized frontend api paths: {0}" -f $normalizedFrontendApiPaths.Count)
Write-Host ("matched frontend api paths: {0}" -f $matchedFrontendCalls.Count)
Write-Host ("unmatched frontend api paths: {0}" -f $unmatchedFrontendCalls.Count)
Write-Host ("backend endpoints not referenced count: {0}" -f $backendEndpointsNotReferencedByFrontend.Count)
if ($missingOutputFiles.Count -eq 0) {
    Write-Host "all output files exist: yes"
}
else {
    Write-Host ("all output files exist: no ({0})" -f ($missingOutputFiles -join ", "))
}


