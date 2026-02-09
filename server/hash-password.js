// Helper script to generate password hash
// Usage: node hash-password.js your_password_here

const crypto = require("crypto");
const fs = require("fs");

const password = process.argv[2];
const autoSave = process.argv[3] === "--save";

if (!password) {
  console.error("Usage: node hash-password.js <password> [--save]");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(password).digest("hex");

if (autoSave) {
  fs.writeFileSync(".env", `PORT=3000\nPASSWORD_HASH=${hash}\n`);
  console.log("Password saved to .env");
} else {
  console.log("\nPassword hash:");
  console.log(hash);
  console.log("\nAdd to .env:");
  console.log(`PASSWORD_HASH=${hash}`);
}
