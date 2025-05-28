const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("logs.db");
const logsDir = path.join(__dirname, "debug_logs");

db.serialize(() => {
  db.run(fs.readFileSync("./db/schema.sql", "utf-8"));

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO logs (folder, timestamp, status, finalUrl, error, captchaDetected)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  fs.readdirSync(logsDir).forEach(folder => {
    const metaPath = path.join(logsDir, folder, "meta.json");
    if (fs.existsSync(metaPath)) {
      const raw = fs.readFileSync(metaPath);
      const data = JSON.parse(raw);
      stmt.run(
        folder,
        data.timestamp || null,
        data.status || "unknown",
        data.finalUrl || null,
        data.error || null,
        data.captchaDetected ? 1 : 0
      );
    }
  });

  stmt.finalize();
  db.close();
});
