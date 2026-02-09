@echo off
echo.
echo ===================================
echo   c0dee.me Status Check
echo ===================================
echo.

echo [1] Checking if Node server is running...
tasklist /FI "WINDOWTITLE eq c0dee Server*" 2>NUL | find /I /N "node.exe">NUL
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node server is running
) else (
    echo [X] Node server is NOT running
    echo     Run start.bat to start it
)

echo.
echo [2] Checking if Cloudflare tunnel is running...
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if %ERRORLEVEL% EQU 0 (
    echo [OK] Cloudflare tunnel is running
) else (
    echo [X] Cloudflare tunnel is NOT running
    echo     Run start.bat to start it
)

echo.
echo [3] Checking tunnel configuration...
if exist "%USERPROFILE%\.cloudflared\config.yml" (
    echo [OK] Config file exists
    powershell -Command "Get-Content $env:USERPROFILE\.cloudflared\config.yml | Select-String 'c0dee.me'" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] c0dee.me is configured
    ) else (
        echo [X] c0dee.me NOT in config
        echo     Run setup.bat again
    )
) else (
    echo [X] Config file missing
    echo     Run setup.bat to create it
)

echo.
echo [4] Testing connection to c0dee.me...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://c0dee.me' -TimeoutSec 5 -UseBasicParsing; Write-Host '[OK] c0dee.me is reachable' } catch { Write-Host '[X] Cannot reach c0dee.me' }"

echo.
pause
