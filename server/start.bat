@echo off
cd /d %~dp0

echo.
echo ===================================
echo   Starting c0dee.me Server
echo ===================================
echo.

where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: cloudflared not installed!
    echo.
    echo Run setup.bat first to install cloudflared
    echo.
    pause
    exit /b 1
)

echo [1/2] Starting Node server...
start "c0dee Server" /MIN cmd /c "node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Cloudflare tunnel...
echo.
echo Your server will be available at:
echo   https://api.c0dee.me
echo.
echo Access the control panel at:
echo   https://c0dee.me
echo.
echo Press Ctrl+C to stop
echo.

cloudflared tunnel --url http://127.0.0.1:3000 