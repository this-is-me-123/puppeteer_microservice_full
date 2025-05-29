import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Derive __dirname from import.meta.url for reliable path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Factory to create a new Better-SQLite3 connection.
 * @param {string} [customPath] - Optional absolute path to the SQLite file.
 * @param {object} [options] - Optional Better-SQLite3 constructor options.
 *                            E.g., { verbose: console.log }
 * @returns {Database} - A new Database instance.
 */
export function createDbConnection(
  customPath,
  options = {}
) {
  // Resolve to default jobs.sqlite if no custom path provided
  const dbFile = customPath
    ? customPath
    : path.resolve(__dirname, "db", "jobs.sqlite");

  let db;
  try {
    db = new Database(dbFile, options);
  } catch (err) {
    console.error(`Failed to initialize database at ${dbFile}:`, err);
    process.exit(1); // Fail fast if the DB cannot be opened
  }

  return db;
}
