import crypto from "crypto";

const DEFAULT_GATEWAY = "gateway.pinata.cloud";

function buildName(payload) {
  return `${payload.batchCode}-${payload.stageName}-${Date.now()}`;
}

export async function uploadJsonToIpfs(payload) {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.PINATA_GATEWAY || DEFAULT_GATEWAY;
  const name = buildName(payload);

  if (!jwt) {
    const fakeCid = `bafy${crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex")
      .slice(0, 40)}`;

    return {
      cid: fakeCid,
      url: `https://${gateway}/ipfs/${fakeCid}`,
      name,
      mock: true,
    };
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name,
      },
      pinataContent: payload,
    }),
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
