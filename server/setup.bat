@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ============================
echo   c0dee.me Server Setup
echo ============================
echo.

where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Installing cloudflared...
    winget install Cloudflare.cloudflared
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Installation failed
        echo Install manually from: https://github.com/cloudflare/cloudflared/releases
        pause
        exit /b 1
    )
) else (
    echo [1/3] cloudflared already installed
)

echo.
echo [2/3] Configuring Cloudflare tunnel...
echo.

if not exist "%USERPROFILE%\.cloudflared\cert.pem" (
    echo Logging in to Cloudflare...
    cloudflared tunnel login
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Cloudflare login failed
        pause
        exit /b 1
    )
) else (
    echo Already logged in to Cloudflare
)

echo Creating tunnel c0dee-server...
cloudflared tunnel create c0dee-server 2>nul

echo Setting up DNS for api.c0dee.me...
cloudflared tunnel route dns c0dee-server api.c0dee.me 2>nul

echo Generating config file...
powershell -Command "$tunnels = cloudflared tunnel list --output json 2>$null | Out-String | ConvertFrom-Json; $tunnel = $tunnels | Where-Object { $_.name -eq 'c0dee-server' } | Select-Object -First 1; if ($tunnel) { $id = $tunnel.id; $cfg = \"tunnel: $id`ncredentials-file: $env:USERPROFILE\.cloudflared\$id.json`n`ningress:`n  - hostname: api.c0dee.me`n    service: http://127.0.0.1:3000`n  - service: http_status:404\"; New-Item -Force -Path \"$env:USERPROFILE\.cloudflared\" -ItemType Directory | Out-Null; Set-Content -Path \"$env:USERPROFILE\.cloudflared\config.yml\" -Value $cfg; Write-Host 'Tunnel configured' } else { Write-Host 'ERROR: Tunnel not found'; exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to configure tunnel
    pause
    exit /b 1
)

echo.
echo [3/3] Setting password...
if exist .env (
    echo Password already set
    goto :done
)

echo.
set /p PASS="Enter password for remote access: "
node hash-password.js "!PASS!" --save

:done
echo.
echo ============================
echo   Setup Complete!
echo ============================
echo.
echo Backend API: https://api.c0dee.me
echo Frontend: https://c0dee.me
echo.
echo Run start.bat to start the server
echo.
pause
