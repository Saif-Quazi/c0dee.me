const screen = document.getElementById("screen");

const BLOCKED_KEYS = new Set([
  "Meta",
  "OS",
  "ContextMenu"
]);

const BLOCKED_COMBOS = [
  { ctrl: true, alt: true, key: "Delete" },
  { alt: true, key: "Tab" },
  { alt: true, key: "F4" },
  { ctrl: true, shift: true, key: "Escape" }
];

let lastEventTime = 0;
const MIN_EVENT_INTERVAL = 16;

function isBlocked(e) {
  if (BLOCKED_KEYS.has(e.key)) return true;
  
  for (const combo of BLOCKED_COMBOS) {
    if (
      (combo.ctrl === undefined || combo.ctrl === e.ctrlKey) &&
      (combo.alt === undefined || combo.alt === e.altKey) &&
      (combo.shift === undefined || combo.shift === e.shiftKey) &&
      combo.key === e.key
    ) {
      return true;
    }
  }
  
  return false;
}

function shouldThrottle() {
  const now = Date.now();
  if (now - lastEventTime < MIN_EVENT_INTERVAL) {
    return true;
  }
  lastEventTime = now;
  return false;
}

screen.addEventListener("mousemove", (e) => {
  if (shouldThrottle()) return;
  
  const rect = screen.getBoundingClientRect();
  const scaleX = 1280 / rect.width;
  const scaleY = 720 / rect.height;
  
  const screenX = Math.floor(e.offsetX * scaleX);
  const screenY = Math.floor(e.offsetY * scaleY);
  
  window.sendInput({
    type: "mousemove",
    x: screenX,
    y: screenY
  });
});

screen.addEventListener("mousedown", (e) => {
  e.preventDefault();
  window.sendInput({
    type: "mousedown",
    button: e.button
  });
});

screen.addEventListener("mouseup", (e) => {
  e.preventDefault();
  window.sendInput({
    type: "mouseup",
    button: e.button
  });
});

screen.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (shouldThrottle()) return;
  
  window.sendInput({
    type: "wheel",
    deltaX: e.deltaX,
    deltaY: e.deltaY
  });
});

// Keyboard events
document.addEventListener("keydown", (e) => {
  if (isBlocked(e)) {
    e.preventDefault();
    console.warn("Blocked key:", e.key);
    return;
  }
  
  e.preventDefault();
  window.sendInput({
    type: "keydown",
    key: e.key,
    code: e.code
  });
});

document.addEventListener("keyup", (e) => {
  if (isBlocked(e)) {
    e.preventDefault();
    return;
  }
  
  e.preventDefault();
  window.sendInput({
    type: "keyup",
    key: e.key,
    code: e.code
  });
});

screen.addEventListener("contextmenu", (e) => e.preventDefault());
