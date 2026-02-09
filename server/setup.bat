@echo off
setlocal enabledelayedexpansion

echo.
echo ===================================
echo   c0dee.me Setup
echo ===================================
echo.

where cloudflared >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] cloudflared is already installed
    goto :password_check
)

echo [1/2] Installing cloudflared...
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

:password_check
if not exist .env (
    echo.
    echo [2/2] Setting up password...
    echo.
    set /p PASSWORD="Enter a password for remote access: "
    
    node hash-password.js "!PASSWORD!" --save
    
    echo.
) else (
    echo [OK] Password already configured
)

echo.
echo ===================================
echo   Setup Complete!
echo ===================================
echo.
echo To start the server, run:
echo   start.bat
echo.
pause
