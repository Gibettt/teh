import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-walletconnect-project-id";

export const walletProjectIdConfigured = Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID);

export const wagmiConfig = getDefaultConfig({
  appName: "Tea Traceability Admin",
  projectId,
  chains: [sepolia, mainnet],
  ssr: false,
});
