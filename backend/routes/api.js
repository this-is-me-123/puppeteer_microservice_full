import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = new Database('logs.db');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

// Enqueue a job for worker
router.post('/queue', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO jobs (id, folder, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.body.folder, 'queued', now, now);
  res.json({ id });
});

// Logs listing
router.get('/logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
  res.json(rows);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Backend is healthy' });
});

// ... existing auth and user routes

export default router;