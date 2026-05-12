import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import batchRoutes from "./routes/batches.js";
import systemRoutes from "./routes/system.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/batches", batchRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
