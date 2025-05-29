import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("logs.db");
const schema = fs.readFileSync("schema-users-sessions.sql", "utf-8");

try {
  db.exec(schema);
  console.log("✅ Schema applied successfully.");
} catch (err) {
  console.error("❌ Failed to apply schema:", err.message);
}