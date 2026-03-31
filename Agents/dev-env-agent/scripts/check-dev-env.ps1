# 检查是否为管理员
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "[Admin Mode] Enabled" -ForegroundColor Green
} else {
    Write-Host "[User Mode] No admin privileges, some checks may be limited" -ForegroundColor Yellow
}

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Windows Dev Environment Checker"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# 1. Node.js
Write-Host "[Node.js]" -ForegroundColor Yellow
try {
    $nodeVersion = (node -v 2>&1).ToString().TrimStart("v")
    $npmRegistry = npm config get registry 2>&1

    Write-Host "  Version: $nodeVersion"
    Write-Host "  Registry: $npmRegistry"

    if ($nodeVersion -notmatch "^2[24]\.") {
        $issues += "Node.js version mismatch (current: $nodeVersion, expected: 22.x or 24.x)"
    }
    if ($npmRegistry -notmatch "npmmirror") {
        $issues += "npm mirror not configured (current: $npmRegistry)"
    }
} catch {
    $issues += "Node.js not installed"
    Write-Host "  Not installed" -ForegroundColor Red
}

# 2. Python
Write-Host "[Python]" -ForegroundColor Yellow
try {
    $pythonVersion = (python --version 2>&1) -replace "Python ", ""
    Write-Host "  Version: $pythonVersion"

    $pipIni = "$env:APPDATA\pip\pip.ini"
    if (Test-Path $pipIni) {
        $pipContent = Get-Content $pipIni -Raw
        if ($pipContent -match "tsinghua") {
            Write-Host "  pip mirror: configured" -ForegroundColor Green
        } else {
            $issues += "pip mirror not configured"
            Write-Host "  pip mirror: not configured" -ForegroundColor Yellow
        }
    } else {
        $issues += "pip.ini not found"
    }

    if ($pythonVersion -notmatch "^3\.1[1-2]") {
        $issues += "Python version mismatch (current: $pythonVersion, expected: 3.11.x or 3.12.x)"
    }
} catch {
    $issues += "Python not installed"
    Write-Host "  Not installed" -ForegroundColor Red
}

# 3. Go
Write-Host "[Go]" -ForegroundColor Yellow
try {
    $goVersion = ((go version 2>&1) -replace "go", "").Trim()
    $goProxy = go env GOPROXY

    Write-Host "  Version: $goVersion"
    Write-Host "  Proxy: $goProxy"

    if (($goVersion -replace "version ", "") -notmatch "^1\.2[1-5]") {
        $issues += "Go version mismatch (current: $goVersion, expected: 1.21.x - 1.25.x)"
    }
    if ($goProxy -notmatch "goproxy") {
        $issues += "Go proxy not configured (current: $goProxy)"
    }
} catch {
    $issues += "Go not installed"
    Write-Host "  Not installed" -ForegroundColor Red
}

# 4. Rust
Write-Host "[Rust]" -ForegroundColor Yellow
try {
    $rustVersion = (rustc --version 2>&1) -replace "rustc ", ""
    Write-Host "  Version: $rustVersion"

    $cargoConfig = "$env:USERPROFILE\.cargo\config.toml"
    if (-not (Test-Path $cargoConfig)) {
        $issues += "Cargo config not found"
    }
} catch {
    $issues += "Rust not installed"
    Write-Host "  Not installed" -ForegroundColor Red
}

# 5. Docker
Write-Host "[Docker]" -ForegroundColor Yellow
try {
    $dockerVersion = (docker --version 2>&1) -replace "Docker version ", ""
    Write-Host "  Version: $dockerVersion"

    $daemonJson = "$env:USERPROFILE\.docker\daemon.json"
    if (Test-Path $daemonJson) {
        Write-Host "  Config: exists" -ForegroundColor Green
    } else {
        if ($isAdmin) {
            $issues += "Docker daemon.json not found"
        } else {
            $warnings += "Docker daemon.json not found (user mode)"
        }
        Write-Host "  Config: not found" -ForegroundColor Yellow
    }
} catch {
    $warnings += "Docker not installed (optional)"
    Write-Host "  Not installed (optional)" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host "Found $($issues.Count) issue(s):" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  [ISSUE] $issue" -ForegroundColor Red
        }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "Found $($warnings.Count) warning(s):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  [WARN] $warning" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    if ($isAdmin) {
        Write-Host "Run 'setup-china-mirror.ps1' to fix issues" -ForegroundColor Cyan
    } else {
        Write-Host "Tip: Run as admin for more functionality" -ForegroundColor Yellow
        Write-Host "Run 'setup-china-mirror.ps1' (as admin) to fix issues" -ForegroundColor Cyan
    }
}
