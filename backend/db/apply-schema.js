import fs from "fs";
import { runAsync } from "./db/applySchemaUtils.js";

(async () => {
  const schema = fs.readFileSync("db/schema.sql", "utf8");
  for (const stmt of schema.split(";").map(s => s.trim()).filter(Boolean)) {
    await runAsync(stmt);
  }
  console.log("Schema applied successfully");
})();
