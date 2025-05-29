// List all jobs
router.get("/queue", (req, res) => {
  const rows = db.prepare(
    `SELECT id, folder, status, created_at, updated_at FROM jobs ORDER BY created_at DESC`
  ).all();
  res.json(rows);
});

// Get single job details
router.get("/queue/:id", (req, res) => {
  const job = db
    .prepare(`SELECT * FROM jobs WHERE id = ?`)
    .get(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  // parse JSON result field
  job.result = job.result ? JSON.parse(job.result) : {};
  res.json(job);
});

// Enqueue a new job
router.post("/queue", (req, res) => {
  const { folder } = req.body;
  const id = require("uuid").v4();
  db.prepare(
    `INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')`
  ).run(id, folder);
  res.status(201).json({ id, folder, status: "queued" });
});

// Retry a failed job
router.post("/queue/:id/retry", (req, res) => {
  const old = db.prepare(`SELECT folder FROM jobs WHERE id = ?`).get(req.params.id);
  if (!old) return res.status(404).json({ error: "Not found" });
  const id = require("uuid").v4();
  db.prepare(
    `INSERT INTO jobs (id, folder, status) VALUES (?, ?, 'queued')`
  ).run(id, old.folder);
  res.json({ id, folder: old.folder, status: "queued" });
});
