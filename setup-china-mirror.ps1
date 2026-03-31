#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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
    
    $nodeVersion = "20.11.0"
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

function Install-Go {
    if (Test-Cmd go) {
        Write-Host "[Go] Already installed: $(go version 2>&1)" -ForegroundColor Green
        return $true
    }

    Write-Host "[Go] Installing..." -ForegroundColor Yellow
    
    $goVersion = "1.21.6"
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
    Write-Host "  1. Install Node.js + npm mirror (direct install)"
    Write-Host "  2. Install Python + pip mirror"
    Write-Host "  3. Install Go + Go proxy"
    Write-Host "  4. Install Rust + Cargo mirror"
    Write-Host "  5. Configure Docker mirror"
    Write-Host "  6. Configure Maven mirror"
    Write-Host "  7. Configure Gradle mirror"
    Write-Host "  8. Install ALL"
    Write-Host "  0. Exit"
    Write-Host ""
}

function Install-All {
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

Update-EnvPath

Show-Menu
$choice = Read-Host "Enter choice (0-8)"

switch ($choice) {
    "1" { Install-NodeJS }
    "2" { Install-Python }
    "3" { Install-Go }
    "4" { Install-Rust }
    "5" { Set-DockerMirror }
    "6" { Set-MavenMirror }
    "7" { Set-GradleMirror }
    "8" { Install-All }
    "0" { Write-Host "Bye!" -ForegroundColor Yellow }
    default { Write-Host "Invalid option" -ForegroundColor Red }
}
