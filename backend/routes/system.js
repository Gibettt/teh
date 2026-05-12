import express from "express";
import { getBlockchainStatus } from "../services/blockchain.js";

const router = express.Router();

router.get("/web3-status", (req, res) => {
  res.json({
    blockchain: getBlockchainStatus(),
    ipfs: {
      enabled: Boolean(process.env.PINATA_JWT),
      gateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
    },
  });
});

export default router;
