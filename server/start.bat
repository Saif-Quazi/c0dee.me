@echo off
cd /d %~dp0

cls
echo.
echo ============================
echo   Starting c0dee.me
echo ============================
echo.

if not exist .env (
    echo ERROR: Not configured. Run setup.bat first.
    pause
    exit /b 1
)

where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: cloudflared not found. Run setup.bat first.
    pause
    exit /b 1
)

echo Starting server...
start "c0dee-server" /MIN cmd /c "node server.js"
timeout /t 2 /nobreak >nul

echo Starting tunnel...
echo.
echo API: https://api.c0dee.me
echo Web: https://c0dee.me
echo.
echo Press Ctrl+C to stop
echo.

cloudflared tunnel run c0dee-server 