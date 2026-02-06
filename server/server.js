const express = require("express");
const screenshot = require("screenshot-desktop");
const sharp = require("sharp");
const robot = require("robotjs");

const app = express();
app.use(express.json());

const ACCESS_KEY = process.env.ACCESS_KEY || "changeme";

app.use((req, res, next) => {
  if (req.headers["x-access-key"] !== ACCESS_KEY) {
    return res.sendStatus(401);
  }
  next();
});

let frame = null;

async function loop() {
  try {
    const img = await screenshot({ format: "png" });
    frame = await sharp(img)
      .resize(1280, 720)
      .jpeg({ quality: 65 })
      .toBuffer();
  } catch {}
  setTimeout(loop, 80); // ~12 FPS
}
loop();

app.get("/frame", (req, res) => {
  if (!frame) return res.sendStatus(204);
  res.set("Content-Type", "image/jpeg");
  res.send(frame);
});

app.post("/input", (req, res) => {
  const { t, x, y, b, k } = req.body;

  if (t === "mm") robot.moveMouse(x, y);
  if (t === "md") robot.mouseToggle("down", b || "left");
  if (t === "mu") robot.mouseToggle("up", b || "left");
  if (t === "kd") robot.keyToggle(k, "down");
  if (t === "ku") robot.keyToggle(k, "up");

  res.sendStatus(200);
});

app.listen(3000);
