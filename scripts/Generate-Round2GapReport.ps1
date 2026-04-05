param(
    [string]$ReportPath = "BACKEND_MASTER_IMPLEMENTATION_REPORT.md",
    [string]$OutputPath = "docs/ROUND2_FULL_CODEBASE_REPORT_GAP_CHECK_V2.txt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$reportFullPath = Join-Path $root $ReportPath
$outputFullPath = Join-Path $root $OutputPath

if (-not (Test-Path -LiteralPath $reportFullPath)) {
    throw "Source report not found: $reportFullPath"
}

$content = Get-Content -LiteralPath $reportFullPath -Raw

function Normalize-RepoPath {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $path = $Value.Trim()
    $path = $path -replace "\\", "/"

    while ($path.StartsWith("./")) {
        $path = $path.Substring(2)
    }

    while ($path.StartsWith("/")) {
        $path = $path.Substring(1)
    }

    if ([string]::IsNullOrWhiteSpace($path)) {
        return $null
    }

    return $path
}

function Has-GlobChars {
    param([string]$Value)

    return $Value -match "[\*\?\[\]]"
}

function Is-RepoRootedPath {
    param([string]$Value)

    return $Value -match '^(src|tests|docs|Frontend|frontend|tools|publish|scripts)/'
}

function Has-KnownFileExtension {
    param([string]$Value)

    $ext = [System.IO.Path]::GetExtension($Value)
    if ([string]::IsNullOrWhiteSpace($ext)) {
        return $false
    }

    $ext = $ext.TrimStart('.').ToLowerInvariant()
    $known = @('cs','csproj','md','json','ts','tsx','js','sql','yml','yaml','txt','ps1')
    return $known -contains $ext
}

$backtickSegments = @()
foreach ($m in [regex]::Matches($content, '`([^`]+)`')) {
    $backtickSegments += $m.Groups[1].Value
}

$plainPathPattern = '(?im)(?:^|[\s`"''(])((?:src|tests|docs|Frontend|frontend|tools|publish|scripts)/[A-Za-z0-9_./-]+?\.(?:cs|csproj|md|json|ts|tsx|js|sql|yml|yaml|txt|ps1))(?=$|[\s`"''):,;])'
$plainPathMatches = @()
foreach ($m in [regex]::Matches($content, $plainPathPattern)) {
    $plainPathMatches += $m.Groups[1].Value
}

$slashCandidates = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
$skippedPatternEntries = 0

foreach ($raw in ($backtickSegments + $plainPathMatches)) {
    $normalized = Normalize-RepoPath $raw
    if (-not $normalized) {
        continue
    }

    if ($normalized -notmatch "/") {
        continue
    }

    if (-not (Is-RepoRootedPath $normalized)) {
        continue
    }

    if (Has-GlobChars $normalized) {
        $skippedPatternEntries++
        continue
    }

    $absolutePath = Join-Path $root ($normalized -replace "/", "\\")
    $hasExtension = Has-KnownFileExtension $normalized
    $existsNow = Test-Path -LiteralPath $absolutePath

    # File-focused mode: keep non-extension slash entries only when they actually exist.
    if (-not $hasExtension -and -not $existsNow) {
        continue
    }

    [void]$slashCandidates.Add($normalized)
}

$missingExactPaths = @()
foreach ($path in ($slashCandidates | Sort-Object)) {
    $absolutePath = Join-Path $root ($path -replace "/", "\\")
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        $missingExactPaths += $path
    }
}

$bareFilenameCandidates = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
foreach ($raw in ($backtickSegments + $plainPathMatches)) {
    $normalized = Normalize-RepoPath $raw
    if (-not $normalized) {
        continue
    }

    if ($normalized -match "/") {
        continue
    }

    if (Has-GlobChars $normalized) {
        $skippedPatternEntries++
        continue
    }

    if ($normalized -notmatch '^[A-Za-z0-9_.-]+$') {
        continue
    }

    if (-not (Has-KnownFileExtension $normalized)) {
        continue
    }

    [void]$bareFilenameCandidates.Add($normalized)
}

$fileIndex = @{}
Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $name = $_.Name.ToLowerInvariant()
    if (-not $fileIndex.ContainsKey($name)) {
        $fileIndex[$name] = @()
    }

    $relativePath = $_.FullName.Substring($root.Length).TrimStart('\\') -replace "\\", "/"
    $fileIndex[$name] += $relativePath
}

$resolvedBareFilenames = @{}
$missingBareFilenames = @()
$ambiguousBareFilenames = @{}

foreach ($filename in ($bareFilenameCandidates | Sort-Object)) {
    $key = $filename.ToLowerInvariant()
    if (-not $fileIndex.ContainsKey($key)) {
        $missingBareFilenames += $filename
        continue
    }

    $matches = @($fileIndex[$key] | Sort-Object -Unique)
    if ($matches.Count -eq 1) {
        $resolvedBareFilenames[$filename] = $matches[0]
    }
    else {
        $ambiguousBareFilenames[$filename] = ($matches -join " | ")
    }
}

$lines = @()
$lines += "SUMMARY COUNTS"
$lines += "--------------"
$lines += "Backticked segments extracted: $($backtickSegments.Count)"
$lines += "Plain repo-path matches extracted: $($plainPathMatches.Count)"
$lines += "Skipped pattern/glob entries: $skippedPatternEntries"
$lines += "Unique slash path candidates: $($slashCandidates.Count)"
$lines += "Missing exact paths: $($missingExactPaths.Count)"
$lines += "Unique bare filename candidates: $($bareFilenameCandidates.Count)"
$lines += "Resolved bare filenames: $($resolvedBareFilenames.Count)"
$lines += "Missing bare filenames: $($missingBareFilenames.Count)"
$lines += "Ambiguous bare filenames: $($ambiguousBareFilenames.Count)"

$lines += ""
$lines += "MISSING EXACT PATHS"
$lines += "-------------------"
if ($missingExactPaths.Count -eq 0) {
    $lines += "(none)"
}
else {
    $lines += ($missingExactPaths | Sort-Object)
}

$lines += ""
$lines += "MISSING BARE FILENAMES"
$lines += "----------------------"
if ($missingBareFilenames.Count -eq 0) {
    $lines += "(none)"
}
else {
    $lines += ($missingBareFilenames | Sort-Object)
}

$lines += ""
$lines += "AMBIGUOUS BARE FILENAMES"
$lines += "------------------------"
if ($ambiguousBareFilenames.Count -eq 0) {
    $lines += "(none)"
}
else {
    foreach ($name in ($ambiguousBareFilenames.Keys | Sort-Object)) {
        $lines += "$name => $($ambiguousBareFilenames[$name])"
    }
}

$outputDir = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$lines | Set-Content -LiteralPath $outputFullPath -Encoding UTF8
Write-Host "Generated: $OutputPath"
Write-Host "Missing exact paths: $($missingExactPaths.Count)"
Write-Host "Missing bare filenames: $($missingBareFilenames.Count)"
Write-Host "Ambiguous bare filenames: $($ambiguousBareFilenames.Count)"
