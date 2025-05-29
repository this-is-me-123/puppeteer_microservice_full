import express from "express";
import cors from "cors";

import apiRoutes from "./routes/api.js";
import queueRoutes from "./routes/queue.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount primary API routes
app.use("/api", apiRoutes);

// Mount job‐queue routes
app.use("/api/queue", queueRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
