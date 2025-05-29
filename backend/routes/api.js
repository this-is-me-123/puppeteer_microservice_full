import express from "express";
import db from "../db.js";                // adjust path as needed
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// List all jobs with pagination
router.get("/queue", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM jobs`
  ).get().count;

  const rows = db.prepare(
    `SELECT id, folder, status, created_at, updated_at
     FROM jobs
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).all(limit, offset);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: rows
  });
});

// Get single job details
router.get("/queue/:id", (req, res) => {
  const job = db
    .prepare(`SELECT * FROM jobs WHERE id = ?`)
    .get(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });

  try {
    job.result = job.result ? JSON.parse(job.result) : {};
  } catch (err) {
    console.error(`Failed to parse job.result for ID ${job.id}:`, err);
    job.result = {};
  }

  res.json(job);
});

// Shared helper to insert a new job
function enqueueJob(folder) {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')`
  ).run(id, folder);
  return id;
}

// Enqueue a new job
router.post("/queue", (req, res) => {
  let { folder } = req.body;

  // Basic type and presence validation
  if (typeof folder !== 'string') {
    return res.status(400).json({ error: "Folder must be a string" });
  }
  folder = folder.trim();
  if (!folder) {
    return res.status(400).json({ error: "Folder cannot be empty" });
  }

  // Sanitization: allow only alphanumeric, dashes, underscores, and slashes
  const sanitized = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '');
  if (sanitized !== folder) {
    return res.status(400).json({ error: "Folder contains invalid characters" });
  }

  const id = enqueueJob(sanitized);
  res.status(201).json({ id, folder: sanitized, status: "queued" });
});

// Retry a failed job
router.post("/queue/:id/retry", (req, res) => {
  const old = db
    .prepare(`SELECT folder FROM jobs WHERE id = ? AND status = 'failed'`)
    .get(req.params.id);
  if (!old) return res.status(404).json({ error: "Not found or not failed" });

  const id = enqueueJob(old.folder);
  res.json({ id, folder: old.folder, status: "queued" });
});

export default router;
