const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const API_URL =
  "https://kaiz-apis.gleeze.com/api/lootedpinay?limit=1&apikey=e6485b43-45ea-4b33-9d58-30cc2704e901";

const KEY_FILE = "./key.json";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Helpers to load and save keys
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return [];
  const raw = fs.readFileSync(KEY_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveKeys(keys) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
}

// Generate random alphanumeric string for key suffix
function randomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// API: Fetch video data
app.get("/video-data", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (!data.videos || data.videos.length === 0) {
      return res.json({ error: "No videos found." });
    }

    res.json(data.videos[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching video data." });
  }
});

// API: Generate a new key (admin only)
app.post("/api/generate-key", (req, res) => {
  const { password, hours, minutes, seconds } = req.body;
  if (password !== "11200805") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Calculate total milliseconds for expiration
  let totalMs = 0;
  if (hours) totalMs += Number(hours) * 3600000;
  if (minutes) totalMs += Number(minutes) * 60000;
  if (seconds) totalMs += Number(seconds) * 1000;

  if (isNaN(totalMs) || totalMs <= 0) {
    totalMs = 60000; // default 1 minute
  }

  const key = "FREE_" + randomString(10);
  const expiresAt = Date.now() + totalMs;

  const keys = loadKeys();
  keys.push({ key, expiresAt });
  saveKeys(keys);

  res.json({ key, expiresAt });
});

// API: Validate a key (returns expiry if valid)
app.post("/api/validate-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ valid: false, reason: "No key provided" });

  const keys = loadKeys();
  const found = keys.find((k) => k.key === key);

  if (!found) return res.json({ valid: false, reason: "Key not found" });
  if (found.expiresAt < Date.now())
    return res.json({ valid: false, reason: "Key expired" });

  return res.json({ valid: true, expiresAt: found.expiresAt });
});

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve keygen.html for admin
app.get("/keygen.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "keygen.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});