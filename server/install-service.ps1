# Install c0dee.me as Windows service (auto-run at boot)
# Run as Administrator

$serviceName = "c0deeServer"
$serverPath = $PSScriptRoot
$nodePath = (Get-Command node).Path
$scriptPath = Join-Path $serverPath "server.js"

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if service exists
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "Service already exists. Removing..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    sc.exe delete $serviceName
    Start-Sleep -Seconds 2
}

# Install NSSM (Non-Sucking Service Manager) if not present
$nssmPath = Join-Path $serverPath "nssm.exe"

if (-not (Test-Path $nssmPath)) {
    Write-Host "Downloading NSSM..." -ForegroundColor Cyan
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $zipPath = Join-Path $env:TEMP "nssm.zip"
    
    Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force
    
    Copy-Item "$env:TEMP\nssm-2.24\win64\nssm.exe" $nssmPath
    Remove-Item $zipPath
    Write-Host "✓ NSSM installed" -ForegroundColor Green
}

# Create service
Write-Host "Installing service..." -ForegroundColor Cyan

& $nssmPath install $serviceName $nodePath $scriptPath
& $nssmPath set $serviceName AppDirectory $serverPath
& $nssmPath set $serviceName DisplayName "c0dee.me Remote Browser Server"
& $nssmPath set $serviceName Description "Remote browser control server for c0dee.me"
& $nssmPath set $serviceName Start SERVICE_AUTO_START
& $nssmPath set $serviceName AppStdout "$serverPath\service.log"
& $nssmPath set $serviceName AppStderr "$serverPath\service-error.log"

# Load .env variables into service
if (Test-Path "$serverPath\.env") {
    Get-Content "$serverPath\.env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            & $nssmPath set $serviceName AppEnvironmentExtra "$key=$value"
        }
    }
}

# Start service
Start-Service -Name $serviceName

Write-Host "`n✓ Service installed successfully" -ForegroundColor Green
Write-Host "Service will start automatically at boot" -ForegroundColor Green
Write-Host "`nCommands:" -ForegroundColor Cyan
Write-Host "  Start:   Start-Service $serviceName" -ForegroundColor White
Write-Host "  Stop:    Stop-Service $serviceName" -ForegroundColor White
Write-Host "  Status:  Get-Service $serviceName" -ForegroundColor White
Write-Host "  Remove:  sc.exe delete $serviceName" -ForegroundColor White
Write-Host "`nLogs: $serverPath\service.log" -ForegroundColor Yellow
