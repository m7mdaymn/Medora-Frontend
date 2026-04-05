param(
    [string]$ControllerPath = "src/EliteClinic.Api/Controllers",
    [string]$OutPath = "docs/spec-kit/ENDPOINT_MATRIX_BACKEND.csv"
)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Path (Split-Path $OutPath) -Force | Out-Null

function Get-RouteValue([string]$routeArgs) {
    if ([string]::IsNullOrWhiteSpace($routeArgs)) { return "" }
    $m = [regex]::Match($routeArgs, '@"(?<v>[^"]*)"')
    if ($m.Success) { return $m.Groups['v'].Value }
    $m = [regex]::Match($routeArgs, '"(?<v>(?:[^"\\]|\\.)*)"')
    if ($m.Success) { return $m.Groups['v'].Value }
    return $routeArgs.Trim()
}

function Combine-Route([string]$baseRoute, [string]$methodRoute) {
    $b = if ([string]::IsNullOrWhiteSpace($baseRoute)) { "" } else { $baseRoute.Trim() }
    $m = if ([string]::IsNullOrWhiteSpace($methodRoute)) { "" } else { $methodRoute.Trim() }

    if ($m -ne "") {
        $isAbsolute = $m.StartsWith("~/") -or $m.StartsWith("/")
        if ($isAbsolute) {
            return $m.TrimStart('~').TrimStart('/')
        }
        $m = $m.TrimStart('~').TrimStart('/')
    }

    if ($b -eq "" -and $m -eq "") { return "" }
    if ($m -eq "") { return $b.TrimEnd('/') }
    if ($b -eq "") { return $m }
    return ($b.TrimEnd('/') + '/' + $m)
}

$rows = New-Object System.Collections.Generic.List[object]
$files = Get-ChildItem -Path $ControllerPath -Filter *.cs -File | Sort-Object Name

foreach ($file in $files) {
    $lines = Get-Content -Path $file.FullName
    $controllerBase = $file.BaseName
    $controllerToken = if ($controllerBase -like '*Controller') { $controllerBase.Substring(0, $controllerBase.Length - 10) } else { $controllerBase }

    $controllerRouteArgs = ""
    $pendingAttrs = New-Object System.Collections.Generic.List[string]
    foreach ($line in $lines) {
        if ($line -match '^\s*\[[^\r\n]+\]\s*$') { $pendingAttrs.Add($line); continue }
        if ($line -match '^\s*public\s+(?:partial\s+)?class\s+\w+Controller\b') {
            foreach ($attr in $pendingAttrs) {
                if ($attr -match '^\s*\[Route\s*\((?<routeArgs>.*)\)\]\s*$') { $controllerRouteArgs = $Matches['routeArgs']; break }
            }
            break
        }
        if ($line -notmatch '^\s*$' -and $line -notmatch '^\s*//') { $pendingAttrs.Clear() }
    }
    $controllerRoute = (Get-RouteValue $controllerRouteArgs) -replace '\[controller\]', $controllerToken

    $pendingAttrs = New-Object System.Collections.Generic.List[string]
    foreach ($line in $lines) {
        if ($line -match '^\s*\[[^\r\n]+\]\s*$') { $pendingAttrs.Add($line); continue }
        if ($line -match '^\s*public\s+.*?\b(?<name>\w+)\s*\(') {
            $methodName = $Matches['name']
            if ($pendingAttrs.Count -gt 0) {
                $methodRouteArgs = ""
                foreach ($attr in $pendingAttrs) {
                    if ($attr -match '^\s*\[Route\s*\((?<routeArgs>.*)\)\]\s*$' -and [string]::IsNullOrWhiteSpace($methodRouteArgs)) { $methodRouteArgs = $Matches['routeArgs'] }
                }
                $methodRoute = Get-RouteValue $methodRouteArgs

                foreach ($attr in $pendingAttrs) {
                    if ($attr -match '^\s*\[(?<verb>HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(?:\s*\((?<routeArgs>.*)\))?\]\s*$') {
                        $verb = ($Matches['verb'] -replace '^Http','').ToUpperInvariant()
                        $verbRoute = Get-RouteValue $Matches['routeArgs']
                        $methodPart = if (-not [string]::IsNullOrWhiteSpace($verbRoute)) { $verbRoute } else { $methodRoute }
                        $fullRoute = Combine-Route $controllerRoute $methodPart

                        $rows.Add([pscustomobject]@{
                            ControllerFile = $file.Name
                            HttpVerb = $verb
                            RouteTemplate = $fullRoute
                            MethodName = $methodName
                        }) | Out-Null
                    }
                }
            }
            $pendingAttrs.Clear()
            continue
        }
        if ($line -match '^\s*$' -or $line -match '^\s*//' -or $line -match '^\s*///') { continue }
        $pendingAttrs.Clear()
    }
}

$rows | Export-Csv -Path $OutPath -NoTypeInformation -Encoding UTF8
"TOTAL_ENDPOINTS:$($rows.Count)"
Get-Content -Path $OutPath -First 20
