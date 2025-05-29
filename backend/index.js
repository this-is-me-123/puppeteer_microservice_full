import express from "express";
import apiRoutes from "./routes/api.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
