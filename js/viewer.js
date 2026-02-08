const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const statusDot = document.getElementById("status");
const fpsCounter = document.getElementById("fps");
const disconnectBtn = document.getElementById("disconnect");

const token = sessionStorage.getItem("token");
const serverUrl = sessionStorage.getItem("serverUrl");

if (!token || !serverUrl) {
  window.location.href = "index.html";
}

let frameCount = 0;
let lastFpsUpdate = Date.now();
let active = true;

disconnectBtn.addEventListener("click", () => {
  active = false;
  sessionStorage.clear();
  window.location.href = "index.html";
});

async function pullFrame() {
  if (!active) return;
  
  try {
    const res = await fetch(`${serverUrl}/frame`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error("Session expired or server down");
    }
    
    const blob = await res.blob();
    const img = await createImageBitmap(blob);
    
    ctx.drawImage(img, 0, 0);
    statusDot.className = "";
    
    frameCount++;
    const now = Date.now();
    if (now - lastFpsUpdate >= 1000) {
      fpsCounter.textContent = `${frameCount} FPS`;
      frameCount = 0;
      lastFpsUpdate = now;
    }
    
    requestAnimationFrame(pullFrame);
    
  } catch (err) {
    statusDot.classList.add("disconnected");
    fpsCounter.textContent = "Disconnected";
    setTimeout(pullFrame, 2000);
  }
}

pullFrame();

window.sendInput = async (data) => {
  try {
    await fetch(`${serverUrl}/input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("Input send failed:", err);
  }
};
