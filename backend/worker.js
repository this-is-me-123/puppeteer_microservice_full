// backend/worker.js
import Database from "better-sqlite3";
import { runPuppeteerJob } from "./puppeteerJob.js";
import { setIntervalAsync, clearIntervalAsync } from "set-interval-async/fixed/index.js";

const db = new Database("logs.db", { verbose: console.log });
const now = () => new Date().toISOString();

async function processJob(job) {
  console.log(`🔄 Processing job ${job.id}`);
  db.prepare(
    `UPDATE jobs SET status='running', updated_at=? WHERE id=?`
  ).run(now(), job.id);

  try {
    const result = await runPuppeteerJob(job.folder);
    db.prepare(
      `UPDATE jobs
         SET status='completed', result=?, updated_at=?
       WHERE id=?`
    ).run(JSON.stringify(result), now(), job.id);
    console.log(`✅ Job ${job.id} completed`);
  } catch (err) {
    db.prepare(
      `UPDATE jobs
         SET status='failed', error=?, updated_at=?
       WHERE id=?`
    ).run(err.message, now(), job.id);
    console.error(`❌ Job ${job.id} failed: ${err.message}`);
  }
}

async function pollQueue() {
  const job = db
    .prepare(
      `SELECT * FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1`
    )
    .get();
  if (job) await processJob(job);
}

async function startWorker() {
  console.log("🕒 Worker started—polling every 5s");
  const handle = setIntervalAsync(async () => {
    await pollQueue();
  }, 5000);

  process.on("SIGINT", async () => {
    console.log("🛑 Stopping worker...");
    await clearIntervalAsync(handle);
    process.exit(0);
  });
}

startWorker();
