import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { saveConversion, listConversions, DB_PATH } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 60001;

const app = express();
app.use(express.json({ limit: "5mb" }));

// --- API ---------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: DB_PATH });
});

// Persist a pasted input together with its generated markdown.
app.post("/api/conversions", (req, res) => {
  const { raw, markdown } = req.body ?? {};
  if (typeof raw !== "string" || typeof markdown !== "string") {
    return res
      .status(400)
      .json({ error: "Both 'raw' and 'markdown' string fields are required." });
  }
  if (!raw.trim() && !markdown.trim()) {
    return res.status(400).json({ error: "Nothing to save." });
  }
  try {
    const row = saveConversion({ raw, markdown });
    res.status(201).json(row);
  } catch (err) {
    console.error("Failed to save conversion:", err);
    res.status(500).json({ error: "Failed to save conversion." });
  }
});

// Recent conversion history.
app.get("/api/conversions", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  try {
    res.json(listConversions(limit));
  } catch (err) {
    console.error("Failed to list conversions:", err);
    res.status(500).json({ error: "Failed to list conversions." });
  }
});

// --- Static frontend + SPA fallback -----------------------------------

app.use(express.static(DIST_DIR));
app.get("*", (_req, res) => {
  res.sendFile(join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Clipboard2MD listening on http://localhost:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});
