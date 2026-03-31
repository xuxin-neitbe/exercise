# Check if running as admin
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "[Admin Mode] Enabled" -ForegroundColor Green
} else {
    Write-Host "[User Mode] No admin privileges, only mirror config available" -ForegroundColor Yellow
}

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Windows Dev Environment Mirror Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Update-EnvPath {
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $env:PATH = "$userPath;$machinePath"
}

function Test-Cmd {
    param($Name)
    Update-EnvPath
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-NodeJS {
    if (Test-Cmd node) {
        Write-Host "[Node.js] Already installed: $(node -v)" -ForegroundColor Green
        return $true
    }

    Write-Host "[Node.js] Installing..." -ForegroundColor Yellow

    $nodeVersion = "22.14.0"
    $installer = "$env:TEMP\node-$nodeVersion-x64.msi"
    $url = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"

    $mirrors = @(
        "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi",
        "https://npmmirror.com/mirrors/node/v$nodeVersion/node-v$nodeVersion-x64.msi"
    )

    foreach ($mirrorUrl in $mirrors) {
        try {
            Write-Host "[Node.js] Trying: $mirrorUrl" -ForegroundColor Gray
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $mirrorUrl -OutFile $installer -UseBasicParsing -TimeoutSec 120
            break
        }
        catch {
            Write-Host "[Node.js] Failed, trying next..." -ForegroundColor Gray
        }
    }

    if (-not (Test-Path $installer)) {
        Write-Host "[Node.js] Download failed, trying winget..." -ForegroundColor Yellow
        winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
    }
    else {
        Write-Host "[Node.js] Installing MSI..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /qn" -Wait
        Remove-Item $installer -Force -ErrorAction SilentlyContinue
    }

    Update-EnvPath

    if (Test-Cmd node) {
        Write-Host "[Node.js] Installed: $(node -v)" -ForegroundColor Green

        Write-Host "[npm] Configuring China mirror..." -ForegroundColor Yellow
        npm config set registry https://registry.npmmirror.com

        Write-Host "[npm] Mirror: $(npm config get registry)" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[Node.js] Installation failed" -ForegroundColor Red
        return $false
    }
}

function Install-Python {
    if (Test-Cmd python) {
        Write-Host "[Python] Already installed: $(python --version 2>&1)" -ForegroundColor Green
        return $true
    }

    Write-Host "[Python] Installing..." -ForegroundColor Yellow

    $pythonVersion = "3.11.7"
    $installer = "$env:TEMP\python-$pythonVersion-amd64.exe"
    $url = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe"

    $mirrors = @(
        "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe",
        "https://npmmirror.com/mirrors/python/$pythonVersion/python-$pythonVersion-amd64.exe"
    )

    foreach ($mirrorUrl in $mirrors) {
        try {
            Write-Host "[Python] Trying: $mirrorUrl" -ForegroundColor Gray
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $mirrorUrl -OutFile $installer -UseBasicParsing -TimeoutSec 180
            break
        }
        catch {
            Write-Host "[Python] Failed, trying next..." -ForegroundColor Gray
        }
    }

    if (-not (Test-Path $installer)) {
        Write-Host "[Python] Download failed, trying winget..." -ForegroundColor Yellow
        winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    }
    else {
        Write-Host "[Python] Installing..." -ForegroundColor Yellow
        Start-Process $installer -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
        Remove-Item $installer -Force -ErrorAction SilentlyContinue
    }

    Update-EnvPath

    Write-Host "[pip] Configuring China mirror..." -ForegroundColor Yellow

    $pipDir = "$env:APPDATA\pip"
    $pipIni = "$pipDir\pip.ini"

    if (-not (Test-Path $pipDir)) {
        New-Item -ItemType Directory -Path $pipDir -Force | Out-Null
    }

@"
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
"@ | Out-File -FilePath $pipIni -Encoding utf8

    Write-Host "[pip] Mirror configured: $pipIni" -ForegroundColor Green

    if (Test-Cmd python) {
        Write-Host "[Python] Installed: $(python --version 2>&1)" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[Python] Installation may require restart. Please close and reopen PowerShell." -ForegroundColor Yellow
        return $true
    }
}

function Install-Java {
    if (Test-Cmd java) {
        Write-Host "[Java] Already installed" -ForegroundColor Green
        java -version 2>&1 | Select-Object -First 1
        return $true
    }

    Write-Host "[Java] Installing..." -ForegroundColor Yellow

    $javaVersion = "21"
    $installer = "$env:TEMP\jdk-${javaVersion}.msi"

    $mirrors = @(
        "https://download.oracle.com/java/${javaVersion}/latest/jdk-${javaVersion}_windows-x64_bin.msi",
        "https://mirrors.aliyun.com/adoptium/temurin${javaVersion}-bin/jdk-${javaVersion}_windows-x64_hotspot.msi"
    )

    $downloaded = $false
    foreach ($url in $mirrors) {
        try {
            Write-Host "  Trying: $url" -ForegroundColor Gray
            Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing -TimeoutSec 120
            if (Test-Path $installer) {
                $downloaded = $true
                break
            }
        } catch {
            Write-Host "  Failed, trying next..." -ForegroundColor Gray
        }
    }

    if ($downloaded) {
        Write-Host "[Java] Running installer..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /qn" -Wait
        Remove-Item $installer -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "[Java] Download failed, trying winget..." -ForegroundColor Yellow
        winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements
    }

    Update-EnvPath

    if (Test-Cmd java) {
        Write-Host "[Java] Installed successfully!" -ForegroundColor Green
        java -version 2>&1 | Select-Object -First 1
    } else {
        Write-Host "[Java] Installation may require restart. Please close and reopen PowerShell." -ForegroundColor Yellow
    }
    return $true
}

function Install-Go {
    if (Test-Cmd go) {
        Write-Host "[Go] Already installed: $(go version 2>&1)" -ForegroundColor Green
        return $true
    }

    Write-Host "[Go] Installing..." -ForegroundColor Yellow

    $goVersion = "1.23.4"
    $installer = "$env:TEMP\go$goVersion.windows-amd64.msi"
    $url = "https://go.dev/dl/go$goVersion.windows-amd64.msi"

    $mirrors = @(
        "https://go.dev/dl/go$goVersion.windows-amd64.msi",
        "https://npmmirror.com/mirrors/go/$goVersion/go$goVersion.windows-amd64.msi"
    )

    foreach ($mirrorUrl in $mirrors) {
        try {
            Write-Host "[Go] Trying: $mirrorUrl" -ForegroundColor Gray
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $mirrorUrl -OutFile $installer -UseBasicParsing -TimeoutSec 180
            break
        }
        catch {
            Write-Host "[Go] Failed, trying next..." -ForegroundColor Gray
        }
    }

    if (-not (Test-Path $installer)) {
        Write-Host "[Go] Download failed" -ForegroundColor Red
        return $false
    }

    Write-Host "[Go] Installing MSI..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /qn" -Wait
    Remove-Item $installer -Force -ErrorAction SilentlyContinue

    Update-EnvPath

    if (Test-Cmd go) {
        Write-Host "[Go] Installed: $(go version)" -ForegroundColor Green

        Write-Host "[Go] Configuring China mirror..." -ForegroundColor Yellow
        go env -w GOPROXY=https://goproxy.cn,direct
        go env -w GOSUMDB=sum.golang.google.cn

        Write-Host "[Go] Mirror configured" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[Go] Installation may require restart" -ForegroundColor Yellow
        return $true
    }
}

function Install-Rust {
    if (Test-Cmd rustc) {
        Write-Host "[Rust] Already installed: $(rustc --version 2>&1)" -ForegroundColor Green
        return $true
    }

    Write-Host "[Rust] Installing..." -ForegroundColor Yellow

    $rustupExe = "$env:TEMP\rustup-init.exe"

    $rustupUrls = @(
        "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe",
        "https://mirrors.ustc.edu.cn/rust-static/rustup/rustup-init.exe",
        "https://rsproxy.cn/rustup-init.exe"
    )

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    foreach ($url in $rustupUrls) {
        try {
            Write-Host "[Rust] Trying: $url" -ForegroundColor Gray
            $env:RUSTUP_DIST_SERVER = "https://static.rust-lang.org"
            $env:RUSTUP_UPDATE_ROOT = "https://static.rust-lang.org/rustup"
            Invoke-WebRequest -Uri $url -OutFile $rustupExe -UseBasicParsing -TimeoutSec 120
            if ((Get-Item $rustupExe).Length -gt 1000) {
                Write-Host "[Rust] Downloaded, installing..." -ForegroundColor Yellow
                Start-Process $rustupExe -ArgumentList "-y" -Wait
                Remove-Item $rustupExe -Force -ErrorAction SilentlyContinue
                break
            }
        }
        catch {
            Write-Host "[Rust] Failed: $($_.Exception.Message.Substring(0, [Math]::Min(30, $_.Exception.Message.Length)))" -ForegroundColor Gray
        }
    }

    Update-EnvPath

    if (Test-Cmd rustc) {
        Write-Host "[Rust] Installed: $(rustc --version)" -ForegroundColor Green

        Write-Host "[Cargo] Configuring China mirror..." -ForegroundColor Yellow

        $cargoDir = "$env:USERPROFILE\.cargo"
        $cargoConfig = "$cargoDir\config.toml"

        if (-not (Test-Path $cargoDir)) {
            New-Item -ItemType Directory -Path $cargoDir -Force | Out-Null
        }

@"
[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[net]
git-fetch-with-cli = true
"@ | Out-File -FilePath $cargoConfig -Encoding utf8

        Write-Host "[Cargo] Mirror configured" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[Rust] Installation may require restart" -ForegroundColor Yellow
        return $true
    }
}

function Set-DockerMirror {
    Write-Host "[Docker] Configuring China mirror..." -ForegroundColor Yellow

    $dockerDir = "$env:USERPROFILE\.docker"
    $daemonJson = "$dockerDir\daemon.json"

    if (-not (Test-Path $dockerDir)) {
        New-Item -ItemType Directory -Path $dockerDir -Force | Out-Null
    }

@"
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
"@ | Out-File -FilePath $daemonJson -Encoding utf8

    Write-Host "[Docker] Mirror configured: $daemonJson" -ForegroundColor Green
    Write-Host "[Docker] Restart Docker Desktop to apply" -ForegroundColor Yellow
    return $true
}

function Set-MavenMirror {
    Write-Host "[Maven] Configuring China mirror..." -ForegroundColor Yellow

    $m2Dir = "$env:USERPROFILE\.m2"
    $settingsXml = "$m2Dir\settings.xml"

    if (-not (Test-Path $m2Dir)) {
        New-Item -ItemType Directory -Path $m2Dir -Force | Out-Null
    }

@"
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
"@ | Out-File -FilePath $settingsXml -Encoding utf8

    Write-Host "[Maven] Mirror configured: $settingsXml" -ForegroundColor Green
    return $true
}

function Set-GradleMirror {
    Write-Host "[Gradle] Configuring China mirror..." -ForegroundColor Yellow

    $gradleDir = "$env:USERPROFILE\.gradle"
    $initGradle = "$gradleDir\init.gradle"

    if (-not (Test-Path $gradleDir)) {
        New-Item -ItemType Directory -Path $gradleDir -Force | Out-Null
    }

@"
allprojects {
    buildscript {
        repositories {
            maven { url 'https://maven.aliyun.com/repository/public' }
            maven { url 'https://maven.aliyun.com/repository/google' }
            maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        }
    }
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    }
}
"@ | Out-File -FilePath $initGradle -Encoding utf8

    Write-Host "[Gradle] Mirror configured: $initGradle" -ForegroundColor Green
    return $true
}

function Show-Menu {
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    if ($isAdmin) {
        Write-Host "  1. Install Node.js + npm mirror"
        Write-Host "  2. Install Python + pip mirror"
        Write-Host "  3. Install Java (JDK)"
        Write-Host "  4. Install Go + Go proxy"
        Write-Host "  5. Install Rust + Cargo mirror"
    } else {
        Write-Host "  1. Install Node.js (requires admin)" -ForegroundColor Gray
        Write-Host "  2. Install Python (requires admin)" -ForegroundColor Gray
        Write-Host "  3. Install Java (requires admin)" -ForegroundColor Gray
        Write-Host "  4. Install Go (requires admin)" -ForegroundColor Gray
        Write-Host "  5. Install Rust (requires admin)" -ForegroundColor Gray
    }
    Write-Host "  6. Configure Docker mirror"
    Write-Host "  7. Configure Maven mirror"
    Write-Host "  8. Configure Gradle mirror"
    if ($isAdmin) {
        Write-Host "  9. Install ALL"
    } else {
        Write-Host "  9. Install ALL (requires admin)" -ForegroundColor Gray
    }
    Write-Host "  0. Exit"
    Write-Host ""
}

function Install-All {
    if (-not $isAdmin) {
        Write-Host "Admin required for full installation. Use option 9 for mirrors only." -ForegroundColor Red
        return
    }

    Write-Host "Starting full installation..." -ForegroundColor Cyan

    Install-NodeJS
    Install-Python
    Install-Go
    Install-Rust
    Set-DockerMirror
    Set-MavenMirror
    Set-GradleMirror

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  All done!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please restart your terminal" -ForegroundColor Yellow
}

function Install-UserOnly {
    Write-Host "Starting user-level mirror configuration (no admin required)..." -ForegroundColor Cyan

    Set-DockerMirror
    Set-MavenMirror
    Set-GradleMirror

    Write-Host ""
    Write-Host "[npm] Configuring China mirror..." -ForegroundColor Yellow
    npm config set registry https://registry.npmmirror.com

    Write-Host "[pip] Configuring China mirror..." -ForegroundColor Yellow
    $pipDir = "$env:APPDATA\pip"
    $pipIni = "$pipDir\pip.ini"
    if (-not (Test-Path $pipDir)) {
        New-Item -ItemType Directory -Path $pipDir -Force | Out-Null
    }

@"
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
"@ | Out-File -FilePath $pipIni -Encoding utf8

    Write-Host "[Go] Configuring China mirror..." -ForegroundColor Yellow
    go env -w GOPROXY=https://goproxy.cn,direct 2>$null

    Write-Host "[Cargo] Configuring China mirror..." -ForegroundColor Yellow
    $cargoDir = "$env:USERPROFILE\.cargo"
    $cargoConfig = "$cargoDir\config.toml"
    if (-not (Test-Path $cargoDir)) {
        New-Item -ItemType Directory -Path $cargoDir -Force | Out-Null
    }

@"
[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[net]
git-fetch-with-cli = true
"@ | Out-File -FilePath $cargoConfig -Encoding utf8

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  User-level configuration complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Software installation requires admin privileges" -ForegroundColor Yellow
}

Update-EnvPath

Show-Menu
$choice = Read-Host "Enter choice (0-9)"

switch ($choice) {
    "1" {
        if (-not $isAdmin) { Write-Host "Admin required" -ForegroundColor Red }
        else { Install-NodeJS }
    }
    "2" {
        if (-not $isAdmin) { Write-Host "Admin required" -ForegroundColor Red }
        else { Install-Python }
    }
    "3" {
        if (-not $isAdmin) { Write-Host "Admin required" -ForegroundColor Red }
        else { Install-Java }
    }
    "4" {
        if (-not $isAdmin) { Write-Host "Admin required" -ForegroundColor Red }
        else { Install-Go }
    }
    "5" {
        if (-not $isAdmin) { Write-Host "Admin required" -ForegroundColor Red }
        else { Install-Rust }
    }
    "6" { Set-DockerMirror }
    "7" { Set-MavenMirror }
    "8" { Set-GradleMirror }
    "9" { Install-All }
    "0" { Write-Host "Bye!" -ForegroundColor Yellow }
    default { Write-Host "Invalid option" -ForegroundColor Red }
}
