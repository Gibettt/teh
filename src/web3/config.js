import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createStorage, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-walletconnect-project-id";
const sepoliaRpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
export const walletStorageKey = "tea-traceability-wallet";

const browserStorage =
  typeof window === "undefined"
    ? undefined
    : {
        getItem: (key) => {
          try {
            return window.localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(key);
          } catch {
            // Ignore blocked storage access.
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            // Ignore blocked storage access.
          }
        },
      };

export const walletProjectIdConfigured = Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID);

export const wagmiConfig = getDefaultConfig({
  appName: "Tea Traceability Admin",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
  },
  storage: createStorage({
    key: walletStorageKey,
    storage: browserStorage,
  }),
  ssr: false,
});
