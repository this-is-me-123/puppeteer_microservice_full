import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const router = express.Router();
const db = new Database("logs.db");
const SECRET = "supersecret";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  const hashed = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run(username, hashed);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
  const user = stmt.get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "2h" });
  res.json({ token });
});

router.get("/check-auth", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

router.get("/logs", authenticateToken, (req, res) => {
  const { filter, start, end } = req.query;
  const conditions = [];
  const params = [];

  if (filter === "success") conditions.push("status = ?");
  else if (filter === "error") conditions.push("status = ?");
  else if (filter === "captcha") conditions.push("captchaDetected = ?");
  if (filter === "success" || filter === "error") params.push(filter);
  else if (filter === "captcha") params.push(1);

  if (start) {
    conditions.push("timestamp >= ?");
    params.push(start);
  }
  if (end) {
    conditions.push("timestamp <= ?");
    params.push(end);
  }

  const sql = `SELECT * FROM logs ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""} ORDER BY timestamp DESC`;
  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

router.post("/retry/:folder", authenticateToken, (req, res) => {
  const folder = req.params.folder;
  const stmt = db.prepare("INSERT INTO session_logs (folder, action, timestamp) VALUES (?, 'retry', datetime('now'))");
  try {
    stmt.run(folder);
    res.json({ success: true, message: `Retry triggered for ${folder}` });
  } catch (err) {
    res.status(400).json({ error: "Retry failed", details: err.message });
  }
});

router.get("/logs/:folder/:file", authenticateToken, (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join("debug_logs", folder, file);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
  res.sendFile(path.resolve(filePath));
});

export default router;
