param(
    [string]$ControllersPath = "src/EliteClinic.Api/Controllers",
    [string]$OutputPath = "docs/spec-kit/ENDPOINT_INVENTORY_GENERATED.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Route {
    param([string]$Route)

    if ([string]::IsNullOrWhiteSpace($Route)) {
        return "/"
    }

    $value = $Route.Trim()
    if ($value.StartsWith("~/")) {
        $value = $value.Substring(1)
    }

    if (-not $value.StartsWith("/")) {
        $value = "/$value"
    }

    $value = ($value -replace "//+", "/")

    if ($value.Length -gt 1 -and $value.EndsWith("/")) {
        $value = $value.TrimEnd('/')
    }

    return $value
}

function Join-Routes {
    param(
        [string]$ClassRoute,
        [string]$MethodRoute
    )

    if ([string]::IsNullOrWhiteSpace($MethodRoute)) {
        return (Normalize-Route $ClassRoute)
    }

    $method = $MethodRoute.Trim()
    if ($method.StartsWith("~/")) {
        return (Normalize-Route $method.Substring(1))
    }

    if ($method.StartsWith("/")) {
        return (Normalize-Route $method)
    }

    $baseRoute = Normalize-Route $ClassRoute
    return (Normalize-Route ("$baseRoute/$method"))
}

function Get-QuotedArgument {
    param([string]$AttributeText)

    $m = [regex]::Match($AttributeText, '"(?<v>[^"]+)"')
    if ($m.Success) {
        return $m.Groups['v'].Value
    }

    return ""
}

function Get-HttpDescriptors {
    param([string[]]$Attributes)

    $items = @()
    foreach ($attr in $Attributes) {
        $trim = $attr.Trim()
        if ($trim -match '^\[Http(?<verb>Get|Post|Put|Delete|Patch)(?<rest>[^\]]*)\]$') {
            $verb = $Matches['verb'].ToUpperInvariant()
            $route = Get-QuotedArgument $trim
            $items += [pscustomobject]@{
                Method = $verb
                Template = $route
            }
        }
    }

    return $items
}

function Get-AuthorizeInfo {
    param([string[]]$Attributes)

    $allowAnonymous = $false
    $hasAuthorize = $false
    $roles = $null

    foreach ($attr in $Attributes) {
        $trim = $attr.Trim()
        if ($trim -match '^\[AllowAnonymous\]$') {
            $allowAnonymous = $true
        }

        if ($trim -match '^\[Authorize(?<body>[^\]]*)\]$') {
            $hasAuthorize = $true
            if ($trim -match 'Roles\s*=\s*"(?<roles>[^"]+)"') {
                $roles = $Matches['roles']
            }
        }
    }

    return [pscustomobject]@{
        AllowAnonymous = $allowAnonymous
        HasAuthorize = $hasAuthorize
        Roles = $roles
    }
}

if (-not (Test-Path -LiteralPath $ControllersPath)) {
    throw "Controllers path not found: $ControllersPath"
}

$rows = New-Object System.Collections.Generic.List[object]
$controllerFiles = Get-ChildItem -LiteralPath $ControllersPath -Filter "*.cs" -File | Sort-Object Name

foreach ($file in $controllerFiles) {
    $lines = Get-Content -LiteralPath $file.FullName
    $controllerName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $controllerToken = ($controllerName -replace 'Controller$', '').ToLowerInvariant()

    $classAttrs = New-Object System.Collections.Generic.List[string]
    $classRoute = ""
    $classAuth = [pscustomobject]@{ AllowAnonymous = $false; HasAuthorize = $false; Roles = $null }

    $pendingAttrs = New-Object System.Collections.Generic.List[string]
    $classSeen = $false

    foreach ($line in $lines) {
        $trim = $line.Trim()

        if ($trim -match '^\[.+\]$') {
            if (-not $classSeen) {
                $classAttrs.Add($trim)
            }

            $pendingAttrs.Add($trim)
            continue
        }

        if (-not $classSeen -and $trim -match '^public\s+class\s+') {
            $classSeen = $true
            foreach ($a in $classAttrs) {
                if ($a -match '^\[Route\(') {
                    $classRoute = Get-QuotedArgument $a
                    break
                }
            }

            if (-not [string]::IsNullOrWhiteSpace($classRoute)) {
                $classRoute = $classRoute.Replace('[controller]', $controllerToken).Replace('[Controller]', $controllerToken)
            }

            $classAuth = Get-AuthorizeInfo $classAttrs
            $pendingAttrs.Clear()
            continue
        }

        if ($trim -match '^public\s+.*\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(') {
            $actionName = $Matches['name']
            $methodAttrs = @($pendingAttrs)
            $pendingAttrs.Clear()

            $httpDescriptors = @(Get-HttpDescriptors $methodAttrs)
            if ($httpDescriptors.Count -eq 0) {
                continue
            }

            $methodAuth = Get-AuthorizeInfo $methodAttrs
            foreach ($http in $httpDescriptors) {
                $authText = "Unspecified"
                if ($methodAuth.AllowAnonymous) {
                    $authText = "Anonymous"
                }
                elseif ($methodAuth.HasAuthorize -and -not [string]::IsNullOrWhiteSpace($methodAuth.Roles)) {
                    $authText = "Roles: $($methodAuth.Roles)"
                }
                elseif ($methodAuth.HasAuthorize) {
                    $authText = "Authorized"
                }
                elseif ($classAuth.AllowAnonymous) {
                    $authText = "Anonymous"
                }
                elseif ($classAuth.HasAuthorize -and -not [string]::IsNullOrWhiteSpace($classAuth.Roles)) {
                    $authText = "Roles: $($classAuth.Roles)"
                }
                elseif ($classAuth.HasAuthorize) {
                    $authText = "Authorized"
                }

                $resolvedRoute = Join-Routes $classRoute $http.Template
                $resolvedRoute = $resolvedRoute.Replace('[controller]', $controllerToken).Replace('[Controller]', $controllerToken)
                $resolvedRoute = $resolvedRoute.Replace('[action]', $actionName.ToLowerInvariant()).Replace('[Action]', $actionName.ToLowerInvariant())

                $rows.Add([pscustomobject]@{
                    Method = $http.Method
                    Route = $resolvedRoute
                    Controller = $controllerName
                    Action = $actionName
                    Auth = $authText
                })
            }

            continue
        }

        if (-not [string]::IsNullOrWhiteSpace($trim)) {
            $pendingAttrs.Clear()
        }
    }
}

$sorted = @($rows | Sort-Object Route, Method, Controller, Action)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

$markdown = New-Object System.Collections.Generic.List[string]
$markdown.Add("# Endpoint Inventory (Generated)")
$markdown.Add("")
$markdown.Add("Generated: $timestamp")
$markdown.Add("Source: $ControllersPath")
$markdown.Add("")
$markdown.Add("| Method | Route | Controller | Action | Auth |")
$markdown.Add("|---|---|---|---|---|")

foreach ($row in $sorted) {
    $markdown.Add("| $($row.Method) | $($row.Route) | $($row.Controller) | $($row.Action) | $($row.Auth) |")
}

$outputDir = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$markdown | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Generated endpoint inventory: $OutputPath"
Write-Host "Endpoint rows: $($sorted.Count)"
