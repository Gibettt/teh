export const teaTraceabilityAbi = [
  {
    type: "function",
    name: "storeIpfsCid",
    stateMutability: "nonpayable",
    inputs: [{ name: "ipfsCid", type: "string" }],
    outputs: [],
  },
];

export function resolveContractAddress(systemStatus) {
  return (
    systemStatus?.blockchain?.contractAddress ||
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    ""
  );
}
