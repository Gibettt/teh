import dotenv from "dotenv";

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

export const teaTraceabilityAbi = [
  {
    type: "function",
    name: "storeIpfsCid",
    stateMutability: "nonpayable",
    inputs: [{ name: "ipfsCid", type: "string" }],
    outputs: [],
  },
];

function refreshEnv() {
  dotenv.config({ override: true });
}

export function getExplorerBaseUrl() {
  return process.env.BLOCK_EXPLORER_URL || SEPOLIA_EXPLORER;
}

export function getTxUrl(txHash) {
  return txHash ? `${getExplorerBaseUrl()}/tx/${txHash}` : null;
}

export function getBlockchainStatus() {
  refreshEnv();
  const contractAddress = process.env.CONTRACT_ADDRESS || null;

  return {
    enabled: Boolean(contractAddress),
    network: "sepolia",
    chainId: SEPOLIA_CHAIN_ID,
    explorerBaseUrl: getExplorerBaseUrl(),
    contractAddress,
    transactionMode: "manual_metamask",
    privateKeyRequired: false,
    abi: teaTraceabilityAbi,
  };
}
