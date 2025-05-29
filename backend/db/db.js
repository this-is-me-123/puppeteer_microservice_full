import Database from "better-sqlite3";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Maximum number of cached connections
const MAX_CACHE_SIZE = 10;
// Cache for database connections, keyed by file path, storing insertion order for LRU eviction
const connectionCache = new Map();

/**
 * Factory to create or reuse a Better-SQLite3 connection.
 * Implements an LRU cache with a max size to avoid unbounded growth.
 * Merges environment-based defaults with provided options for flexibility.
 * Allows overriding the default database file via the DB_FILE environment variable.
 *
 * Throws an error if the database cannot be opened. Callers should handle exceptions
 * to avoid unhandled runtime errors and to implement clean shutdown or retries.
 *
 * @param {string} [customPath] - Optional absolute path to the SQLite file.
 * @param {object} [options] - Optional Better-SQLite3 constructor options.
 * @throws {Error} If opening the database fails.
 * @returns {Database} - A Database instance (cached or new).
 */
export function createDbConnection(customPath, options) {
  // Determine the SQLite file path, allowing environment override
  const defaultDbFile = process.env.DB_FILE
    ? path.resolve(__dirname, process.env.DB_FILE)
    : path.resolve(__dirname, "jobs.sqlite");
  const dbFile = customPath || defaultDbFile;

  // If cached, move to end to mark as recently used
  if (connectionCache.has(dbFile)) {
    const dbCached = connectionCache.get(dbFile);
    connectionCache.delete(dbFile);
    connectionCache.set(dbFile, dbCached);
    return dbCached;
  }

  // Merge environment-based defaults with provided options
  const defaultOptions = process.env.DB_LOG_LEVEL === 'verbose'
    ? { verbose: console.log }
    : {};
  const mergedOptions = { ...defaultOptions, ...(options || {}) };

  // Create a new connection, throwing on failure
  let db;
  try {
    db = new Database(dbFile, mergedOptions);
  } catch (err) {
    console.error(`Failed to initialize database at ${dbFile}:`, err);
    throw new Error(`Database initialization error: ${err.message}`);
  }

  // Evict least-recently-used connection if cache limit exceeded
  if (connectionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = connectionCache.keys().next().value;
    const oldestDb = connectionCache.get(oldestKey);
    try {
      oldestDb.close();
    } catch (closeErr) {
      console.error(`Error closing database connection for ${oldestKey}:`, closeErr);
    }
    connectionCache.delete(oldestKey);
  }

  connectionCache.set(dbFile, db);
  return db;
}

/**
 * Close a specific database connection or all if no path is provided.
 * @param {string} [customPath] - Optional path of the SQLite file to close. Defaults to all.
 */
export function closeDbConnection(customPath) {
  if (customPath) {
    const db = connectionCache.get(customPath);
    if (db) {
      try {
        db.close();
      } catch (err) {
        console.error(`Error closing database for ${customPath}:`, err);
      }
      connectionCache.delete(customPath);
    }
  } else {
    // Close all connections
    for (const [key, db] of connectionCache.entries()) {
      try {
        db.close();
      } catch (err) {
        console.error(`Error closing database for ${key}:`, err);
      }
    }
    connectionCache.clear();
  }
}

// Optional: Close all on process exit
process.on('SIGINT', () => {
  closeDbConnection();
  process.exit();
});
process.on('SIGTERM', () => {
  closeDbConnection();
  process.exit();
});
