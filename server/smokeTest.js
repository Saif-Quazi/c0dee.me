const crypto = require("crypto");
const https = require("https");

const TEST_PASSWORD = "test123";
const TEST_HASH = crypto.createHash("sha256").update(TEST_PASSWORD).digest("hex");

console.log("🧪 Smoke Test: c0dee.me server\n");

const tests = {
  passed: 0,
  failed: 0
};

function pass(name) {
  console.log(`✓ ${name}`);
  tests.passed++;
}

function fail(name, error) {
  console.log(`✗ ${name}: ${error}`);
  tests.failed++;
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "127.0.0.1",
      port: process.env.PORT || 3000,
      path,
      method: options.method || "GET",
      headers: options.headers || {},
      rejectUnauthorized: false
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  let token = null;

  try {
    const authRes = await makeRequest("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { password: "wrong_password" }
    });
    
    if (authRes.status === 401) {
      pass("Invalid password rejected");
    } else {
      fail("Invalid password check", `Expected 401, got ${authRes.status}`);
    }
  } catch (err) {
    fail("Invalid password check", err.message);
  }

  try {
    const authRes = await makeRequest("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { password: TEST_PASSWORD }
    });
    
    if (authRes.status === 200) {
      const parsed = JSON.parse(authRes.data);
      token = parsed.token;
      if (token && token.length === 64) {
        pass("Valid password returns token");
      } else {
        fail("Token validation", "Token format invalid");
      }
    } else {
      fail("Valid password check", `Expected 200, got ${authRes.status}`);
    }
  } catch (err) {
    fail("Valid password check", err.message);
  }

  try {
    const frameRes = await makeRequest("/frame");
    if (frameRes.status === 401) {
      pass("Frame endpoint requires auth");
    } else {
      fail("Frame auth check", `Expected 401, got ${frameRes.status}`);
    }
  } catch (err) {
    fail("Frame auth check", err.message);
  }

  if (token) {
    try {
      const frameRes = await makeRequest("/frame", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (frameRes.status === 200 || frameRes.status === 204) {
        if (frameRes.headers["content-type"] === "image/jpeg" || frameRes.status === 204) {
          pass("Frame endpoint returns image");
        } else {
          fail("Frame format check", "Not JPEG");
        }
      } else {
        fail("Frame fetch", `Expected 200/204, got ${frameRes.status}`);
      }
    } catch (err) {
      fail("Frame fetch", err.message);
    }

    try {
      const inputRes = await makeRequest("/input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: { type: "mousemove", x: 100, y: 100 }
      });
      
      if (inputRes.status === 200) {
        pass("Input endpoint accepts mousemove");
      } else {
        fail("Input endpoint", `Expected 200, got ${inputRes.status}`);
      }
    } catch (err) {
      fail("Input endpoint", err.message);
    }

    try {
      let rateLimited = false;
      for (let i = 0; i < 70; i++) {
        const res = await makeRequest("/input", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: { type: "mousemove", x: i, y: i }
        });
        
        if (res.status === 429) {
          rateLimited = true;
          break;
        }
      }
      
      if (rateLimited) {
        pass("Rate limiting enforced");
      } else {
        fail("Rate limiting", "Did not receive 429 status");
      }
    } catch (err) {
      fail("Rate limiting", err.message);
    }
  }

  try {
    const corsRes = await makeRequest("/auth", {
      method: "OPTIONS",
      headers: { "Origin": "https://c0dee.me" }
    });
    
    if (corsRes.status === 204) {
      pass("CORS OPTIONS handled");
    } else {
      fail("CORS check", `Expected 204, got ${corsRes.status}`);
    }
  } catch (err) {
    fail("CORS check", err.message);
  }

  console.log(`\n📊 Results: ${tests.passed} passed, ${tests.failed} failed\n`);
  
  if (tests.failed === 0) {
    console.log("✨ All tests passed!\n");
    process.exit(0);
  } else {
    console.log("⚠️ Some tests failed\n");
    process.exit(1);
  }
}

console.log("Prerequisites:");
console.log("  1. Server must be running (node server.js)");
console.log("  2. Set PASSWORD_HASH=" + TEST_HASH);
console.log("  3. Cert files must exist (cert.pem, key.pem)\n");

setTimeout(runTests, 1000);
