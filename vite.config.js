import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import batchRoutes from "./routes/batches.js";
import systemRoutes from "./routes/system.js";

dotenv.config();

function localApiPlugin() {
  return {
    name: "local-api",
    configureServer(server) {
      const api = express();

      api.use(express.json({ limit: "5mb" }));
      api.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
      });
      api.use("/api/auth", authRoutes);
      api.use("/api/system", systemRoutes);
      api.use("/api/batches", batchRoutes);
      api.use("/api", (req, res) => {
        res.status(404).json({ message: "API endpoint tidak ditemukan" });
      });

      server.middlewares.use(api);
    },
  };
}

export default defineConfig({
  plugins: [localApiPlugin(), react(), tailwindcss()],
});
