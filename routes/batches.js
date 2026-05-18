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
  await updateBatch(normalized);
  return normalized;
}

function mergeMock(currentMock, patch) {
  return {
    ...((currentMock && typeof currentMock === "object") ? currentMock : {}),
    ...(patch || {}),
  };
}

function buildChainPatch(chain) {
  return {
    txHash: chain.txHash,
    txUrl: chain.txUrl,
    network: chain.network,
    chainId: chain.chainId,
    contractAddress: chain.contractAddress,
    mock: chain.mock,
  };
}

function applyChainToStage(stage, chain) {
  Object.assign(stage, {
    txHash: chain.txHash,
    txUrl: chain.txUrl,
    network: chain.network,
    chainId: chain.chainId,
    contractAddress: chain.contractAddress,
    mock: mergeMock(stage.mock, {
      blockchain: chain.mock,
    }),
  });
}

function getFinalizedCidRecords(batch) {
  const records = [];
  const batchRegistration = batch.trace?.batchRegistration;

  if (batchRegistration?.ipfsCid) {
    records.push({
      type: "batch",
      name: "batch_registration",
      cid: batchRegistration.ipfsCid,
      historyId: batchRegistration.historyId,
    });
  }

  for (const stage of batch.stages || []) {
    if (isFinalized(stage)) {
      if (!stage.ipfsCid) {
        throw new Error(`CID Pinata tahap ${stage.stageName} belum tersedia.`);
      }

      records.push({
        type: "stage",
        name: `${stage.stageName}:${stage.status}`,
        cid: stage.ipfsCid,
        historyId: stage.historyId,
        stage,
      });
    }
  }

  return records;
}

async function finalizeBatchOnChainIfComplete(batch, operator) {
  if (batch.status !== "completed") {
    return batch;
  }

  if (batch.trace?.blockchainFinalization?.status === "anchored") {
    return batch;
  }

  const timestamp = new Date().toISOString();
  const cidRecords = getFinalizedCidRecords(batch);
  const payload = {
    eventType: "batch_blockchain_finalized",
    batchId: batch.id,
    batchCode: batch.batchCode,
    teaType: batch.teaType,
    operator,
    timestamp,
    cids: cidRecords.map(({ type, name, cid }) => ({ type, name, cid })),
    meta: {
      blockchain: getBlockchainStatus(),
      action: "finalized",
      workflowMode: "dynamic-multi-path",
      behavior: "push-cids-after-all-stages-finalized",
    },
  };

  const history = await createHistoryEntry({
    batchId: batch.id,
    batchCode: batch.batchCode,
    eventType: "batch_blockchain_finalized",
    action: "finalized",
    operator,
    payload,
    timestamp,
    status: "pending_blockchain",
  });

  batch.trace = {
    ...(batch.trace || {}),
    blockchainFinalization: {
      status: "pending_blockchain",
      historyId: history.id,
      timestamp,
    },
  };
  await updateBatch(batch);

  try {
    const batchChain = await createBatchOnChain(batch.batchCode, batch.teaType);
    const chainRecords = [];

    batch.trace.batchRegistration = {
      ...(batch.trace.batchRegistration || {}),
      blockchainStatus: "batch_registered",
      createTxHash: batchChain.txHash,
      createTxUrl: batchChain.txUrl,
      network: batchChain.network,
      chainId: batchChain.chainId,
      contractAddress: batchChain.contractAddress,
      mock: mergeMock(batch.trace.batchRegistration?.mock, {
        blockchainCreate: batchChain.mock,
      }),
      alreadyExists: batchChain.alreadyExists || false,
    };

    for (const record of cidRecords) {
      const chain = await appendStageOnChain(batch.batchCode, record.name, record.cid);
      chainRecords.push({
        type: record.type,
        name: record.name,
        cid: record.cid,
        txHash: chain.txHash,
        txUrl: chain.txUrl,
      });

      if (record.stage) {
        applyChainToStage(record.stage, chain);
        if (record.historyId) {
          await updateHistoryEntry(record.historyId, {
            status: "anchored",
            ...buildChainPatch(chain),
            mock: mergeMock(record.stage.mock, {
              blockchain: chain.mock,
            }),
          });
        }
      } else {
        batch.trace.batchRegistration = {
          ...batch.trace.batchRegistration,
          txHash: chain.txHash,
          txUrl: chain.txUrl,
          network: chain.network,
          chainId: chain.chainId,
          contractAddress: chain.contractAddress,
          mock: mergeMock(batch.trace.batchRegistration.mock, {
            blockchain: chain.mock,
          }),
        };

        if (record.historyId) {
          await updateHistoryEntry(record.historyId, {
            status: "anchored",
            ...buildChainPatch(chain),
            mock: mergeMock(batch.trace.batchRegistration.mock, {
              blockchain: chain.mock,
            }),
          });
        }
      }
    }

    batch.trace.blockchainFinalization = {
      status: "anchored",
      historyId: history.id,
      timestamp,
      finalizedAt: new Date().toISOString(),
      records: chainRecords,
    };

    await updateHistoryEntry(history.id, {
      status: "anchored",
      payload: {
        ...payload,
        chainRecords,
      },
      mock: {
        blockchain: batchChain.mock,
      },
    });

    await updateBatch(batch);
    return batch;
  } catch (error) {
    batch.trace.blockchainFinalization = {
      ...(batch.trace.blockchainFinalization || {}),
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
    meta: {
      ipfsProvider: "pinata",
      blockchain: {
        ...getBlockchainStatus(),
        deferredUntilBatchCompleted: true,
      },
      action,
      workflowMode: "dynamic-multi-path",
      skipBehavior: "manual-from-start",
    },
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
    status: "pending_ipfs",
  });

  try {
    const ipfs = await uploadJsonToIpfs(payload);

    await updateHistoryEntry(history.id, {
      status: "ipfs_stored",
      ipfsCid: ipfs.cid,
      ipfsUrl: ipfs.url,
      ipfsName: ipfs.name,
      mock: {
        ipfs: ipfs.mock,
      },
    });

    return {
      timestamp,
      payload,
      ipfs,
      history,
    };
  } catch (error) {
    await updateHistoryEntry(history.id, {
      status: "failed",
      errorMessage: error.message,
    });
    throw error;
  }
}

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

    res.json(await normalizeAndPersistBatch(batch));
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
          status: "pending_ipfs",
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
        blockchain: {
          ...getBlockchainStatus(),
          deferredUntilBatchCompleted: true,
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
      status: "pending_ipfs",
      payload,
    });

    try {
      const ipfs = await uploadJsonToIpfs(payload);

      batch.trace = {
        batchRegistration: {
          status: "ipfs_stored",
          ipfsCid: ipfs.cid,
          ipfsUrl: ipfs.url,
          ipfsName: ipfs.name,
          mock: {
            ipfs: ipfs.mock,
          },
          historyId: history.id,
        },
      };

      await updateBatch(batch);
      await updateHistoryEntry(history.id, {
        status: "ipfs_stored",
        ipfsCid: ipfs.cid,
        ipfsUrl: ipfs.url,
        ipfsName: ipfs.name,
        mock: {
          ipfs: ipfs.mock,
        },
      });

      return res.status(201).json(batch);
    } catch (error) {
      await updateHistoryEntry(history.id, {
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
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
      ipfsCid: record.ipfs.cid,
      ipfsUrl: record.ipfs.url,
      txHash: null,
      txUrl: null,
      network: null,
      chainId: null,
      contractAddress: null,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: record.ipfs.name,
      historyId: record.history.id,
      mock: {
        ipfs: record.ipfs.mock,
      },
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    await updateBatch(batch);
    return res.json(await finalizeBatchOnChainIfComplete(batch, req.user.name));
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
      ipfsCid: record.ipfs.cid,
      ipfsUrl: record.ipfs.url,
      txHash: null,
      txUrl: null,
      network: null,
      chainId: null,
      contractAddress: null,
      timestamp: record.timestamp,
      operator: req.user.name,
      payload: record.payload,
      ipfsName: record.ipfs.name,
      historyId: record.history.id,
      mock: {
        ipfs: record.ipfs.mock,
      },
    });

    refreshAvailableStages(batch);
    batch.status = deriveBatchStatus(batch.stages);

    await updateBatch(batch);
    return res.json(await finalizeBatchOnChainIfComplete(batch, req.user.name));
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

    const normalized = await normalizeAndPersistBatch(batch);

    return res.json({
      batchCode: normalized.batchCode,
      teaType: normalized.teaType,
      createdAt: normalized.createdAt,
      workflowMode: normalized.workflowMode || "dynamic-multi-path",
      batchRegistration: normalized.trace.batchRegistration,
      stages: normalized.stages,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
