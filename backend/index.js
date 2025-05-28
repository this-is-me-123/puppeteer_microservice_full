import express from "express";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Auth
app.use("/api", authRoutes);

// JWT Middleware
app.use("/api", (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, "supersecret");
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Protected routes
app.use("/api", apiRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});