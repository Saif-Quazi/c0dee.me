@echo off
setlocal enabledelayedexpansion

echo.
echo ===================================
echo   c0dee.me Setup
echo ===================================
echo.

echo [1/3] Checking cloudflared...
where cloudflared >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] cloudflared is already installed
    goto :tunnel_setup
)

echo Installing cloudflared...
echo.
winget install Cloudflare.cloudflared

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install cloudflared
    echo.
    echo Please install manually from:
    echo https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] cloudflared installed successfully
echo.

:tunnel_setup
echo [2/3] Setting up Cloudflare tunnel...
echo.
echo This will connect c0dee.me to your server.
echo A browser window will open to login to Cloudflare.
echo.
pause

powershell -ExecutionPolicy Bypass -File configure-tunnel.ps1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Tunnel setup failed
    pause
    exit /b 1
)

echo.
echo [OK] Tunnel configured for c0dee.me
echo.

:password_check
echo [3/3] Setting up password...
if exist .env (
    echo [OK] Password already configured
    goto :done
)

echo.
set /p PASSWORD="Enter a password for remote access: "

node hash-password.js "!PASSWORD!" --save

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set password
    pause
    exit /b 1
)

echo.

:done
echo.
echo ===================================
echo   Setup Complete!
echo ===================================
echo.
echo Your server is accessible at:
echo   https://c0dee.me
echo.
echo To start the server, run:
echo   start.bat
echo.
pause
