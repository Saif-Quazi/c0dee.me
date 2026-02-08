# One-time setup for Cloudflare Tunnel with custom domain
# Creates a named tunnel that maps api.c0dee.me to localhost:3000

Write-Host "`n=== Cloudflare Tunnel Setup for c0dee.me ===`n" -ForegroundColor Cyan

# Check if cloudflared is installed
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflared) {
    Write-Host "ERROR: cloudflared not found" -ForegroundColor Red
    Write-Host "`nInstall it from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    Write-Host "Or use winget: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ cloudflared found`n" -ForegroundColor Green

# Login to Cloudflare
Write-Host "Step 1: Login to Cloudflare (browser will open)" -ForegroundColor Cyan
cloudflared tunnel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Failed to login to Cloudflare" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Logged in successfully`n" -ForegroundColor Green

# Create tunnel
$tunnelName = "c0dee-server"
Write-Host "Step 2: Creating tunnel '$tunnelName'..." -ForegroundColor Cyan
cloudflared tunnel create $tunnelName

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nNote: Tunnel may already exist" -ForegroundColor Yellow
}

# Get tunnel ID
$tunnelList = cloudflared tunnel list --output json | ConvertFrom-Json
$tunnel = $tunnelList | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1

if (-not $tunnel) {
    Write-Host "`nERROR: Could not find tunnel" -ForegroundColor Red
    exit 1
}

$tunnelId = $tunnel.id
Write-Host "`n✓ Tunnel ID: $tunnelId`n" -ForegroundColor Green

# Create DNS record
Write-Host "Step 3: Creating DNS record api.c0dee.me..." -ForegroundColor Cyan
cloudflared tunnel route dns $tunnelName api.c0dee.me

Write-Host "`n✓ DNS record created`n" -ForegroundColor Green

# Create config file
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
$configDir = Split-Path $configPath -Parent

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$config = @"
tunnel: $tunnelId
credentials-file: $configDir\$tunnelId.json

ingress:
  - hostname: api.c0dee.me
    service: http://127.0.0.1:3000
  - service: http_status:404
"@

$config | Set-Content $configPath -Encoding UTF8

Write-Host "Step 4: Config saved to $configPath`n" -ForegroundColor Green

# Install as service (optional)
Write-Host "Do you want to install tunnel as a Windows service (auto-start at boot)? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "`nInstalling tunnel service..." -ForegroundColor Cyan
    cloudflared service install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Service installed`n" -ForegroundColor Green
        Write-Host "Starting service..." -ForegroundColor Cyan
        Start-Service cloudflared
        Write-Host "✓ Service started`n" -ForegroundColor Green
    }
}

Write-Host "`n=== Setup Complete! ===`n" -ForegroundColor Green
Write-Host "Your tunnel is ready:" -ForegroundColor Cyan
Write-Host "  • Backend: https://api.c0dee.me" -ForegroundColor White
Write-Host "  • Frontend: https://c0dee.me`n" -ForegroundColor White

Write-Host "To start the tunnel manually:" -ForegroundColor Cyan
Write-Host "  cloudflared tunnel run $tunnelName`n" -ForegroundColor White

Write-Host "To start as service:" -ForegroundColor Cyan
Write-Host "  Start-Service cloudflared`n" -ForegroundColor White

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: node server.js" -ForegroundColor White
Write-Host "  2. Start tunnel (if not running as service)" -ForegroundColor White
Write-Host "  3. Access: https://c0dee.me" -ForegroundColor White
Write-Host "  4. Enter your password and connect!" -ForegroundColor White
