// Helper script to generate password hash
// Usage: node hash-password.js your_password_here

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const password = process.argv[2];
const autoSave = process.argv[3] === "--save";

if (!password) {
  console.error("Usage: node hash-password.js <password>");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(password).digest("hex");

if (autoSave) {
  const envPath = path.join(__dirname, ".env");
  const envContent = `PORT=3000\nPASSWORD_HASH=${hash}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log("✓ Password saved to .env");
} else {
  console.log("\nGenerated SHA-256 hash:");
  console.log(hash);
  console.log("\nAdd to .env file:");
  console.log(`PASSWORD_HASH=${hash}`);
}
