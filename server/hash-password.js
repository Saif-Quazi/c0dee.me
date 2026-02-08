// Helper script to generate password hash
// Usage: node hash-password.js your_password_here

const crypto = require("crypto");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node hash-password.js <password>");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(password).digest("hex");

console.log("\nGenerated SHA-256 hash:");
console.log(hash);
console.log("\nSet as environment variable:");
console.log(`$env:PASSWORD_HASH="${hash}"`);
console.log("\nOr add to .env file:");
console.log(`PASSWORD_HASH=${hash}`);
