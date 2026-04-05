$ErrorActionPreference = 'Stop'

$repoRoot = (Get-Location).Path
$targetsRel = @(
    'src/EliteClinic.Infrastructure/Migrations/20260404175657_Phase13_Phase1CoreStabilizationReports.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404175657_Phase13_Phase1CoreStabilizationReports.Designer.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404183649_Phase14_Phase2SelfServiceRequestFlow.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404183649_Phase14_Phase2SelfServiceRequestFlow.Designer.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404192914_Phase15_Phase3InventoryMarketplaceSales.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404192914_Phase15_Phase3InventoryMarketplaceSales.Designer.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404202657_Phase16_Phase4PartnersThreadsNotifications.cs',
    'src/EliteClinic.Infrastructure/Migrations/20260404202657_Phase16_Phase4PartnersThreadsNotifications.Designer.cs'
)

$targetMap = @{}
foreach ($rel in $targetsRel) {
    $abs = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $rel))
    $targetMap[$abs] = $rel
}

function Normalize-EditorUriToPath {
    param([string]$UriText)

    if ([string]::IsNullOrWhiteSpace($UriText)) { return $null }

    try {
        $uri = [System.Uri]$UriText
    }
    catch {
        return $null
    }

    if (-not $uri.IsFile) { return $null }

    $path = [System.Uri]::UnescapeDataString($uri.AbsolutePath)
    if ([string]::IsNullOrWhiteSpace($path)) { return $null }

    if ($path -match '^/[A-Za-z]:/') {
        $path = $path.Substring(1)
    }

    if ($uri.Host -and $uri.Host -ne '' -and $uri.Host -ne 'localhost' -and $path -notmatch '^[A-Za-z]:/') {
        if ($path.StartsWith('/')) {
            $path = "//$($uri.Host)$path"
        }
        else {
            $path = "//$($uri.Host)/$path"
        }
    }

    $path = $path -replace '/', '\\'

    try {
        return [System.IO.Path]::GetFullPath($path)
    }
    catch {
        return $null
    }
}

$stateCandidates = New-Object 'System.Collections.Generic.List[object]'
$stateFoundMap = @{}
foreach ($abs in $targetMap.Keys) { $stateFoundMap[$abs] = $false }

function Add-StateCandidate {
    param(
        [string]$Uri,
        [string]$Hash,
        [string]$Source,
        [int]$Priority,
        [System.IO.FileInfo]$StateFile,
        [string]$SessionDir
    )

    if ([string]::IsNullOrWhiteSpace($Uri) -or [string]::IsNullOrWhiteSpace($Hash)) { return }

    $normalizedPath = Normalize-EditorUriToPath -UriText $Uri
    if (-not $normalizedPath) { return }
    if (-not $targetMap.ContainsKey($normalizedPath)) { return }

    $contentPath = Join-Path (Join-Path $SessionDir 'contents') $Hash
    if (-not (Test-Path -LiteralPath $contentPath -PathType Leaf)) { return }

    $stateFoundMap[$normalizedPath] = $true

    $stateCandidates.Add([pscustomobject]@{
            TargetAbs      = $normalizedPath
            TargetRel      = $targetMap[$normalizedPath]
            Priority       = $Priority
            Source         = $Source
            Hash           = $Hash
            ContentPath    = $contentPath
            StatePath      = $StateFile.FullName
            StateLastWrite = $StateFile.LastWriteTimeUtc
        })
}

$statePattern = 'C:\Users\mohammed\AppData\Roaming\Code\User\workspaceStorage\*\chatEditingSessions\*\state.json'
$stateFiles = @(Get-ChildItem -Path $statePattern -File -ErrorAction SilentlyContinue)

foreach ($stateFile in $stateFiles) {
    $json = $null
    try {
        $json = Get-Content -LiteralPath $stateFile.FullName -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        continue
    }

    $sessionDir = Split-Path -Path $stateFile.FullName -Parent

    $ifc = $json.initialFileContents
    if ($null -ne $ifc) {
        $arr = @($ifc)
        if ($arr.Count -gt 0) {
            $allStrings = $true
            foreach ($item in $arr) {
                if ($item -isnot [string]) {
                    $allStrings = $false
                    break
                }
            }

            if ($allStrings) {
                for ($i = 0; $i -lt ($arr.Count - 1); $i += 2) {
                    Add-StateCandidate -Uri ([string]$arr[$i]) -Hash ([string]$arr[$i + 1]) -Source 'initial' -Priority 3 -StateFile $stateFile -SessionDir $sessionDir
                }
            }
            else {
                foreach ($entry in $arr) {
                    if ($null -eq $entry) { continue }

                    $u = $null
                    $h = $null

                    if ($entry.PSObject.Properties.Match('uri').Count -gt 0) { $u = [string]$entry.uri }
                    elseif ($entry.PSObject.Properties.Match('resource').Count -gt 0) { $u = [string]$entry.resource }

                    if ($entry.PSObject.Properties.Match('hash').Count -gt 0) { $h = [string]$entry.hash }
                    elseif ($entry.PSObject.Properties.Match('contentHash').Count -gt 0) { $h = [string]$entry.contentHash }
                    elseif ($entry.PSObject.Properties.Match('value').Count -gt 0) { $h = [string]$entry.value }

                    if ($u -and $h) {
                        Add-StateCandidate -Uri $u -Hash $h -Source 'initial' -Priority 3 -StateFile $stateFile -SessionDir $sessionDir
                    }
                }
            }
        }
    }

    $recentEntries = @($json.recentSnapshot.entries)
    foreach ($entry in $recentEntries) {
        if ($null -eq $entry) { continue }

        $resource = [string]$entry.resource
        if ([string]::IsNullOrWhiteSpace($resource)) { continue }

        Add-StateCandidate -Uri $resource -Hash ([string]$entry.currentHash) -Source 'recent.current' -Priority 1 -StateFile $stateFile -SessionDir $sessionDir
        Add-StateCandidate -Uri $resource -Hash ([string]$entry.originalHash) -Source 'recent.original' -Priority 2 -StateFile $stateFile -SessionDir $sessionDir
    }
}

$selectedState = @{}
foreach ($abs in $targetMap.Keys) {
    $best = $stateCandidates |
        Where-Object { $_.TargetAbs -ieq $abs } |
        Sort-Object @{ Expression = 'Priority'; Ascending = $true },
        @{ Expression = 'StateLastWrite'; Descending = $true },
        @{ Expression = 'StatePath'; Ascending = $true },
        @{ Expression = 'Hash'; Ascending = $true } |
        Select-Object -First 1

    if ($null -ne $best) {
        $selectedState[$abs] = $best
    }
}

$historyCandidates = New-Object 'System.Collections.Generic.List[object]'
$historyFoundMap = @{}
foreach ($abs in $targetMap.Keys) { $historyFoundMap[$abs] = $false }

$historyRoot = 'C:\Users\mohammed\AppData\Roaming\Code\User\History'
if (Test-Path -LiteralPath $historyRoot) {
    $historyEntryFiles = @(Get-ChildItem -LiteralPath $historyRoot -Recurse -Filter entries.json -File -ErrorAction SilentlyContinue)

    foreach ($entriesFile in $historyEntryFiles) {
        $historyJson = $null
        try {
            $historyJson = Get-Content -LiteralPath $entriesFile.FullName -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
            continue
        }

        $resource = [string]$historyJson.resource
        if ([string]::IsNullOrWhiteSpace($resource)) { continue }

        $normalizedPath = Normalize-EditorUriToPath -UriText $resource
        if (-not $normalizedPath) { continue }
        if (-not $targetMap.ContainsKey($normalizedPath)) { continue }

        $historyFoundMap[$normalizedPath] = $true

        $historyDir = Split-Path -Path $entriesFile.FullName -Parent
        $entries = @($historyJson.entries)
        foreach ($entry in $entries) {
            if ($null -eq $entry) { continue }

            $id = [string]$entry.id
            if ([string]::IsNullOrWhiteSpace($id)) { continue }

            $snapshotPath = Join-Path $historyDir $id
            if (-not (Test-Path -LiteralPath $snapshotPath -PathType Leaf)) { continue }

            $ts = 0L
            if ($entry.PSObject.Properties.Match('timestamp').Count -gt 0) {
                try {
                    $ts = [int64]$entry.timestamp
                }
                catch {
                    $ts = 0L
                }
            }

            $historyCandidates.Add([pscustomobject]@{
                    TargetAbs        = $normalizedPath
                    TargetRel        = $targetMap[$normalizedPath]
                    SnapshotPath     = $snapshotPath
                    Timestamp        = $ts
                    EntriesPath      = $entriesFile.FullName
                    EntriesLastWrite = $entriesFile.LastWriteTimeUtc
                })
        }
    }
}

$selectedHistory = @{}
foreach ($abs in $targetMap.Keys) {
    $best = $historyCandidates |
        Where-Object { $_.TargetAbs -ieq $abs } |
        Sort-Object @{ Expression = 'Timestamp'; Descending = $true },
        @{ Expression = 'EntriesLastWrite'; Descending = $true },
        @{ Expression = 'SnapshotPath'; Ascending = $true } |
        Select-Object -First 1

    if ($null -ne $best) {
        $selectedHistory[$abs] = $best
    }
}

$reportRows = New-Object 'System.Collections.Generic.List[object]'
$recoveredCount = 0
$alreadyExistsCount = 0
$notRecoveredCount = 0
$unresolved = New-Object 'System.Collections.Generic.List[string]'

foreach ($rel in $targetsRel) {
    $abs = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $rel))
    $targetExists = Test-Path -LiteralPath $abs -PathType Leaf

    $foundInState = $stateFoundMap[$abs]
    $foundInHistory = $historyFoundMap[$abs]

    $selectedSource = 'none'
    $sourcePath = '<none>'

    if ($selectedState.ContainsKey($abs)) {
        $selectedSource = 'state'
        $sourcePath = $selectedState[$abs].ContentPath
    }
    elseif ($selectedHistory.ContainsKey($abs)) {
        $selectedSource = 'history'
        $sourcePath = $selectedHistory[$abs].SnapshotPath
    }

    $recoveredStatus = 'no'

    if ($targetExists) {
        $recoveredStatus = 'already-exists'
        $alreadyExistsCount++
    }
    elseif ($selectedSource -ne 'none' -and (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        $destDir = Split-Path -Path $abs -Parent
        if (-not (Test-Path -LiteralPath $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $sourcePath -Destination $abs -Force
        $recoveredStatus = 'yes'
        $recoveredCount++
    }
    else {
        $recoveredStatus = 'no'
        $notRecoveredCount++
        $unresolved.Add($rel)
    }

    $reportRows.Add([pscustomobject]@{
            Target         = $rel
            FoundInState   = if ($foundInState) { 'yes' } else { 'no' }
            FoundInHistory = if ($foundInHistory) { 'yes' } else { 'no' }
            SelectedSource = $selectedSource
            SourcePath     = $sourcePath
            Recovered      = $recoveredStatus
        })
}

$docPath = Join-Path $repoRoot 'docs/ROUND2_MIGRATION_RECOVERY_FROM_EDITOR_STATE.txt'
$docDir = Split-Path -Path $docPath -Parent
if (-not (Test-Path -LiteralPath $docDir)) {
    New-Item -ItemType Directory -Path $docDir -Force | Out-Null
}

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add('ROUND2 migration recovery from VS Code editor state')
$lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$lines.Add('')

foreach ($row in $reportRows) {
    $lines.Add("Target: $($row.Target)")
    $lines.Add("FoundInState: $($row.FoundInState)")
    $lines.Add("FoundInHistory: $($row.FoundInHistory)")
    $lines.Add("SelectedSource: $($row.SelectedSource)")
    $lines.Add("SourcePath: $($row.SourcePath)")
    $lines.Add("Recovered: $($row.Recovered)")
    $lines.Add('')
}

$lines.Add('Summary:')
$lines.Add("TotalTargets: $($targetsRel.Count)")
$lines.Add("RecoveredYes: $recoveredCount")
$lines.Add("RecoveredAlreadyExists: $alreadyExistsCount")
$lines.Add("RecoveredNo: $notRecoveredCount")
$lines.Add("UnresolvedTargets: $($unresolved.Count)")
if ($unresolved.Count -gt 0) {
    foreach ($u in $unresolved) {
        $lines.Add("- $u")
    }
}

Set-Content -LiteralPath $docPath -Value $lines -Encoding UTF8

Write-Output "StateFilesScanned: $($stateFiles.Count)"
Write-Output "StateCandidates: $($stateCandidates.Count)"
Write-Output "HistoryCandidates: $($historyCandidates.Count)"
Write-Output "RecoveredYes: $recoveredCount"
Write-Output "RecoveredAlreadyExists: $alreadyExistsCount"
Write-Output "RecoveredNo: $notRecoveredCount"
if ($unresolved.Count -gt 0) {
    Write-Output 'UnresolvedTargets:'
    $unresolved
}
else {
    Write-Output 'UnresolvedTargets: none'
}
Write-Output "ReportPath: $docPath"
