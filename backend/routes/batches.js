import express from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import { readDb, writeDb } from "../utils/db.js";
import {
  buildDefaultStages,
  deriveBatchStatus,
  LEGACY_WORKFLOW_STAGE_KEYS,
  MASTER_STAGES,
  STAGE_LABELS,
  STAGE_PREREQUISITES,
} from "../utils/constants.js";
import { uploadJsonToIpfs } from "../services/pinata.js";
import {
  appendStageOnChain,
  createBatchOnChain,
  getBlockchainStatus,
} from "../services/blockchain.js";

const router = express.Router();
router.use(requireAuth);

function isFinalized(stage) {
  return stage?.status === "completed" || stage?.status === "skipped";
}

function findStage(batch, stageName) {
  return batch.stages.find((stage) => stage.stageName === stageName);
}

function getLegacySkippedStage(stageKey, workflowTemplateId) {
  const allowedStages = LEGACY_WORKFLOW_STAGE_KEYS[workflowTemplateId];
  if (!allowedStages || allowedStages.includes(stageKey)) {
    return {};
  }

  return {
    status: "skipped",
    skipped: true,
    completed: false,
    skipReason: `Normalized from legacy ${workflowTemplateId} workflow.`,
  };
}

function normalizeStage(baseStage = {}, templateStage = {}) {
  const completed = Boolean(baseStage.completed) || baseStage.status === "completed";
  const skipped = Boolean(baseStage.skipped) || baseStage.status === "skipped";
  const status = completed ? "completed" : skipped ? "skipped" : baseStage.status || "pending";

  return {
    stageName: templateStage.key || baseStage.stageName,
    label: baseStage.label || templateStage.label || STAGE_LABELS[baseStage.stageName] || baseStage.stageName,
    skippable:
      typeof baseStage.skippable === "boolean"
        ? baseStage.skippable
        : Boolean(templateStage.skippable),
    prerequisiteStages:
      baseStage.prerequisiteStages || templateStage.prerequisiteStages || STAGE_PREREQUISITES[baseStage.stageName] || [],
    status,
    completed: status === "completed",
    skipped: status === "skipped",
    skipReason: baseStage.skipReason || null,
    ipfsCid: baseStage.ipfsCid || null,
    ipfsUrl: baseStage.ipfsUrl || null,
    txHash: baseStage.txHash || null,
    txUrl: baseStage.txUrl || null,
    network: baseStage.network || null,
    chainId: baseStage.chainId || null,
    contractAddress: baseStage.contractAddress || null,
    timestamp: baseStage.timestamp || null,
    operator: baseStage.operator || null,
    payload: baseStage.payload || null,
    ipfsName: baseStage.ipfsName || null,
    mock: baseStage.mock || null,
  };
}

function prerequisitesMet(batch, stage) {
  const prerequisites = stage.prerequisiteStages || STAGE_PREREQUISITES[stage.stageName] || [];
  return prerequisites.every((dependencyName) => {
    const dependency = findStage(batch, dependencyName);
    return dependency ? isFinalized(dependency) : true;
  });
}

function refreshAvailableStages(batch) {
  batch.stages.forEach((stage) => {
    if (!isFinalized(stage)) {
      stage.status = "pending";
      stage.completed = false;
      stage.skipped = false;
    }
  });

  batch.stages.forEach((stage) => {
    if (!isFinalized(stage) && prerequisitesMet(batch, stage)) {
      stage.status = "available";
    }
  });
}

function normalizeBatch(batch) {
  const sourceStages = Array.isArray(batch.stages) ? batch.stages : [];
  const stages = MASTER_STAGES.map((templateStage) => {
    const existing = sourceStages.find((stage) => stage.stageName === templateStage.key) || {};
    const legacyFallback = !Object.keys(existing).length
      ? getLegacySkippedStage(templateStage.key, batch.workflowTemplateId)
      : {};

    return normalizeStage({ ...legacyFallback, ...existing }, templateStage);
  });

  const normalized = {
    ...batch,
    workflowTemplateId: undefined,
    workflowName: undefined,
    workflowMode: "dynamic-multi-path",
    status: batch.status || "draft",
    stages,
  };

  refreshAvailableStages(normalized);
  normalized.status = deriveBatchStatus(normalized.stages);

  return normalized;
}

function persistNormalizedDb(db) {
  db.batches = db.batches.map(normalizeBatch);
  writeDb(db);
}

async function createStageRecord({ batch, stageName, eventType, action, operator, data, reason }) {
  const timestamp = new Date().toISOString();
  const payload = {
    eventType,
    batchId: batch.id,
    batchCode: batch.batchCode,
    teaType: batch.teaType,
    stageName,
    operator,
    timestamp,
    ...(typeof data !== "undefined" ? { data } : {}),
    ...(typeof reason !== "undefined" ? { reason } : {}),
    meta: {
      ipfsProvider: "pinata",
      blockchain: getBlockchainStatus(),
      action,
      workflowMode: "dynamic-multi-path",
      skipBehavior: "manual-from-start",
    },
  };

  const ipfs = await uploadJsonToIpfs(payload);
  const chain = await appendStageOnChain(batch.batchCode, `${stageName}:${action}`, ipfs.cid);

  return {
    timestamp,
    payload,
    ipfs,
    chain,
  };
}

router.get("/", (req, res) => {
  const db = readDb();
  persistNormalizedDb(db);
  const batches = db.batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(batches);
});

router.get("/:id", (req, res) => {
  const db = readDb();
  persistNormalizedDb(db);
  const batch = db.batches.find((item) => item.id === req.params.id);

  if (!batch) {
    return res.status(404).json({ message: "Batch tidak ditemukan" });
  }

  res.json(batch);
});

router.post("/", async (req, res) => {
  try {
    const { batchCode, teaType, gardenBlock, harvestDate, notes } = req.body;

    if (!batchCode || !teaType) {
      return res.status(400).json({ message: "batchCode dan teaType wajib diisi" });
    }

    const db = readDb();
    persistNormalizedDb(db);

    const exists = db.batches.some((item) => item.batchCode === batchCode);
    if (exists) {
      return res.status(400).json({ message: "Kode batch sudah ada" });
    }

    const chain = await createBatchOnChain(batchCode, teaType);

    const batch = {
      id: uuidv4(),
      batchCode,
      teaType,
      gardenBlock,
      harvestDate,
      notes,
      workflowMode: "dynamic-multi-path",
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: req.user.name,
      trace: {
        batchRegistration: {
          txHash: chain.txHash,
          txUrl: chain.txUrl,
          network: chain.network,
          chainId: chain.chainId,
          contractAddress: chain.contractAddress,
          mock: chain.mock,
        },
      },
      stages: buildDefaultStages(),
    };

    db.batches.push(batch);
    writeDb(db);

    return res.status(201).json(batch);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/stages/:stageName", async (req, res) => {
  try {
    const { id, stageName } = req.params;

    const db = readDb();
    persistNormalizedDb(db);
    const batch = db.batches.find((item) => item.id === id);

    if (!batch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const stage = findStage(batch, stageName);

    if (!stage) {
      return res.status(404).json({ message: "Tahap tidak ditemukan dalam batch ini" });
    }

    if (stage.status !== "available") {
      return res.status(400).json({
        message: `Tahap ${stageName} belum tersedia untuk diproses`,
      });
    }

    const record = await createStageRecord({
      batch,
      stageName,
      eventType: "stage_completed",
      action: "completed",
      operator: req.user.name,
      data: req.body,
    });

    Object.assign(stage, {
      status: "completed",
      completed: true,
      skipped: false,
      skipReason: null,
      ipfsCid: record.ipfs.cid,
      ipfsUrl: record.ipfs.url,
      txHash: record.chain.txHash,
      txUrl: record.chain.txUrl,
      network: record.chain.network,
      chainId: record.chain.chainId,
      contractAddress: record.chain.contractAddress,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: record.ipfs.name,
      mock: {
        ipfs: record.ipfs.mock,
        blockchain: record.chain.mock,
      },
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    writeDb(db);
    return res.json(batch);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/stages/:stageName/skip", async (req, res) => {
  try {
    const { id, stageName } = req.params;
    const { reason } = req.body;

    const db = readDb();
    persistNormalizedDb(db);
    const batch = db.batches.find((item) => item.id === id);

    if (!batch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const stage = findStage(batch, stageName);

    if (!stage) {
      return res.status(404).json({ message: "Tahap tidak ditemukan dalam batch ini" });
    }

    if (isFinalized(stage)) {
      return res.status(400).json({ message: "Tahap ini sudah difinalisasi" });
    }

    if (!stage.skippable) {
      return res.status(400).json({ message: "Tahap ini tidak boleh di-skip" });
    }

    const record = await createStageRecord({
      batch,
      stageName,
      eventType: "stage_skipped",
      action: "skipped",
      operator: req.user.name,
      reason: reason || "Keputusan skip dari awal proses",
    });

    Object.assign(stage, {
      status: "skipped",
      completed: false,
      skipped: true,
      skipReason: reason || "Keputusan skip dari awal proses",
      ipfsCid: record.ipfs.cid,
      ipfsUrl: record.ipfs.url,
      txHash: record.chain.txHash,
      txUrl: record.chain.txUrl,
      network: record.chain.network,
      chainId: record.chain.chainId,
      contractAddress: record.chain.contractAddress,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: record.ipfs.name,
      mock: {
        ipfs: record.ipfs.mock,
        blockchain: record.chain.mock,
      },
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    writeDb(db);
    return res.json(batch);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id/traceability", (req, res) => {
  const db = readDb();
  persistNormalizedDb(db);
  const batch = db.batches.find((item) => item.id === req.params.id);

  if (!batch) {
    return res.status(404).json({ message: "Batch tidak ditemukan" });
  }

  return res.json({
    batchCode: batch.batchCode,
    teaType: batch.teaType,
    createdAt: batch.createdAt,
    workflowMode: batch.workflowMode || "dynamic-multi-path",
    batchRegistration: batch.trace.batchRegistration,
    stages: batch.stages,
  });
});

export default router;
