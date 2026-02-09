# c0dee.me Server

Simple remote browser control via c0dee.me

## Setup (One-time)

Run this once to install dependencies:

```
setup.bat
```

This will:
- Install cloudflared (if needed)
- Set up your password

## Start Server

```
start.bat
```

This starts everything you need:
- Node.js server (port 3000)
- Cloudflare tunnel (exposes as api.c0dee.me)
- Browser in kiosk mode (Google.com)

Then visit **https://c0dee.me** and enter your password to control the browser remotely.

## Files

- `setup.bat` - One-time setup
- `start.bat` - Start server + tunnel
- `server.js` - Main server code
- `hash-password.js` - Password hash generator
- `.env` - Your password hash (auto-generated)
