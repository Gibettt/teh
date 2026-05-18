import "dotenv/config";
import { randomUUID } from "crypto";

const DEFAULT_PROJECT_REF = "pscobituhjquyrjpyhgx";
const BATCH_SELECT =
  "id,batch_code,tea_type,garden_block,harvest_date,notes,workflow_mode,status,created_at,created_by,trace,stages";
const HISTORY_SELECT =
  "id,batch_id,batch_code,stage_name,event_type,action,status,operator,reason,payload,data,ipfs_cid,ipfs_url,ipfs_name,tx_hash,tx_url,network,chain_id,contract_address,mock,error_message,recorded_at,created_at";

function getProjectRef() {
  return process.env.SUPABASE_PROJECT_REF || DEFAULT_PROJECT_REF;
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || `https://${getProjectRef()}.supabase.co`;
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}

function getPublishableKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

function getConfig() {
  const url = getSupabaseUrl();
  const supabaseKey = getServiceRoleKey() || getPublishableKey();

  if (!url || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi di .env sebelum memakai API."
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    supabaseKey,
  };
}

function encodeFilter(value) {
  return encodeURIComponent(String(value));
}

async function request(path, options = {}) {
  const { url, supabaseKey } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: typeof options.body === "undefined" ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase ${options.method || "GET"} ${path} gagal (${response.status}): ${
        text || response.statusText
      }`
    );
  }

  return text ? JSON.parse(text) : null;
}

function toBatch(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    batchCode: row.batch_code,
    teaType: row.tea_type,
    gardenBlock: row.garden_block,
    harvestDate: row.harvest_date,
    notes: row.notes,
    workflowMode: row.workflow_mode,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    trace: row.trace || {},
    stages: row.stages || [],
  };
}

function toBatchRow(batch) {
  return {
    id: batch.id,
    batch_code: batch.batchCode,
    tea_type: batch.teaType,
    garden_block: batch.gardenBlock || null,
    harvest_date: batch.harvestDate || null,
    notes: batch.notes || null,
    workflow_mode: batch.workflowMode || "dynamic-multi-path",
    status: batch.status || "draft",
    created_at: batch.createdAt || new Date().toISOString(),
    created_by: batch.createdBy || null,
    trace: batch.trace || {},
    stages: batch.stages || [],
  };
}

function toUserRow(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  };
}

function toHistory(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    batchId: row.batch_id,
    batchCode: row.batch_code,
    stageName: row.stage_name,
    eventType: row.event_type,
    action: row.action,
    status: row.status,
    operator: row.operator,
    reason: row.reason,
    payload: row.payload,
    data: row.data,
    ipfsCid: row.ipfs_cid,
    ipfsUrl: row.ipfs_url,
    ipfsName: row.ipfs_name,
    txHash: row.tx_hash,
    txUrl: row.tx_url,
    network: row.network,
    chainId: row.chain_id,
    contractAddress: row.contract_address,
    mock: row.mock,
    errorMessage: row.error_message,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
  };
}

function toHistoryRow(entry) {
  return {
    id: entry.id || randomUUID(),
    batch_id: entry.batchId,
    batch_code: entry.batchCode,
    stage_name: entry.stageName || null,
    event_type: entry.eventType,
    action: entry.action,
    status: entry.status || "pending_external",
    operator: entry.operator || null,
    reason: entry.reason || null,
    payload: entry.payload || null,
    data: typeof entry.data === "undefined" ? null : entry.data,
    recorded_at: entry.recordedAt || entry.timestamp || new Date().toISOString(),
  };
}

function toHistoryPatch(patch) {
  const row = {};

  if (patch.status) row.status = patch.status;
  if (patch.payload !== undefined) row.payload = patch.payload;
  if (patch.data !== undefined) row.data = patch.data;
  if (patch.ipfsCid !== undefined) row.ipfs_cid = patch.ipfsCid;
  if (patch.ipfsUrl !== undefined) row.ipfs_url = patch.ipfsUrl;
  if (patch.ipfsName !== undefined) row.ipfs_name = patch.ipfsName;
  if (patch.txHash !== undefined) row.tx_hash = patch.txHash;
  if (patch.txUrl !== undefined) row.tx_url = patch.txUrl;
  if (patch.network !== undefined) row.network = patch.network;
  if (patch.chainId !== undefined) row.chain_id = patch.chainId;
  if (patch.contractAddress !== undefined) row.contract_address = patch.contractAddress;
  if (patch.mock !== undefined) row.mock = patch.mock;
  if (patch.errorMessage !== undefined) row.error_message = patch.errorMessage;

  return row;
}

export function getStorageStatus() {
  const serviceRoleKey = getServiceRoleKey();
  const publishableKey = getPublishableKey();
  const activeKeyType = serviceRoleKey ? "service_role" : publishableKey ? "publishable" : null;

  return {
    provider: "supabase",
    enabled: Boolean(getSupabaseUrl() && (serviceRoleKey || publishableKey)),
    activeKeyType,
    publishableKeyConfigured: Boolean(publishableKey),
    serviceRoleConfigured: Boolean(serviceRoleKey),
    projectRef: getProjectRef(),
    url: getSupabaseUrl(),
  };
}

export async function findUserByCredentials(email, password) {
  const rows = await request(
    `users?email=eq.${encodeFilter(email)}&password=eq.${encodeFilter(
      password
    )}&select=id,name,email,role&limit=1`
  );

  return rows?.[0] || null;
}

export async function upsertUser(user) {
  const rows = await request("users?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: toUserRow(user),
  });

  return rows?.[0] || null;
}

export async function listBatches() {
  const rows = await request(`batches?select=${BATCH_SELECT}&order=created_at.desc`);
  return rows.map(toBatch);
}

export async function getBatchById(id) {
  const rows = await request(`batches?id=eq.${encodeFilter(id)}&select=${BATCH_SELECT}&limit=1`);
  return toBatch(rows?.[0]);
}

export async function getBatchByCode(batchCode) {
  const rows = await request(
    `batches?batch_code=eq.${encodeFilter(batchCode)}&select=${BATCH_SELECT}&limit=1`
  );
  return toBatch(rows?.[0]);
}

export async function insertBatch(batch) {
  const rows = await request("batches", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: toBatchRow(batch),
  });

  return toBatch(rows?.[0]);
}

export async function updateBatch(batch) {
  const rows = await request(`batches?id=eq.${encodeFilter(batch.id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: toBatchRow(batch),
  });

  return toBatch(rows?.[0]);
}

export async function upsertBatch(batch) {
  const rows = await request("batches?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: toBatchRow(batch),
  });

  return toBatch(rows?.[0]);
}

export async function createHistoryEntry(entry) {
  const rows = await request("batch_history", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: toHistoryRow(entry),
  });

  return toHistory(rows?.[0]);
}

export async function updateHistoryEntry(id, patch) {
  const rows = await request(`batch_history?id=eq.${encodeFilter(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: toHistoryPatch(patch),
  });

  return toHistory(rows?.[0]);
}

export async function listBatchHistory(batchId) {
  const rows = await request(
    `batch_history?batch_id=eq.${encodeFilter(batchId)}&select=${HISTORY_SELECT}&order=recorded_at.asc`
  );
  return rows.map(toHistory);
}
