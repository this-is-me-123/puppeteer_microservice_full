import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const dbPath = path.resolve("logs.db");
const schemaPath = path.resolve("db/schema-jobs.sql");

const db = new Database(dbPath);
const sql = fs.readFileSync(schemaPath, "utf-8");

db.exec(sql);
console.log("✅ jobs table created or already existed in", dbPath);
