import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();
const logsDir = path.resolve("logs/debug_logs");

router.get("/logs/:folder/:file", (req, res) => {
  const { folder, file } = req.params;
  const safePath = path.join(logsDir, folder, file);

  if (!safePath.startsWith(logsDir)) {
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).send("File not found");
  }

  res.sendFile(safePath);
});

export default router;