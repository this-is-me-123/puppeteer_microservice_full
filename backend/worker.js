import { createDbConnection, allAsync, runAsync, closeDbConnection } from "./db/db.js";

(async () => {
  const db = await createDbConnection();
  // fetch queued jobs
  const jobs = allAsync("SELECT * FROM jobs WHERE status = 'queued'");
  for (const job of jobs) {
    // process each job...
    await runAsync("UPDATE jobs SET status = ? WHERE id = ?", ["done", job.id]);
  }
  closeDbConnection();
})().catch(err => {
  console.error("Worker error:", err);
  process.exit(1);
});
