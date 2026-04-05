$gap = Get-Content -Raw "docs/tmp_frontend_backend_gap.json" | ConvertFrom-Json
$actions = Get-Content -Raw "docs/tmp_frontend_actions.json" | ConvertFrom-Json
$routes = Get-Content -Raw "docs/tmp_frontend_routes.json" | ConvertFrom-Json
$models = Get-Content -Raw "docs/tmp_frontend_models.json" | ConvertFrom-Json
$fileCounts = Get-Content -Raw "docs/tmp_frontend_file_counts.json" | ConvertFrom-Json

$unmatchedFrontendCalls = $gap.unmatchedFrontendCalls | ForEach-Object {
    [pscustomobject]@{
        normalizedPath = $_.normalizedPath
        sampleFiles = @($_.sampleFiles)
    }
}

$backendByController = $gap.backendEndpointsNotReferencedByFrontend |
    Group-Object Controller |
    Sort-Object Name |
    Sort-Object Count -Descending |
    ForEach-Object {
        [pscustomobject]@{
            controller = $_.Name
            count = $_.Count
        }
    }

$bucketNames = @(
    '/api/clinic/inventory',
    '/api/clinic/marketplace',
    '/api/clinic/partners',
    '/api/clinic/partner-orders',
    '/api/clinic/reports',
    '/api/clinic/self-service-requests',
    '/api/clinic/patient-app',
    '/api/clinic/patients/*/medical-documents and chronic-conditions',
    '/api/public',
    '/api/platform',
    'other'
)
$bucketCounts = @{}
foreach ($b in $bucketNames) { $bucketCounts[$b] = 0 }

foreach ($ep in $gap.backendEndpointsNotReferencedByFrontend) {
    $r = ($ep.NormalizedRoute + '').ToLower()
    $bucket = switch ($true) {
        { $r -like '/api/clinic/inventory*' } { '/api/clinic/inventory'; break }
        { $r -like '/api/clinic/marketplace*' } { '/api/clinic/marketplace'; break }
        { $r -like '/api/clinic/partners*' } { '/api/clinic/partners'; break }
        { $r -like '/api/clinic/partner-orders*' } { '/api/clinic/partner-orders'; break }
        { $r -like '/api/clinic/reports*' } { '/api/clinic/reports'; break }
        { $r -like '/api/clinic/self-service-requests*' } { '/api/clinic/self-service-requests'; break }
        { $r -like '/api/clinic/patient-app*' } { '/api/clinic/patient-app'; break }
        { ($r -like '/api/clinic/patients/{*}/medical-documents*') -or ($r -like '/api/clinic/patients/{*}/chronic-conditions*') -or ($r -match '^/api/clinic/patients/[^/]+/(medical-documents|chronic-conditions)') } { '/api/clinic/patients/*/medical-documents and chronic-conditions'; break }
        { $r -like '/api/public*' } { '/api/public'; break }
        { $r -like '/api/platform*' } { '/api/platform'; break }
        default { 'other' }
    }
    $bucketCounts[$bucket]++
}
$backendByRouteBucket = $bucketNames | ForEach-Object {
    [pscustomobject]@{ bucket = $_; count = $bucketCounts[$_] }
}

$actionCoverageByTopFolder = $actions.actionFiles |
    ForEach-Object {
        $rel = ($_.file -replace '^Frontend/actions/?','')
        $topFolder = ($rel -split '/')[0]
        [pscustomobject]@{
            topFolder = $topFolder
            exportedFunctionCount = [int]$_.exportedFunctionCount
        }
    } |
    Group-Object topFolder |
    ForEach-Object {
        [pscustomobject]@{
            folder = $_.Name
            fileCount = $_.Count
            exportedFunctions = ($_.Group | Measure-Object -Property exportedFunctionCount -Sum).Sum
        }
    } |
    Sort-Object folder |
    Sort-Object fileCount -Descending

$frontEndFileCounts = [pscustomobject]@{
    frontendSourceFileCount = $fileCounts.frontendSourceFileCount
    folders = $fileCounts.folders | Select-Object folder,totalFileCount,sourceFileCount
}

$patientRoutes = $routes | Where-Object { $_.route -like '*/patient*' } | Sort-Object route | Select-Object -First 5
$platformRoutes = $routes | Where-Object { $_.route -like '/admin*' } | Sort-Object route
$otherRoutesNeeded = 15 - ($patientRoutes.Count + $platformRoutes.Count)
$otherRoutes = $routes | Where-Object { ($_.route -notlike '*/patient*') -and ($_.route -notlike '/admin*') } | Sort-Object route | Select-Object -First $otherRoutesNeeded
$sampleRoutes = @($patientRoutes + $platformRoutes + $otherRoutes) | Select-Object -First 15 route,sourceFile

$modelTypeExportSummary = [pscustomobject]@{
    totalExportCount = $models.summary.modelTypeExportCount
    topFilesByExportCount = $models.modelFiles | Sort-Object file | Sort-Object exportCount -Descending | Select-Object -First 15 file,exportCount
}

$result = [ordered]@{
    unmatchedFrontendCalls = $unmatchedFrontendCalls
    backendEndpointsNotReferencedByFrontend_byController = $backendByController
    backendEndpointsNotReferencedByFrontend_byRoutePrefixBucket = $backendByRouteBucket
    actionCoverageSummaryByTopFolder = $actionCoverageByTopFolder
    frontendTopLevelFileCounts = $frontEndFileCounts
    sampleFrontendRoutes = $sampleRoutes
    modelTypeExportSummary = $modelTypeExportSummary
}

$result | ConvertTo-Json -Depth 8
