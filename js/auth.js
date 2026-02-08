const form = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

const SERVER_URL = "https://api.c0dee.me";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const password = document.getElementById("password").value;
  
  errorDiv.classList.remove("show");
  
  try {
    const res = await fetch(`${SERVER_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    
    if (!res.ok) {
      throw new Error("Invalid password or server unreachable");
    }
    
    const { token } = await res.json();
    
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("serverUrl", SERVER_URL);
    window.location.href = "app.html";
    
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.add("show");
  }
});
