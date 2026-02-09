const express = require("express");
const http = require("http");
const crypto = require("crypto");
const screenshot = require("screenshot-desktop");
const sharp = require("sharp");
const robot = require("robotjs");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const app = express();
app.use(express.json());

const PASSWORD_HASH = process.env.PASSWORD_HASH;
const PORT = process.env.PORT || 3000;

if (!PASSWORD_HASH) {
  console.error("ERROR: PASSWORD_HASH environment variable required");
  console.log("Run: node hash-password.js YourPassword");
  process.exit(1);
}

const sessions = new Map();
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function validateToken(token) {
  const session = sessions.get(token);
  if (!session) return false;
  
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(token);
    return false;
  }
  
  session.lastActivity = Date.now();
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes("c0dee.me") || origin.includes("github.io") || origin.includes("localhost"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  
  next();
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>c0dee.me</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖥️</text></svg>">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f8f9fa;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          max-width: 400px;
          padding: 40px;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #e8f5e9;
          border-radius: 20px;
          color: #2e7d32;
          font-size: 14px;
          font-weight: 500;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: #4caf50;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>c0dee.me</h1>
        <div class="status">
          <span class="dot"></span>
          Server running
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.post("/auth", (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }
  
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  
  if (hash !== PASSWORD_HASH) {
    setTimeout(() => res.status(401).json({ error: "Invalid password" }), 1000);
    return;
  }
  
  const token = generateToken();
  sessions.set(token, { lastActivity: Date.now() });
  
  res.json({ token });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }
  
  const token = auth.slice(7);
  if (!validateToken(token)) {
    return res.sendStatus(401);
  }
  
  next();
}

let frame = null;

async function captureLoop() {
  try {
    const img = await screenshot({ format: "png" });
    frame = await sharp(img)
      .resize(1280, 720, { fit: "contain", background: { r: 0, g: 0, b: 0 } })
      .jpeg({ quality: 65, chromaSubsampling: "4:2:0" })
      .toBuffer();
  } catch (err) {
    console.error("Screenshot error:", err.message);
  }
  setTimeout(captureLoop, 80);
}

captureLoop();

app.get("/frame", requireAuth, (req, res) => {
  if (!frame) return res.sendStatus(204);
  
  res.set({
    "Content-Type": "image/jpeg",
    "Cache-Control": "no-store"
  });
  res.send(frame);
});

const inputRateLimit = new Map();
const MAX_INPUT_PER_SEC = 60;

app.post("/input", requireAuth, (req, res) => {
  const token = req.headers.authorization.slice(7);
  
  const now = Date.now();
  const rateData = inputRateLimit.get(token) || { count: 0, resetTime: now + 1000 };
  
  if (now > rateData.resetTime) {
    rateData.count = 0;
    rateData.resetTime = now + 1000;
  }
  
  if (rateData.count >= MAX_INPUT_PER_SEC) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  
  rateData.count++;
  inputRateLimit.set(token, rateData);
  
  const { type, x, y, button, key, code, deltaX, deltaY } = req.body;
  
  try {
    if (type === "mousemove") {
      robot.moveMouse(Math.floor(x), Math.floor(y));
    }
    else if (type === "mousedown") {
      const btn = button === 2 ? "right" : button === 1 ? "middle" : "left";
      robot.mouseToggle("down", btn);
    }
    else if (type === "mouseup") {
      const btn = button === 2 ? "right" : button === 1 ? "middle" : "left";
      robot.mouseToggle("up", btn);
    }
    else if (type === "wheel") {
      robot.scrollMouse(Math.floor(deltaX), Math.floor(deltaY));
    }
    else if (type === "keydown" || type === "keyup") {
      const robotKey = mapKey(key, code);
      if (robotKey) {
        robot.keyToggle(robotKey, type === "keydown" ? "down" : "up");
      }
    }
    
    res.sendStatus(200);
  } catch (err) {
    console.error("Input error:", err.message);
    res.status(500).json({ error: "Input failed" });
  }
});

function mapKey(key, code) {
  const directMap = {
    "Enter": "enter",
    "Escape": "escape",
    "Backspace": "backspace",
    "Tab": "tab",
    "Shift": "shift",
    "Control": "control",
    "Alt": "alt",
    "CapsLock": "capslock",
    "Space": "space",
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowLeft": "left",
    "ArrowRight": "right",
    "Home": "home",
    "End": "end",
    "PageUp": "pageup",
    "PageDown": "pagedown",
    "Delete": "delete",
    "Insert": "insert",
    "PrintScreen": "printscreen",
    "ScrollLock": "scrolllock",
    "Pause": "pause",
  };
  
  if (directMap[key]) return directMap[key];
  
  if (key.startsWith("F") && key.length <= 3) {
    const num = parseInt(key.slice(1));
    if (num >= 1 && num <= 12) return key.toLowerCase();
  }
  
  if (key.length === 1) return key.toLowerCase();
  
  return null;
}

function launchBrowser() {
  const browserPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  
  const browserPath = browserPaths.find(p => fs.existsSync(p));
  
  if (!browserPath) {
    console.log("⚠ Browser not found - skipping auto-launch");
    console.log("  Launch manually in kiosk mode for remote control");
    return;
  }
  
  const args = [
    "--kiosk",
    "--window-size=1280,720",
    "--window-position=0,0",
    "--disable-infobars",
    "--disable-session-crashed-bubble",
    "--disable-restore-session-state",
    "--no-first-run",
    "--no-default-browser-check",
    "https://www.google.com"
  ];
  
  console.log(`✓ Launching browser: ${path.basename(browserPath)}`);
  console.log("✓ Browser starting at Google.com");
  spawn(browserPath, args, { detached: true, stdio: "ignore" }).unref();
}

http.createServer(app).listen(PORT, "127.0.0.1", () => {
  console.log(`✓ Server running on http://127.0.0.1:${PORT}`);
  console.log(`✓ Waiting for tunnel connection...`);
  
  if (process.env.LAUNCH_BROWSER !== "false") {
    setTimeout(launchBrowser, 2000);
  }
});
