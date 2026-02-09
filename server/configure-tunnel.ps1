Write-Host "Logging in to Cloudflare..." -ForegroundColor Cyan
cloudflared tunnel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to login" -ForegroundColor Red
    exit 1
}

Write-Host "Creating tunnel..." -ForegroundColor Cyan
cloudflared tunnel create c0dee-server 2>$null

Write-Host "Setting up DNS..." -ForegroundColor Cyan
cloudflared tunnel route dns c0dee-server c0dee.me

$tunnelList = cloudflared tunnel list --output json | ConvertFrom-Json
$tunnel = $tunnelList | Where-Object { $_.name -eq "c0dee-server" } | Select-Object -First 1

if (-not $tunnel) {
    Write-Host "ERROR: Tunnel not found" -ForegroundColor Red
    exit 1
}

$tunnelId = $tunnel.id
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"

$config = @"
tunnel: $tunnelId
credentials-file: $env:USERPROFILE\.cloudflared\$tunnelId.json

ingress:
  - hostname: c0dee.me
    service: http://127.0.0.1:3000
  - service: http_status:404
"@

Set-Content -Path $configPath -Value $config -Encoding UTF8
Write-Host "OK Tunnel configured successfully" -ForegroundColor Green
