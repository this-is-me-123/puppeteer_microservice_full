import express from "express";
import {
  createDbConnection,
  runAsync,
  getAsync,
  allAsync,
  closeDbConnection
} from "../db/db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
// Use a single DB connection
const db = createDbConnection();

// List all jobs with pagination
router.get("/queue", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const { count: total } = await getAsync(
      db,
      "SELECT COUNT(*) as count FROM jobs"
    );
    const data = await allAsync(
      db,
      `SELECT id, folder, status, created_at, updated_at
       FROM jobs ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ page, limit, total, totalPages: Math.ceil(total / limit), data });
  } catch (err) {
    next(err);
  }
});

// Get single job details
router.get("/queue/:id", async (req, res, next) => {
  try {
    const job = await getAsync(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!job) return res.status(404).json({ error: "Not found" });
    try {
      job.result = job.result ? JSON.parse(job.result) : {};
    } catch (_) {
      job.result = {};
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// Enqueue a new job
router.post("/queue", async (req, res, next) => {
  try {
    const { folder } = req.body;
    const id = uuidv4();
    await runAsync(
      db,
      "INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')",
      [id, folder]
    );
    res.status(201).json({ id, folder, status: "queued" });
  } catch (err) {
    next(err);
  }
});

// Retry a failed job
router.post("/queue/:id/retry", async (req, res, next) => {
  try {
    const old = await getAsync(
      db,
      "SELECT folder FROM jobs WHERE id = ? AND status = 'failed'",
      [req.params.id]
    );
    if (!old) return res.status(404).json({ error: "Not found or not failed" });
    const id = uuidv4();
    await runAsync(
      db,
      "INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')",
      [id, old.folder]
    );
    res.json({ id, folder: old.folder, status: "queued" });
  } catch (err) {
    next(err);
  }
});

// Example teardown hook
process.on('SIGINT', () => {
  closeDbConnection(db);
  process.exit();
});

export default router;
