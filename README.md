# c0dee.me

Remote browser control system. Access and control a browser running on your home PC from anywhere via https://c0dee.me.

## How It Works

**Public Side (GitHub Pages)**
- Static HTML/CSS/JS hosted at https://c0dee.me
- Login UI → authenticates with home server
- Viewer → polls JPEG frames via HTTPS GET
- Input → sends keyboard/mouse via HTTPS POST
- No WebRTC, no UDP, no WebSockets

**Private Side (Home PC)**
- Node.js server bound to localhost (127.0.0.1:3000)
- Launches Chromium in kiosk mode (1280×720, no UI)
- Captures screenshots → compresses to JPEG → serves to authenticated clients
- Receives input → executes via robotjs
- Exposed via Cloudflare Tunnel (automatic HTTPS)

**Flow**
```
User → c0dee.me (GitHub Pages) → api.c0dee.me (Cloudflare Tunnel) → Home PC Server
```

All traffic looks like standard HTTPS website requests.

---

## Stack

**Frontend:** HTML + CSS + Vanilla JS  
**Backend:** Node.js + Express  
**Transport:** HTTPS GET (frames) + POST (input)  
**Rendering:** JPEG (65% quality, ~12 FPS)  
**Browser:** Chrome/Edge in kiosk mode

---

## Setup

### One-Time Setup

**1. Home PC - Install Cloudflare Tunnel**

```powershell
# Install cloudflared
winget install Cloudflare.cloudflared

# Setup tunnel (creates api.c0dee.me DNS record)
cd server
.\setup-tunnel.ps1
```

This maps `api.c0dee.me` → your home PC (localhost:3000).

**2. Home PC - Configure Server**

```powershell
cd server
npm install

# Create .env file
Copy-Item .env.example .env
node hash-password.js YourPassword
# Paste hash into .env
```

**3. GitHub Pages**

```powershell
# Commit and push
git add .
git commit -m "Add remote browser"
git push origin main
```

Enable Pages: Settings → Pages → Deploy from `main` branch

### Daily Use

**Start everything:**

```powershell
# Terminal 1: Start server
cd server
node server.js

# Terminal 2: Start tunnel (if not running as service)
cloudflared tunnel run c0dee-server
```

**Or install as services (auto-start at boot):**

```powershell
# Server as service
cd server
.\install-service.ps1

# Tunnel as service (done during setup-tunnel.ps1)
Start-Service cloudflared
```

**Access:**
1. Go to https://c0dee.me
2. Enter password
3. Done!

---

## Input Surface Reduction

The system filters dangerous OS-level shortcuts to prevent breaking out of the browser session.

**Blocked Keys:**
- Windows/Meta key (prevents Start menu)
- Alt+Tab (prevents task switching)
- Alt+F4 (prevents window closing)
- Ctrl+Alt+Del (prevents security screen)
- Ctrl+Shift+Esc (prevents Task Manager)

**Allowed:**
- All normal typing (a-z, 0-9, symbols)
- Browser shortcuts (Ctrl+T, Ctrl+W, etc.)
- DevTools (F12, Ctrl+Shift+I)
- Copy/paste (Ctrl+C, Ctrl+V)
- Function keys (F1-F12)
- Mouse input (click, scroll, movement)

**Rate Limiting:**
- Client-side: 60 events/sec (prevents UI lag)
- Server-side: 60 events/sec per session (prevents DoS)

Implementation: [js/input.js](js/input.js) filters before sending, [server/server.js](server/server.js) validates on receipt.

---

## Simple Threat Model

| Threat | Mitigation |
|--------|------------|
| Brute-force password | 1-second delay on failed attempts |
| Session hijacking | 8-hour token expiration, HTTPS only |
| Input flooding (DoS) | Rate limit 60 events/sec server-side |
| Escape to Windows | Block Win key, Alt+Tab, Ctrl+Alt+Del |
| Unauthorized access | Bearer token required on all endpoints |
| MITM attack | Traffic over Cloudflare Tunnel HTTPS |

**In Scope:**
- Unauthorized remote browser access
- Session token theft
- Input event abuse
- Breaking out of browser to OS

**Out of Scope:**
- Physical access to PC
- Malware on PC
- Advanced privilege escalation
- Social engineering

---

## Running the Home PC Server

### Manual Start

```powershell
cd server
node server.js
```

Server will:
1. Bind to `http://127.0.0.1:3000`
2. Launch browser in kiosk mode (Chrome or Edge)
3. Start capturing screenshots

### Auto-Run at Boot

```powershell
# Run once as Administrator
cd server
.\install-service.ps1
```

Service commands:
```powershell
Start-Service c0deeServer
Stop-Service c0deeServer
Get-Service c0deeServer
```

Logs: `server/service.log`

### Manual Browser Launch

If auto-launch fails, start browser manually:

```powershell
# Chrome
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --window-size=1280,720 about:blank

# Edge
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --window-size=1280,720 about:blank
```

---

## Startup / Auto-Run Behavior

When installed as a service:

1. **At Boot**: Service starts automatically
2. **Server Starts**: Binds to localhost:3000
3. **Browser Launches**: Chrome/Edge in kiosk mode (1280×720)
4. **Ready**: Server accepts connections via Cloudflare Tunnel

Browser runs in kiosk mode:
- No address bar
- No tabs
- No menus
- Fullscreen on display
- All input comes from remote client only

**Security Note**: Consider running under dedicated Windows user with restricted permissions.

---

## Security

- Password hashed with SHA-256 (server-side)
- Session tokens: 256-bit random, 8-hour expiration
- Server binds to localhost only
- Input filtering blocks OS escape keys
- Rate limiting prevents abuse
- CORS restricted to c0dee.me domain

---

## Structure

```
/
├─ index.html         # Login page
├─ app.html           # Browser viewer
├─ css/main.css       # Styles
├─ js/
│  ├─ auth.js         # Authentication
│  ├─ viewer.js       # Frame polling
│  └─ input.js        # Input filtering
└─ server/
   ├─ server.js       # Node.js server
   ├─ package.json
   ├─ hash-password.js
   ├─ smokeTest.js
   └─ install-service.ps1
```

---

## Credits

Made by [Saif Q.](https://saifq.co)
