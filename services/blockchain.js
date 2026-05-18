import { ethers } from "ethers";
import { randomBytes } from "crypto";

const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

const abi = [
  "function createBatch(string batchCode, string teaType)",
  "function appendStage(string batchCode, string stageName, string ipfsCid)",
  "function getBatchHeader(string batchCode) view returns (tuple(string batchCode, string teaType, uint256 createdAt, bool exists))",
  "function getBatchStages(string batchCode) view returns (tuple(string stageName, string ipfsCid, uint256 timestamp, address actor)[] memory)",
];

function getExplorerBaseUrl() {
  return process.env.BLOCK_EXPLORER_URL || SEPOLIA_EXPLORER;
}

function getRequiredEnv() {
  return {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
  };
}

export function getBlockchainStatus() {
  const { rpcUrl, privateKey, contractAddress } = getRequiredEnv();

  return {
    enabled: Boolean(rpcUrl && privateKey && contractAddress),
    network: "sepolia",
    chainId: Number(SEPOLIA_CHAIN_ID),
    explorerBaseUrl: getExplorerBaseUrl(),
    contractAddress: contractAddress || null,
  };
}

async function getContract() {
  const { rpcUrl, privateKey, contractAddress } = getRequiredEnv();

  if (!rpcUrl || !privateKey || !contractAddress) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `RPC_URL harus mengarah ke Sepolia. Chain yang terdeteksi: ${network.chainId.toString()}`
    );
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  return { provider, wallet, contract, network };
}

function buildMockResponse(prefix) {
  const txHash = `0x${randomBytes(32).toString("hex")}`;

  return {
    txHash,
    txUrl: `${getExplorerBaseUrl()}/tx/${txHash}`,
    network: "sepolia",
    chainId: Number(SEPOLIA_CHAIN_ID),
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    mock: true,
  };
}

export async function createBatchOnChain(batchCode, teaType) {
  const contractContext = await getContract();

  if (!contractContext) {
    return buildMockResponse("mockcreate");
  }

  const { contract } = contractContext;
  try {
    const existing = await contract.getBatchHeader(batchCode);
    if (existing?.exists) {
      return {
        txHash: null,
        txUrl: null,
        network: "sepolia",
        chainId: Number(SEPOLIA_CHAIN_ID),
        contractAddress: process.env.CONTRACT_ADDRESS,
        mock: false,
        alreadyExists: true,
      };
    }
  } catch {
    // Contract throws when the batch does not exist; creating it is the expected next step.
  }

  const tx = await contract.createBatch(batchCode, teaType);
  await tx.wait();

  return {
    txHash: tx.hash,
    txUrl: `${getExplorerBaseUrl()}/tx/${tx.hash}`,
    network: "sepolia",
    chainId: Number(SEPOLIA_CHAIN_ID),
    contractAddress: process.env.CONTRACT_ADDRESS,
    mock: false,
  };
}

export async function appendStageOnChain(batchCode, stageName, ipfsCid) {
  const contractContext = await getContract();

  if (!contractContext) {
    return buildMockResponse("mockstage");
  }

  const { contract } = contractContext;
  const tx = await contract.appendStage(batchCode, stageName, ipfsCid);
  await tx.wait();

  return {
    txHash: tx.hash,
    txUrl: `${getExplorerBaseUrl()}/tx/${tx.hash}`,
    network: "sepolia",
    chainId: Number(SEPOLIA_CHAIN_ID),
    contractAddress: process.env.CONTRACT_ADDRESS,
    mock: false,
  };
}
