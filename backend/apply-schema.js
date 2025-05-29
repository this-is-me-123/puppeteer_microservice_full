import fs from "fs";
import { createDbConnection, runAsync, closeDbConnection } from "./db/db.js";

(async () => {
  const db = await createDbConnection();
  const schema = fs.readFileSync("schema.sql", "utf8");
  // split into statements if needed
  for (const stmt of schema.split(";").map(s => s.trim()).filter(Boolean)) {
    await runAsync(stmt);
  }
  closeDbConnection();
  console.log("Schema applied successfully");
})().catch(err => {
  console.error("Failed to apply schema:", err);
  process.exit(1);
});