// app.js
const express = require("express");
const axios = require("axios");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 3000;

const API_URL =
  "https://kaiz-apis.gleeze.com/api/lootedpinay?limit=1&apikey=e6485b43-45ea-4b33-9d58-30cc2704e901";

// ====== CONFIG ======
const MONGO_URI =
  "mongodb+srv://mart1john2labaco3:NeyCqMwiUt5f9ssQ@gag.fftre6w.mongodb.net/?retryWrites=true&w=majority&appName=GAG";
const DB_NAME = "GAG";
const COLLECTION_NAME = "keys";
const ADMIN_PASSWORD = "11200805";
// =====================

let db, keysCollection;

// Express middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Generate random alphanumeric string for key suffix
function randomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== API: Fetch video data =====
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

// ===== API: Generate key (admin) =====
app.post("/api/generate-key", async (req, res) => {
  const { password, hours, minutes, seconds } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  let totalMs = 0;
  if (hours) totalMs += Number(hours) * 3600000;
  if (minutes) totalMs += Number(minutes) * 60000;
  if (seconds) totalMs += Number(seconds) * 1000;
  if (isNaN(totalMs) || totalMs <= 0) totalMs = 60000; // default 1 min
  
  const key = "FREE_" + randomString(10);
  const expiresAt = Date.now() + totalMs;
  
  try {
    await keysCollection.insertOne({ key, expiresAt, createdAt: new Date() });
    res.json({ key, expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save key to database" });
  }
});

// ===== API: Validate key =====
app.post("/api/validate-key", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ valid: false, reason: "No key provided" });
  
  try {
    const found = await keysCollection.findOne({ key });
    if (!found) return res.json({ valid: false, reason: "Key not found" });
    if (found.expiresAt < Date.now())
      return res.json({ valid: false, reason: "Key expired" });
    
    return res.json({ valid: true, expiresAt: found.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error while validating key" });
  }
});

// ===== API: Admin Reset (DELETE ALL KEYS) =====
app.post("/api/admin/reset-keys", async (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const result = await keysCollection.deleteMany({});
    res.json({
      ok: true,
      deletedCount: result.deletedCount || 0,
      message: "All keys have been deleted.",
    });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ error: "Failed to reset keys." });
  }
});

// ===== API: Admin Stats =====
app.get("/api/admin/stats", async (_req, res) => {
  try {
    const total = await keysCollection.countDocuments({});
    const active = await keysCollection.countDocuments({ expiresAt: { $gt: Date.now() } });
    res.json({ total, active, serverTime: Date.now() });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to get stats." });
  }
});

// ===== Routes for pages =====
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/keygen.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "keygen.html"));
});

// ===== Connect DB and start server AFTER connection =====
(async () => {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    keysCollection = db.collection(COLLECTION_NAME);
    console.log("✅ Connected to MongoDB");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
})();