import express from "express";
import { getBlockchainStatus } from "../services/blockchain.js";
import { getStorageStatus } from "../utils/db.js";
import { API_DOCS } from "../utils/apiDocs.js";

const router = express.Router();
const DEFAULT_API_DOCS_PASSWORD = "api-docs-admin";

router.get("/web3-status", (req, res) => {
  res.json({
    storage: getStorageStatus(),
    blockchain: getBlockchainStatus(),
    ipfs: {
      enabled: Boolean(process.env.PINATA_JWT),
      gateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
    },
  });
});

router.get("/api-docs", (req, res) => {
  const configuredPassword = process.env.API_DOCS_PASSWORD || DEFAULT_API_DOCS_PASSWORD;
  const password = req.get("X-API-Docs-Password") || "";

  if (password !== configuredPassword) {
    return res.status(401).json({ message: "Password API Docs salah" });
  }

  return res.json(API_DOCS);
});

export default router;
