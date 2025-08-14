const express = require("express");
const axios = require("axios");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 3000;

const API_URL =
  "https://kaiz-apis.gleeze.com/api/lootedpinay?limit=1&apikey=e6485b43-45ea-4b33-9d58-30cc2704e901";

// MongoDB connection
const MONGO_URI =
  "mongodb+srv://mart1john2labaco3:NeyCqMwiUt5f9ssQ@gag.fftre6w.mongodb.net/?retryWrites=true&w=majority&appName=GAG";
const DB_NAME = "GAG";
const COLLECTION_NAME = "keys";

let db, keysCollection;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(DB_NAME);
    keysCollection = db.collection(COLLECTION_NAME);
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

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
app.post("/api/generate-key", async (req, res) => {
  const { password, hours, minutes, seconds } = req.body;
  if (password !== "11200805") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  let totalMs = 0;
  if (hours) totalMs += Number(hours) * 3600000;
  if (minutes) totalMs += Number(minutes) * 60000;
  if (seconds) totalMs += Number(seconds) * 1000;
  
  if (isNaN(totalMs) || totalMs <= 0) {
    totalMs = 60000; // default 1 minute
  }
  
  const key = "FREE_" + randomString(10);
  const expiresAt = Date.now() + totalMs;
  
  try {
    await keysCollection.insertOne({ key, expiresAt });
    res.json({ key, expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save key to database" });
  }
});

// API: Validate a key
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

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve keygen.html for admin
app.get("/keygen.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "keygen.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});