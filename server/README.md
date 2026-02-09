# c0dee.me Server

Backend API for remote browser control.

## Quick Start

### 1. Setup (once)
```
setup.bat
```
- Installs cloudflared
- Configures api.c0dee.me tunnel
- Sets password

### 2. Start
```
start.bat
```
- Runs Node.js server
- Starts Cloudflare tunnel
- Launches browser in kiosk mode

### 3. Use
- Visit https://c0dee.me from any device
- Enter your password
- Control the browser remotely

## Architecture

- **c0dee.me** → Frontend (HTML/JS)
- **api.c0dee.me** → This backend API
- **Cloudflare Tunnel** → Routes traffic to localhost:3000

## API Endpoints

- `POST /auth` - Authenticate with password
- `GET /frame` - Get screenshot (requires auth)
- `POST /input` - Send keyboard/mouse input (requires auth)

## Files

- `setup.bat` - One-time setup
- `start.bat` - Start everything
- `server.js` - Main API server
- `hash-password.js` - Password utility
- `.env` - Configuration (auto-generated)
