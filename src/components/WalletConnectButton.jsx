import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, ChevronDown, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useConfig, useDisconnect } from "wagmi";
import { walletStorageKey } from "../web3/config";

const SESSION_STORAGE_PREFIXES = ["wc@", "walletconnect", "WALLETCONNECT_"];

function removeStorageKeys(storage, shouldRemove) {
  if (!storage) return;

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
    keys.forEach((key) => {
      if (shouldRemove(key)) {
        storage.removeItem(key);
      }
    });
  } catch {
    // Some browsers can block storage access in private or strict modes.
  }
}

function clearWalletSessionStorage() {
  if (typeof window === "undefined") return;

  const shouldRemove = (key) =>
    key === "wagmi.store" ||
    key === "wagmi.recentConnectorId" ||
    key === "wagmi.injected.connected" ||
    key === `${walletStorageKey}.store` ||
    key === `${walletStorageKey}.recentConnectorId` ||
    key === `${walletStorageKey}.injected.connected` ||
    SESSION_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

  removeStorageKeys(window.localStorage, shouldRemove);
  removeStorageKeys(window.sessionStorage, shouldRemove);
}

async function forgetWalletConnection(config, connector) {
  try {
    await config.storage?.removeItem("store");
    await config.storage?.removeItem("recentConnectorId");
    await config.storage?.removeItem("injected.connected");

    if (connector?.id) {
      await config.storage?.setItem(`${connector.id}.disconnected`, true);
    }
  } catch (error) {
    console.warn("Failed to clear persisted wallet state", error);
  }

  clearWalletSessionStorage();
}

function DisconnectWalletButton() {
  const { connector } = useAccount();
  const config = useConfig();
  const { disconnectAsync, isPending } = useDisconnect();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (disconnecting || isPending) return;

    setDisconnecting(true);
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch (error) {
      console.warn("Wallet disconnect failed, clearing local session anyway", error);
    } finally {
      await forgetWalletConnection(config, connector);
      setDisconnecting(false);
    }
  };

  return (
    <button
      aria-label="Disconnect wallet"
      className="wallet-chip"
      disabled={disconnecting || isPending}
      onClick={handleDisconnect}
      title="Disconnect wallet"
      type="button"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">{disconnecting || isPending ? "Disconnecting" : "Disconnect"}</span>
    </button>
  );
}

function ConnectedWalletControls({ account, chain, openAccountModal, openChainModal }) {
  if (chain.unsupported) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button className="wallet-chip wallet-chip-warning" onClick={openChainModal} type="button">
          <AlertTriangle size={16} />
          <span className="hidden sm:inline">Wrong Network</span>
        </button>
        <DisconnectWalletButton />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button className="wallet-chip hidden sm:inline-flex" onClick={openChainModal} type="button">
        {chain.hasIcon && chain.iconUrl ? (
          <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white">
            <img alt={chain.name ?? "Chain icon"} className="h-5 w-5" src={chain.iconUrl} />
          </span>
        ) : (
          <Wallet size={15} />
        )}
        <span>{chain.name}</span>
      </button>
      <button className="wallet-chip wallet-chip-strong" onClick={openAccountModal} type="button">
        <Wallet size={16} />
        <span className="max-w-24 truncate sm:max-w-32">{account.displayName}</span>
        <ChevronDown size={14} />
      </button>
      <DisconnectWalletButton />
    </div>
  );
}

export default function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        authenticationStatus,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            className="min-w-0"
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected ? (
              <button className="wallet-chip" onClick={openConnectModal} type="button">
                <Wallet size={16} />
                <span className="hidden min-[380px]:inline">Connect Wallet</span>
                <span className="min-[380px]:hidden">Wallet</span>
              </button>
            ) : (
              <ConnectedWalletControls
                account={account}
                chain={chain}
                openAccountModal={openAccountModal}
                openChainModal={openChainModal}
              />
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
