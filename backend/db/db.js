import sqlite3 from "sqlite3";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default database file path
const defaultDbFile = process.env.DB_FILE
  ? path.resolve(__dirname, process.env.DB_FILE)
  : path.resolve(__dirname, "jobs.sqlite");

/**
 * Opens a SQLite3 database connection.
 * @param {string} [customPath] - Optional path to the SQLite file.
 * @returns {sqlite3.Database} - A Database instance.
 * @throws {Error} If opening the database fails.
 */
export function createDbConnection(customPath) {
  const dbFile = customPath || defaultDbFile;
  const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error(`Failed to open database at ${dbFile}:`, err);
      throw err;
    }
  });
  return db;
}

/**
 * Close a SQLite3 database connection.
 * @param {sqlite3.Database} db - The database instance to close.
 */
export function closeDbConnection(db) {
  if (db) {
    db.close((err) => {
      if (err) console.error("Error closing the database:", err);
    });
  }
}

/**
 * Runs a SQL command (INSERT/UPDATE/DELETE) and returns a promise.
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL statement.
 * @param {any[]} [params] - Optional parameters for the statement.
 * @returns {Promise<sqlite3.RunResult>} Resolves with result metadata.
 */
export function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // contains lastID, changes
    });
  });
}

/**
 * Retrieves a single row and returns a promise.
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL statement.
 * @param {any[]} [params] - Optional parameters for the statement.
 * @returns {Promise<any>} Resolves with the row or undefined.
 */
export function getAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * Retrieves all matching rows and returns a promise.
 * @param {sqlite3.Database} db - The database instance.
 * @param {string} sql - The SQL statement.
 * @param {any[]} [params] - Optional parameters for the statement.
 * @returns {Promise<any[]>} Resolves with an array of rows.
 */
export function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
