import crypto from "crypto";
import dotenv from "dotenv";

const DEFAULT_GATEWAY = "gateway.pinata.cloud";

function buildName(payload) {
  const batchCode = payload.batch?.batchCode || payload.batchCode || "batch";
  const documentType = payload.documentType || payload.stageName || "trace";
  const safeBatchCode = String(batchCode).replace(/[^a-z0-9-_]/gi, "-");
  const safeDocumentType = String(documentType).replace(/[^a-z0-9-_]/gi, "-");
  return `${safeBatchCode}-${safeDocumentType}-${Date.now()}.json`;
}

function buildPrettyJson(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function refreshEnv() {
  dotenv.config({ override: true });
}

export async function uploadJsonToIpfs(payload) {
  refreshEnv();
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.PINATA_GATEWAY || DEFAULT_GATEWAY;
  const name = buildName(payload);
  const content = buildPrettyJson(payload);

  if (!jwt) {
    const fakeCid = `bafy${crypto
      .createHash("sha256")
      .update(content)
      .digest("hex")
      .slice(0, 40)}`;

    return {
      cid: fakeCid,
      url: `https://${gateway}/ipfs/${fakeCid}`,
      name,
      mock: true,
    };
  }

  const formData = new FormData();
  formData.append("file", new Blob([content], { type: "application/json" }), name);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name,
      keyvalues: {
        documentType: payload.documentType || payload.eventType || "traceability_json",
        batchCode: payload.batch?.batchCode || payload.batchCode || "",
      },
    })
  );

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    cid: data.IpfsHash,
    url: `https://${gateway}/ipfs/${data.IpfsHash}`,
    name,
    mock: false,
  };
}
