import express from "express";
import {
  createDbConnection,
  allAsync,
  getAsync,
  runAsync,
  closeDbConnection
} from "../db/db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
let db;

// Initialize SQL.js connection at startup
(async () => {
  try {
    db = await createDbConnection();
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
})();

// List all jobs with pagination
router.get("/queue", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const totalRow = getAsync(
      "SELECT COUNT(*) as count FROM jobs"
    );
    const total = totalRow ? totalRow.count : 0;

    const data = allAsync(
      `SELECT id, folder, status, created_at, updated_at
       FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ page, limit, total, totalPages: Math.ceil(total / limit), data });
  } catch (err) {
    next(err);
  }
});

// Get single job details
router.get("/queue/:id", (req, res, next) => {
  try {
    const job = getAsync(
      "SELECT * FROM jobs WHERE id = ?",
      [req.params.id]
    );
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
router.post("/queue", (req, res, next) => {
  (async () => {
    try {
      const { folder } = req.body;
      const id = uuidv4();
      await runAsync(
        "INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')",
        [id, folder]
      );
      res.status(201).json({ id, folder, status: "queued" });
    } catch (err) {
      next(err);
    }
  })();
});

// Retry a failed job
router.post("/queue/:id/retry", (req, res, next) => {
  (async () => {
    try {
      const old = getAsync(
        "SELECT folder FROM jobs WHERE id = ? AND status = 'failed'",
        [req.params.id]
      );
      if (!old) return res.status(404).json({ error: "Not found or not failed" });
      const id = uuidv4();
      await runAsync(
        "INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')",
        [id, old.folder]
      );
      res.json({ id, folder: old.folder, status: "queued" });
    } catch (err) {
      next(err);
    }
  })();
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDbConnection();
  process.exit();
});
process.on('SIGTERM', () => {
  closeDbConnection();
  process.exit();
});

export default router;
