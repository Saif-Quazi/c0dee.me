# c0dee.me Server

Simple remote browser control via c0dee.me

## Setup (One-time)

Run this once:

```
setup.bat
```

This will:
- Install cloudflared (if needed)
- Login to Cloudflare and create tunnel
- Configure c0dee.me DNS
- Set up your password

## Start Server

```
start.bat
```

This starts:
- Node.js server (port 3000)
- Cloudflare tunnel (exposes as c0dee.me)
- Browser in kiosk mode (Google.com)

Then visit **https://c0dee.me** from any device and enter your password.

## Troubleshooting

If you get "ERR_NAME_NOT_RESOLVED" or "Failed to fetch":

1. **Run `check-status.bat`** to see what's wrong
2. **If tunnel config is missing:** Run `setup.bat` again
3. **If tunnel isn't running:** Make sure `start.bat` is still running

## Files

- `setup.bat` - One-time setup
- `start.bat` - Start server + tunnel
- `check-status.bat` - Check if everything is running
- `server.js` - Main server code
