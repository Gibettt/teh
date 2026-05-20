import express from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import {
  createHistoryEntry,
  getBatchByCode,
  getBatchById,
  insertBatch,
  listBatchHistory,
  listBatches,
  updateBatch,
  updateHistoryEntry,
} from "../utils/db.js";
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
  getBlockchainStatus,
  getTxUrl,
} from "../services/blockchain.js";

const router = express.Router();

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
    historyId: baseStage.historyId || null,
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

async function normalizeAndPersistBatch(batch) {
  const normalized = normalizeBatch(batch);
  const blockchainStatus = getBlockchainStatus();

  if (
    normalized.trace?.blockchainFinalization &&
    normalized.trace.blockchainFinalization.status !== "anchored"
  ) {
    normalized.trace.blockchainFinalization = {
      ...normalized.trace.blockchainFinalization,
      network: blockchainStatus.network,
      chainId: blockchainStatus.chainId,
      contractAddress: blockchainStatus.contractAddress,
      transactionMode: "manual_metamask",
    };
  }

  await updateBatch(normalized);
  return normalized;
}

const FINAL_TRACE_STAGE_NAME = "final_trace_json";
const FINAL_TRACE_SCHEMA_VERSION = "tea-traceability-final-v3";

function getBlockchainAnchorConfig() {
  const blockchainStatus = getBlockchainStatus();

  return {
    network: blockchainStatus.network,
    chainId: blockchainStatus.chainId,
    contractAddress: blockchainStatus.contractAddress,
    transactionMode: "manual_metamask",
    onChainPayload: "pinata_cid_only",
    contractFunction: "storeIpfsCid(string ipfsCid)",
  };
}

function buildStageJsonRecord(stage, index) {
  const data = stage.payload?.data ?? null;
  const reason = stage.payload?.reason ?? stage.skipReason ?? null;

  return {
    order: index + 1,
    stageName: stage.stageName,
    label: stage.label || STAGE_LABELS[stage.stageName] || stage.stageName,
    status: stage.status,
    operator: stage.operator || null,
    recordedAt: stage.timestamp || null,
    data,
    skipReason: stage.status === "skipped" ? reason : null,
  };
}

function buildFinalTracePayload(batch, operator, timestamp) {
  const finalizedStages = (batch.stages || []).filter(isFinalized);
  const completedStages = finalizedStages.filter((stage) => stage.status === "completed");
  const skippedStages = finalizedStages.filter((stage) => stage.status === "skipped");

  return {
    schemaVersion: FINAL_TRACE_SCHEMA_VERSION,
    documentType: "tea_traceability_batch_final",
    generatedAt: timestamp,
    generatedBy: operator,
    batch: {
      batchCode: batch.batchCode,
      teaType: batch.teaType,
      gardenBlock: batch.gardenBlock || null,
      harvestDate: batch.harvestDate || null,
      notes: batch.notes || null,
      status: batch.status,
      createdAt: batch.createdAt,
    },
    summary: {
      totalStages: batch.stages?.length || 0,
      finalizedStages: finalizedStages.length,
      completedStages: completedStages.length,
      skippedStages: skippedStages.length,
      finalStatus: batch.status,
    },
    stages: finalizedStages.map(buildStageJsonRecord),
  };
}

function buildStagePayloadMeta(action) {
  return {
    storage: {
      provider: "supabase",
      finalJsonProvider: "pinata",
      finalJsonTiming: "after_all_stages_finalized",
    },
    blockchainAnchor: {
      ...getBlockchainAnchorConfig(),
      status: "waiting_for_final_pinata_cid",
    },
    action,
    workflowMode: "dynamic-multi-path",
    skipBehavior: "manual-from-start",
  };
}

async function createFinalTraceJsonIfComplete(batch, operator, options = {}) {
  const force = Boolean(options.force);

  if (batch.status !== "completed") {
    return batch;
  }

  if (batch.trace?.blockchainFinalization?.status === "anchored" && batch.trace?.finalTrace?.ipfsCid) {
    return batch;
  }

  if (!force && batch.trace?.finalTrace?.schemaVersion === FINAL_TRACE_SCHEMA_VERSION && batch.trace.finalTrace.ipfsCid) {
    return batch;
  }

  if (force && batch.trace?.blockchainFinalization?.status === "anchored") {
    throw new Error("JSON final tidak bisa dibuat ulang karena CID lama sudah tercatat di blockchain.");
  }

  const timestamp = new Date().toISOString();
  const payload = buildFinalTracePayload(batch, operator, timestamp);

  const history = await createHistoryEntry({
    batchId: batch.id,
    batchCode: batch.batchCode,
    stageName: FINAL_TRACE_STAGE_NAME,
    eventType: "batch_final_trace_json",
    action: "final_json_created",
    operator,
    payload,
    timestamp,
    status: "pending_ipfs",
  });

  batch.trace = {
    ...(batch.trace || {}),
    finalTrace: {
      status: "pending_ipfs",
      historyId: history.id,
      generatedAt: timestamp,
    },
  };
  await updateBatch(batch);

  try {
    const ipfs = await uploadJsonToIpfs(payload);
    const blockchainStatus = getBlockchainStatus();

    batch.trace.finalTrace = {
      status: "ipfs_stored",
      schemaVersion: FINAL_TRACE_SCHEMA_VERSION,
      historyId: history.id,
      generatedAt: timestamp,
      ipfsCid: ipfs.cid,
      ipfsUrl: ipfs.url,
      ipfsName: ipfs.name,
      mock: {
        ipfs: ipfs.mock,
      },
    };
    batch.trace.blockchainFinalization = {
      status: "awaiting_wallet_signature",
      finalCid: ipfs.cid,
      finalIpfsUrl: ipfs.url,
      network: blockchainStatus.network,
      chainId: blockchainStatus.chainId,
      contractAddress: blockchainStatus.contractAddress,
      transactionMode: "manual_metamask",
    };

    await updateHistoryEntry(history.id, {
      status: "ipfs_stored",
      ipfsCid: ipfs.cid,
      ipfsUrl: ipfs.url,
      ipfsName: ipfs.name,
      mock: {
        ipfs: ipfs.mock,
      },
    });

    await updateBatch(batch);
    return batch;
  } catch (error) {
    batch.trace.finalTrace = {
      ...(batch.trace.finalTrace || {}),
      status: "failed",
      errorMessage: error.message,
      failedAt: new Date().toISOString(),
    };
    await updateBatch(batch);
    await updateHistoryEntry(history.id, {
      status: "failed",
      errorMessage: error.message,
    });
    return batch;
  }
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
    meta: buildStagePayloadMeta(action),
  };

  const history = await createHistoryEntry({
    batchId: batch.id,
    batchCode: batch.batchCode,
    stageName,
    eventType,
    action,
    operator,
    data,
    reason,
    payload,
    timestamp,
    status: "stored_supabase",
  });

  return {
    timestamp,
    payload,
    history,
  };
}

function buildTraceabilityStage(stage, index) {
  return {
    order: index + 1,
    stageName: stage.stageName,
    label: stage.label || STAGE_LABELS[stage.stageName] || stage.stageName,
    status: stage.status,
    operator: stage.operator || null,
    recordedAt: stage.timestamp || null,
    data: stage.payload?.data || null,
  };
}

function buildTraceabilityResponse(batch, options = {}) {
  const hideSkipped = Boolean(options.hideSkipped);
  const normalized = normalizeBatch(batch);
  const visibleStages = hideSkipped
    ? normalized.stages.filter((stage) => stage.status !== "skipped")
    : normalized.stages;
  const completedStages = visibleStages.filter((stage) => stage.status === "completed");
  const finalTrace = normalized.trace?.finalTrace || null;
  const blockchainFinalization = normalized.trace?.blockchainFinalization || null;

  return {
    batch: {
      id: normalized.id,
      batchCode: normalized.batchCode,
      teaType: normalized.teaType,
      gardenBlock: normalized.gardenBlock || null,
      harvestDate: normalized.harvestDate || null,
      notes: normalized.notes || null,
      status: normalized.status,
      createdAt: normalized.createdAt,
      workflowMode: normalized.workflowMode || "dynamic-multi-path",
    },
    summary: {
      totalStagesShown: visibleStages.length,
      completedStages: completedStages.length,
      hiddenSkippedStages: hideSkipped
        ? normalized.stages.filter((stage) => stage.status === "skipped").length
        : 0,
    },
    finalTrace: finalTrace
      ? {
          status: finalTrace.status || null,
          schemaVersion: finalTrace.schemaVersion || null,
          generatedAt: finalTrace.generatedAt || null,
          ipfsCid: finalTrace.ipfsCid || null,
          ipfsUrl: finalTrace.ipfsUrl || null,
        }
      : null,
    blockchainFinalization: blockchainFinalization
      ? {
          status: blockchainFinalization.status || null,
          finalCid: blockchainFinalization.finalCid || null,
          finalIpfsUrl: blockchainFinalization.finalIpfsUrl || null,
          txHash: blockchainFinalization.txHash || null,
          txUrl: blockchainFinalization.txUrl || null,
          network: blockchainFinalization.network || null,
          chainId: blockchainFinalization.chainId || null,
          contractAddress: blockchainFinalization.contractAddress || null,
          anchoredAt: blockchainFinalization.anchoredAt || null,
        }
      : null,
    stages: visibleStages.map(buildTraceabilityStage),
  };
}

router.get("/public/:id/traceability", async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Traceability tidak ditemukan" });
    }

    return res.json(buildTraceabilityResponse(batch, { hideSkipped: true }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const batches = await listBatches();
    const normalized = await Promise.all(batches.map((batch) => normalizeAndPersistBatch(batch)));
    normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const normalized = await normalizeAndPersistBatch(batch);
    res.json(await createFinalTraceJsonIfComplete(normalized, req.user.name));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { batchCode, teaType, gardenBlock, harvestDate, notes } = req.body;

    if (!batchCode || !teaType) {
      return res.status(400).json({ message: "batchCode dan teaType wajib diisi" });
    }

    const exists = await getBatchByCode(batchCode);
    if (exists) {
      return res.status(400).json({ message: "Kode batch sudah ada" });
    }

    const createdAt = new Date().toISOString();

    const batch = {
      id: uuidv4(),
      batchCode,
      teaType,
      gardenBlock,
      harvestDate,
      notes,
      workflowMode: "dynamic-multi-path",
      status: "draft",
      createdAt,
      createdBy: req.user.name,
      trace: {
        batchRegistration: {
          status: "stored_supabase",
        },
      },
      stages: buildDefaultStages(),
    };

    await insertBatch(batch);

    const payload = {
      eventType: "batch_created",
      batchId: batch.id,
      batchCode: batch.batchCode,
      teaType: batch.teaType,
      stageName: "batch_registration",
      operator: req.user.name,
      timestamp: createdAt,
      data: {
        gardenBlock,
        harvestDate,
        notes,
      },
      meta: {
        storage: {
          provider: "supabase",
          finalJsonProvider: "pinata",
          finalJsonTiming: "after_all_stages_finalized",
        },
        blockchainAnchor: {
          ...getBlockchainAnchorConfig(),
          status: "waiting_for_final_pinata_cid",
        },
        action: "created",
        workflowMode: "dynamic-multi-path",
      },
    };

    const history = await createHistoryEntry({
      batchId: batch.id,
      batchCode: batch.batchCode,
      eventType: "batch_created",
      action: "created",
      operator: req.user.name,
      timestamp: createdAt,
      status: "stored_supabase",
      payload,
    });

    batch.trace = {
      batchRegistration: {
        status: "stored_supabase",
        historyId: history.id,
      },
    };

    await updateBatch(batch);
    return res.status(201).json(batch);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/stages/:stageName", async (req, res) => {
  try {
    const { id, stageName } = req.params;

    const storedBatch = await getBatchById(id);

    if (!storedBatch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const batch = await normalizeAndPersistBatch(storedBatch);
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
      ipfsCid: null,
      ipfsUrl: null,
      txHash: null,
      txUrl: null,
      network: null,
      chainId: null,
      contractAddress: null,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: null,
      historyId: record.history.id,
      mock: null,
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    await updateBatch(batch);
    return res.json(await createFinalTraceJsonIfComplete(batch, req.user.name));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/stages/:stageName/skip", async (req, res) => {
  try {
    const { id, stageName } = req.params;
    const { reason } = req.body;

    const storedBatch = await getBatchById(id);

    if (!storedBatch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const batch = await normalizeAndPersistBatch(storedBatch);
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
      ipfsCid: null,
      ipfsUrl: null,
      txHash: null,
      txUrl: null,
      network: null,
      chainId: null,
      contractAddress: null,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: null,
      historyId: record.history.id,
      mock: null,
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    await updateBatch(batch);
    return res.json(await createFinalTraceJsonIfComplete(batch, req.user.name));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/blockchain", async (req, res) => {
  try {
    const { txHash, walletAddress, chainId } = req.body;
    const cleanTxHash = typeof txHash === "string" ? txHash.trim() : "";

    if (!cleanTxHash) {
      return res.status(400).json({ message: "Tx hash wajib dikirim setelah transaksi MetaMask berhasil" });
    }

    const storedBatch = await getBatchById(req.params.id);

    if (!storedBatch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const batch = await normalizeAndPersistBatch(storedBatch);
    const finalTrace = batch.trace?.finalTrace;

    if (!finalTrace?.ipfsCid) {
      return res.status(400).json({ message: "CID final Pinata belum tersedia untuk batch ini" });
    }

    const blockchainStatus = getBlockchainStatus();
    const recordedAt = new Date().toISOString();
    const effectiveChainId = Number(chainId || blockchainStatus.chainId);
    const effectiveContractAddress = blockchainStatus.contractAddress;
    const txUrl = getTxUrl(cleanTxHash);
    const payload = {
      eventType: "final_cid_anchored",
      batchId: batch.id,
      batchCode: batch.batchCode,
      teaType: batch.teaType,
      stageName: FINAL_TRACE_STAGE_NAME,
      operator: req.user.name,
      timestamp: recordedAt,
      finalCid: finalTrace.ipfsCid,
      ipfsUrl: finalTrace.ipfsUrl || null,
      txHash: cleanTxHash,
      txUrl,
      walletAddress: walletAddress || null,
      meta: {
        blockchain: {
          ...blockchainStatus,
          chainId: effectiveChainId,
          contractAddress: effectiveContractAddress,
          transactionMode: "manual_metamask",
          payloadMode: "pinata_cid_only",
        },
        action: "manual_wallet_anchor",
      },
    };

    const history = await createHistoryEntry({
      batchId: batch.id,
      batchCode: batch.batchCode,
      stageName: FINAL_TRACE_STAGE_NAME,
      eventType: "final_cid_anchored",
      action: "manual_wallet_anchor",
      operator: req.user.name,
      payload,
      timestamp: recordedAt,
      status: "anchored",
      ipfsCid: finalTrace.ipfsCid,
      ipfsUrl: finalTrace.ipfsUrl,
      ipfsName: finalTrace.ipfsName,
      txHash: cleanTxHash,
      txUrl,
      network: blockchainStatus.network,
      chainId: effectiveChainId,
      contractAddress: effectiveContractAddress,
    });

    batch.trace = {
      ...(batch.trace || {}),
      blockchainFinalization: {
        ...(batch.trace?.blockchainFinalization || {}),
        status: "anchored",
        finalCid: finalTrace.ipfsCid,
        finalIpfsUrl: finalTrace.ipfsUrl || null,
        txHash: cleanTxHash,
        txUrl,
        network: blockchainStatus.network,
        chainId: effectiveChainId,
        contractAddress: effectiveContractAddress,
        walletAddress: walletAddress || null,
        transactionMode: "manual_metamask",
        anchoredAt: recordedAt,
        historyId: history.id,
      },
    };

    await updateBatch(batch);
    return res.json(batch);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    return res.json(await listBatchHistory(req.params.id));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id/traceability", async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch tidak ditemukan" });
    }

    const normalizedBatch = await normalizeAndPersistBatch(batch);
    const normalized = await createFinalTraceJsonIfComplete(normalizedBatch, req.user.name);

    return res.json(buildTraceabilityResponse(normalized, { hideSkipped: true }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
