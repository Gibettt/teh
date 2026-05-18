import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createHistoryEntry,
  updateHistoryEntry,
  upsertBatch,
  upsertUser,
} from "../utils/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "..", "data", "storage.json");

function isFinalized(stage) {
  return stage?.status === "completed" || stage?.status === "skipped";
}

async function importBatchHistory(batch) {
  const registration = batch.trace?.batchRegistration;

  if (registration?.txHash) {
    const history = await createHistoryEntry({
      batchId: batch.id,
      batchCode: batch.batchCode,
      eventType: "batch_created",
      action: "created",
      operator: batch.createdBy,
      timestamp: batch.createdAt,
      status: "anchored",
      payload: {
        eventType: "batch_created",
        batchId: batch.id,
        batchCode: batch.batchCode,
        teaType: batch.teaType,
        operator: batch.createdBy,
        timestamp: batch.createdAt,
      },
    });

    await updateHistoryEntry(history.id, {
      status: "anchored",
      txHash: registration.txHash,
      txUrl: registration.txUrl,
      network: registration.network,
      chainId: registration.chainId,
      contractAddress: registration.contractAddress,
      mock: {
        blockchain: registration.mock,
      },
    });
  }

  for (const stage of batch.stages || []) {
    if (!isFinalized(stage)) {
      continue;
    }

    const action = stage.status === "skipped" ? "skipped" : "completed";
    const history = await createHistoryEntry({
      batchId: batch.id,
      batchCode: batch.batchCode,
      stageName: stage.stageName,
      eventType: action === "skipped" ? "stage_skipped" : "stage_completed",
      action,
      operator: stage.operator,
      reason: stage.skipReason,
      data: stage.payload?.data,
      payload: stage.payload,
      timestamp: stage.timestamp || batch.createdAt,
      status: "anchored",
    });

    await updateHistoryEntry(history.id, {
      status: "anchored",
      ipfsCid: stage.ipfsCid,
      ipfsUrl: stage.ipfsUrl,
      ipfsName: stage.ipfsName,
      txHash: stage.txHash,
      txUrl: stage.txUrl,
      network: stage.network,
      chainId: stage.chainId,
      contractAddress: stage.contractAddress,
      mock: stage.mock,
    });
  }
}

if (!fs.existsSync(storagePath)) {
  throw new Error(`File tidak ditemukan: ${storagePath}`);
}

const storage = JSON.parse(fs.readFileSync(storagePath, "utf-8"));

for (const user of storage.users || []) {
  await upsertUser(user);
}

for (const batch of storage.batches || []) {
  await upsertBatch(batch);
  await importBatchHistory(batch);
}

console.log(
  `Import selesai: ${(storage.users || []).length} user dan ${(storage.batches || []).length} batch.`
);
